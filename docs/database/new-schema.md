# Database Schema — Revised

This document is the authoritative database design. It folds in the KPI scoring model from the previous revision **and** resolves the structural gaps identified during review:

1. No identity/auth surface
2. No history for goal/KPI progress
3. No goal/review discussion threads
4. No template version control
5. `users.department_id` is mutable, breaking historical reports
6. `performance_cycles` lacks a timezone
7. `audit_logs` will not scale without partitioning
8. KPI weight (`Σ = 100` per employee) enforced only at app layer

Naming change: `job_function` is renamed `job_category` everywhere.

**Intentionally kept lean** (out of scope for now):

- **Reviews are single-rater**: only `self` and `manager` evaluate. No peer / 360 / direct-report review.
- **KPI scoring is linear only**: achievement ratio = `current / target`. No alternate scoring rules, thresholds, or caps.
- **Departments are externally provisioned**: the `departments` table is a read-only reference seeded from the org's source-of-truth (HR system). This service does not create, edit, or retire departments.
- **No separate participant roster**: a cycle's roster is its set of [`performance_reviews`](#performance_reviews) rows (one per employee). HR generates these at cycle start; excluding someone means not creating their row.

---

## Table of Contents

- [Overview](#overview)
- [Design Decisions](#design-decisions)
- [Entity Relationship Summary](#entity-relationship-summary)
- [Tables](#tables)
  - [Identity & Org](#identity--org)
    - [users](#users)
    - [user_identities](#user_identities)
    - [user_department_history](#user_department_history)
    - [roles](#roles)
    - [user_roles](#user_roles)
    - [departments](#departments)
  - [Cycles & Templates](#cycles--templates)
    - [performance_cycles](#performance_cycles)
    - [evaluation_templates](#evaluation_templates)
    - [template_versions](#template_versions)
    - [template_questions](#template_questions)
    - [cycle_template_assignments](#cycle_template_assignments)
  - [Goals & KPIs](#goals--kpis)
    - [goals](#goals)
    - [goal_progress_updates](#goal_progress_updates)
    - [goal_reviews](#goal_reviews)
    - [goal_comments](#goal_comments)
    - [kpis](#kpis)
    - [kpi_assignments](#kpi_assignments)
    - [kpi_progress_snapshots](#kpi_progress_snapshots)
    - [kpi_result_confirmations](#kpi_result_confirmations)
  - [Reviews & Appeals](#reviews--appeals)
    - [performance_reviews](#performance_reviews)
    - [review_responses](#review_responses)
    - [review_comments](#review_comments)
    - [review_documents](#review_documents)
    - [appeals](#appeals)
    - [appeal_responses](#appeal_responses)
  - [Cross-cutting](#cross-cutting)
    - [notifications](#notifications)
    - [audit_logs](#audit_logs)
    - [security_violation_logs](#security_violation_logs)
- [Enums](#enums)
- [Constraints & Triggers](#constraints--triggers)
- [Indexes & Partitioning](#indexes--partitioning)
- [Scoring Model](#scoring-model)
- [Design Notes](#design-notes)

---

## Overview

Centralized enterprise Performance Management System serving **Employees**, **Managers**, and **HR**, designed for ~100,000 users across multiple time zones. Domains:

| Domain | Description |
|---|---|
| **Identity & Org** | Users, IdP linkage, RBAC, organizational hierarchy with history |
| **Cycles & Templates** | Versioned templates assigned to cycles by job category |
| **Goal & KPI Management** | SMART goals & KPIs with progress history and threaded discussion |
| **Performance Review** | Self / Manager evaluation with computed scores |
| **Appeals** | Formal challenge of finalized reviews |
| **Compliance & Audit** | Append-only audit logs (partitioned), violation logging |
| **Notifications** | Multi-channel system alerts |

---

## Design Decisions

| # | Issue | Resolution |
|---|---|---|
| 1 | Auth not yet selected | Introduce [`user_identities`](#user_identities) as a forward-looking placeholder. The application can authenticate via any IdP (e.g. Google OAuth) and resolve to a `users` row through this table without further schema changes. |
| 2 | Progress not historized | Add [`goal_progress_updates`](#goal_progress_updates) and [`kpi_progress_snapshots`](#kpi_progress_snapshots). The "current value" columns become caches of the latest entry. |
| 3 | No discussion | Add [`goal_comments`](#goal_comments) and [`review_comments`](#review_comments) with thread support via `parent_comment_id`. |
| 4 | Template editing breaks history | Introduce [`template_versions`](#template_versions). Questions belong to a version, not the template. Reviews reference the exact version they were rendered from. Editing a published template creates a new version. |
| 5 | Department mobility loses reporting fidelity | Add [`user_department_history`](#user_department_history). Time-travel reports ("who was in Sales on 2025-06-30") read from the history table. |
| 6 | Cycle deadlines ambiguous globally | Add `timezone` (IANA TZ identifier) on [`performance_cycles`](#performance_cycles). Deadlines are interpreted in that zone. |
| 7 | Audit log scale | Declare [`audit_logs`](#audit_logs) as a **range-partitioned** table on `occurred_at` (monthly partitions). |
| 8 | Weight invariant fragile | Enforce `Σ kpi_assignments.weight = 100` per `(cycle_id, user_id)` via a deferrable PostgreSQL trigger. See [Constraints & Triggers](#constraints--triggers). |

---

## Entity Relationship Summary

```mermaid
erDiagram
    users ||--o{ user_identities         : "external ids"
    users ||--o{ user_roles              : "has"
    roles ||--o{ user_roles              : "assigned via"
    users ||--o{ user_department_history : "moves through"
    departments ||--o{ users             : "currently in"
    departments ||--o{ user_department_history : "tracks"

    performance_cycles ||--o{ cycle_template_assignments : "configures"
    evaluation_templates ||--o{ template_versions        : "has versions"
    template_versions ||--o{ template_questions          : "contains"
    template_versions ||--o{ cycle_template_assignments  : "pinned by"

    performance_cycles ||--o{ goals : "contains"
    users              ||--o{ goals : "owns"
    goals              ||--o{ goal_progress_updates : "tracked by"
    goals              ||--o{ goal_reviews          : "reviewed by manager"
    goals              ||--o{ goal_comments         : "discussed in"

    performance_cycles ||--o{ kpis              : "contains"
    kpis               ||--o{ kpi_assignments    : "assigned via"
    users              ||--o{ kpi_assignments    : "responsible for"
    kpi_assignments    ||--o{ kpi_progress_snapshots : "tracked by"
    performance_reviews ||--o{ kpi_result_confirmations : "confirmed by employee"

    performance_cycles  ||--o{ performance_reviews : "contains"
    users               ||--o{ performance_reviews : "evaluated in"
    template_versions   ||--o{ performance_reviews : "rendered from"
    performance_reviews ||--o{ review_responses    : "has responses"
    template_questions  ||--o{ review_responses    : "answered in"
    performance_reviews ||--o{ review_comments     : "discussed in"
    performance_reviews ||--o{ review_documents    : "evidenced by"

    performance_reviews ||--o{ appeals          : "appealed via"
    appeals             ||--o{ appeal_responses : "has replies"

    users ||--o{ notifications        : "receives"
    users ||--o{ audit_logs           : "generates"
    users ||--o{ security_violation_logs : "attempts"
```

---

## Tables

### Identity & Org

#### `users`

System users (employees, managers, HR, admins). Identity resolution from external IdPs happens via [`user_identities`](#user_identities).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `employee_id` | `VARCHAR(64)` | `UNIQUE, NOT NULL` | Company-issued employee ID |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Corporate email (canonical, maintained by HR) |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Display name |
| `english_name` | `VARCHAR(255)` | `NULLABLE` | Optional English display name |
| `avatar_url` | `TEXT` | `NULLABLE` | Optional profile image URL or asset path |
| `department_id` | `UUID` | `FK → departments.id, NOT NULL` | **Current** department; history in [`user_department_history`](#user_department_history) |
| `manager_id` | `UUID` | `FK → users.id, NULLABLE` | Current direct manager |
| `job_title` | `VARCHAR(128)` | `NOT NULL` | Free-text title (e.g. "Senior Software Engineer") |
| `job_category` | `VARCHAR(64)` | `NOT NULL` | e.g. `engineering`, `sales`, `hr`. Drives template assignment |
| `location` | `VARCHAR(128)` | `NULLABLE` | Work location shown on employee profile |
| `employment_status` | `employment_status_enum` | `NOT NULL, DEFAULT 'active'` | |
| `mfa_enabled` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Mirrored from IdP `amr` claim |
| `locale` | `VARCHAR(10)` | `NOT NULL, DEFAULT 'zh-TW'` | BCP 47 |
| `timezone` | `VARCHAR(64)` | `NOT NULL, DEFAULT 'Asia/Taipei'` | IANA TZ for personalized display |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `terminated_at` | `TIMESTAMPTZ` | `NULLABLE` | Soft-termination |

---

#### `user_identities`

Maps external identity-provider subjects (e.g. Google OIDC `sub`) to internal users. Forward-looking placeholder; multiple rows per user supported for future SSO migrations.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `user_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `provider` | `identity_provider_enum` | `NOT NULL` | `google`, `azure_ad`, `okta`, `local` |
| `provider_subject` | `VARCHAR(255)` | `NOT NULL` | Immutable IdP subject (e.g. Google `sub`) |
| `provider_email` | `VARCHAR(255)` | `NULLABLE` | Email reported by IdP at link time (informational; not used for resolution) |
| `linked_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `last_login_at` | `TIMESTAMPTZ` | `NULLABLE` | |

**Unique:** `(provider, provider_subject)`. A user may have multiple providers; one provider may only resolve to one user.

> **Resolution rule:** Login lookups always join on `(provider, provider_subject)`. If no row exists, the application falls back to matching `users.email` to the IdP-asserted email — **only when** the IdP is the corporate domain — and JIT-creates the `user_identities` row on first successful login. The `users` row itself is never created via login; it must be provisioned by HR.

---

#### `user_department_history`

Append-only record of department membership over time. Powers historical reporting that does not break when an employee transfers mid-cycle.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK, NOT NULL` | |
| `user_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `department_id` | `UUID` | `FK → departments.id, NOT NULL` | |
| `effective_from` | `TIMESTAMPTZ` | `NOT NULL` | Start of this membership |
| `effective_to` | `TIMESTAMPTZ` | `NULLABLE` | NULL = currently in this department |
| `recorded_by` | `UUID` | `FK → users.id, NOT NULL` | HR who recorded the change |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**Invariant:** for each `user_id`, at most one row has `effective_to IS NULL`. A transfer closes the current row by setting `effective_to = now()` and inserts a new open row. Enforced by the application; verifiable by a partial unique index.

---

#### `roles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `name` | `VARCHAR(64)` | `UNIQUE, NOT NULL` | `employee`, `manager`, `hr`, `admin` |
| `description` | `TEXT` | `NULLABLE` | |

---

#### `user_roles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `role_id` | `UUID` | `FK → roles.id, NOT NULL` | |
| `granted_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `granted_by` | `UUID` | `FK → users.id, NOT NULL` | |

**Primary Key:** `(user_id, role_id)`

---

#### `departments`

Tree-structured organizational units. **Read-only reference table**: rows are provisioned and maintained by the org's source-of-truth (HR system) and seeded into this database. This service never creates, edits, or deletes departments — it only reads them to resolve `users.department_id` and historical references.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL` | Stable ID from the source system |
| `name` | `VARCHAR(128)` | `NOT NULL` | |
| `parent_id` | `UUID` | `FK → departments.id, NULLABLE` | NULL = root; tree is acyclic by source-system guarantee |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | When the row was seeded |

> Because departments are externally owned, there is no closure/reopen lifecycle in this schema. If the source system retires a department, the seed simply stops listing it as active; existing `user_department_history` rows continue to reference it by ID.

---

### Cycles & Templates

#### `performance_cycles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `name` | `VARCHAR(128)` | `NOT NULL` | e.g. `2025 Q4 Quarterly Review` |
| `cycle_type` | `cycle_type_enum` | `NOT NULL` | |
| `status` | `cycle_status_enum` | `NOT NULL, DEFAULT 'not_started'` | |
| `timezone` | `VARCHAR(64)` | `NOT NULL, DEFAULT 'Asia/Taipei'` | IANA TZ. All deadlines below are interpreted in this zone |
| `cycle_start` | `TIMESTAMPTZ` | `NOT NULL` | 考核週期開始日 |
| `cycle_end` | `TIMESTAMPTZ` | `NOT NULL` | 考核週期結束日 |
| `manager_eval_start` | `TIMESTAMPTZ` | `NOT NULL` | |
| `manager_eval_end` | `TIMESTAMPTZ` | `NOT NULL` | |
| `hr_review_end` | `TIMESTAMPTZ` | `NOT NULL` | |
| `results_published_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `appeal_deadline_days` | `INTEGER` | `NOT NULL, DEFAULT 7` | |
| `is_locked` | `BOOLEAN` | `NOT NULL, DEFAULT false` | |
| `created_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

> Timestamps remain `TIMESTAMPTZ` (always stored as UTC). The `timezone` column tells the UI which wall-clock day a deadline ends on, so "midnight on the 30th" is unambiguous for a global org.

---

#### `evaluation_templates`

Logical template identity. Concrete question content lives in [`template_versions`](#template_versions).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `name` | `VARCHAR(128)` | `NOT NULL` | |
| `description` | `TEXT` | `NULLABLE` | |
| `job_category` | `VARCHAR(64)` | `NULLABLE` | If set, restricts which job categories can use this template |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Soft delete |
| `created_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

#### `template_versions`

Immutable snapshot of a template's question set. Editing a template always creates a new version; existing reviews remain pinned to the version they were rendered from.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `template_id` | `UUID` | `FK → evaluation_templates.id, NOT NULL` | |
| `version_number` | `INTEGER` | `NOT NULL` | Monotonically increasing per template, starts at 1 |
| `is_current` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Exactly one current version per template |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | Set when version is first assigned to a cycle |
| `created_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**Unique:** `(template_id, version_number)`. Partial unique index on `(template_id) WHERE is_current` enforces single current version.

> Once a version is referenced by any [`cycle_template_assignments`](#cycle_template_assignments) row, its `template_questions` rows become immutable. Edits create a new version.

---

#### `template_questions`

Questions belong to a `template_version`, not directly to a template.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `template_version_id` | `UUID` | `FK → template_versions.id, NOT NULL` | |
| `question_text` | `TEXT` | `NOT NULL` | |
| `question_type` | `question_type_enum` | `NOT NULL` | `rating`, `text`, `boolean` |
| `rating_scale_max` | `INTEGER` | `NULLABLE` | Required if `question_type = 'rating'` |
| `weight` | `NUMERIC(5,2)` | `NULLABLE` | % contribution to `review_score`. NULL = qualitative, not scored. Sum of non-null weights per template version = 100 |
| `is_required` | `BOOLEAN` | `NOT NULL, DEFAULT true` | |
| `sort_order` | `INTEGER` | `NOT NULL, DEFAULT 0` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

#### `cycle_template_assignments`

Pins a specific template **version** to a cycle for a job category.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `cycle_id` | `UUID` | `FK → performance_cycles.id, NOT NULL` | |
| `template_version_id` | `UUID` | `FK → template_versions.id, NOT NULL` | Pins exact version |
| `job_category` | `VARCHAR(64)` | `NOT NULL` | |
| `created_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**Unique:** `(cycle_id, job_category)`

---

### Goals & KPIs

#### `goals`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `cycle_id` | `UUID` | `FK → performance_cycles.id, NOT NULL` | |
| `owner_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `set_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `goal_type` | `goal_type_enum` | `NOT NULL` | `individual` / `team` |
| `title` | `VARCHAR(255)` | `NOT NULL` | |
| `description` | `TEXT` | `NULLABLE` | SMART description |
| `progress_percent` | `INTEGER` | `NOT NULL, DEFAULT 0` | Current completion percentage, `0` to `100`; cached from latest [`goal_progress_updates`](#goal_progress_updates) |
| `due_date` | `DATE` | `NULLABLE` | |
| `status` | `goal_status_enum` | `NOT NULL, DEFAULT 'pending_review'` | |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | |

> Goals are **qualitative**: they are tracked (status, progress, discussion) but carry no weight and do not feed `kpi_score` or `review_score`. Quantitative scoring is the job of KPIs. See [Scoring Model](#scoring-model).

---

#### `goal_progress_updates`

Append-only progress history. The latest entry's percentage is also cached on `goals.progress_percent` for fast reads.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `goal_id` | `UUID` | `FK → goals.id, NOT NULL` | |
| `progress_percent` | `INTEGER` | `NOT NULL` | Completion percentage, `0` to `100` |
| `note` | `TEXT` | `NULLABLE` | Update commentary |
| `updated_by` | `UUID` | `FK → users.id, NOT NULL` | Usually `goals.owner_id`; managers can also update |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

#### `goal_reviews`

Append-only manager decisions for employee-submitted goals. Employee APIs project the latest row as `goal.latest_review` and the review-result endpoint.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `goal_id` | `UUID` | `FK → goals.id, NOT NULL` | |
| `decision` | `goal_review_decision_enum` | `NOT NULL` | |
| `comment` | `TEXT` | `NULLABLE` | Manager-facing review comment shown to the employee |
| `reviewed_by` | `UUID` | `FK → users.id, NOT NULL` | Reviewing manager |
| `reviewed_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

#### `goal_comments`

Threaded discussion attached to a goal.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `goal_id` | `UUID` | `FK → goals.id, NOT NULL` | |
| `parent_comment_id` | `UUID` | `FK → goal_comments.id, NULLABLE` | NULL = top-level reply |
| `author_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `body` | `TEXT` | `NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `edited_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | Soft delete; body becomes hidden but reply graph preserved |

---

#### `kpis`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `cycle_id` | `UUID` | `FK → performance_cycles.id, NOT NULL` | |
| `created_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `kpi_type` | `goal_type_enum` | `NOT NULL` | `individual` / `team` |
| `title` | `VARCHAR(255)` | `NOT NULL` | |
| `description` | `TEXT` | `NULLABLE` | |
| `unit` | `VARCHAR(32)` | `NULLABLE` | Display only (e.g. `%`, `NTD`, `tickets`) |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | |

> KPI achievement is scored **linearly**: `ratio = current / target`. See [Scoring Model](#scoring-model).

---

#### `kpi_assignments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `kpi_id` | `UUID` | `FK → kpis.id, NOT NULL` | |
| `user_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `weight` | `NUMERIC(5,2)` | `NOT NULL, DEFAULT 0` | % contribution to this user's `kpi_score`. Sum per `(cycle_id, user_id)` = 100, trigger-enforced |
| `target_value` | `NUMERIC(15,4)` | `NOT NULL` | |
| `current_value` | `NUMERIC(15,4)` | `NULLABLE` | **Cached** latest snapshot |
| `last_updated_at` | `TIMESTAMPTZ` | `NULLABLE` | |

**Primary Key:** `(kpi_id, user_id)`

> `weight` lives here, not on `kpis`, because the same KPI can be assigned to multiple employees whose KPI mixes differ. Putting weight per-assignment lets each employee's weights sum to 100 independently.

---

#### `kpi_progress_snapshots`

Append-only history of KPI progress per assignment. Powers trend dashboards and prevents data loss when current value is overwritten.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK, NOT NULL` | |
| `kpi_id` | `UUID` | `FK → kpis.id, NOT NULL` | |
| `user_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `value` | `NUMERIC(15,4)` | `NOT NULL` | |
| `note` | `TEXT` | `NULLABLE` | |
| `recorded_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**FK pair:** `(kpi_id, user_id)` references `kpi_assignments(kpi_id, user_id)`.

---

#### `kpi_result_confirmations`

One confirmation record per employee review once a published KPI result is accepted by the employee.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `review_id` | `UUID` | `FK → performance_reviews.id, NOT NULL` | KPI result/review being confirmed |
| `confirmed_by` | `UUID` | `FK → users.id, NOT NULL` | Usually `performance_reviews.employee_id` |
| `confirmed_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**Unique:** `(review_id)`

---

### Reviews & Appeals

#### `performance_reviews`

One row per employee per cycle. **Doubles as the cycle roster** — the set of rows for a given `cycle_id` is the authoritative list of who participates. Tracks the full lifecycle: self-eval → manager eval → HR review.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `cycle_id` | `UUID` | `FK → performance_cycles.id, NOT NULL` | |
| `employee_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `manager_id` | `UUID` | `FK → users.id, NOT NULL` | Primary reviewing manager |
| `co_manager_id` | `UUID` | `FK → users.id, NULLABLE` | Mid-cycle transfer support |
| `template_version_id` | `UUID` | `FK → template_versions.id, NOT NULL` | Pins exact version used |
| `status` | `review_status_enum` | `NOT NULL, DEFAULT 'pending_self_eval'` | |
| `self_submitted_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `self_withdrawn_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `manager_submitted_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `hr_approved_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `final_rating` | `rating_scale_enum` | `NULLABLE` | |
| `manager_comment` | `TEXT` | `NULLABLE` | |
| `kpi_score` | `NUMERIC(6,2)` | `NULLABLE` | Computed; see [Scoring Model](#scoring-model) |
| `review_score` | `NUMERIC(6,2)` | `NULLABLE` | Computed; see [Scoring Model](#scoring-model) |
| `score_computed_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `is_terminated_employee` | `BOOLEAN` | `NOT NULL, DEFAULT false` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**Unique:** `(cycle_id, employee_id)`

---

#### `review_responses`

Individual answers to template questions within a review. Stores both self-eval and manager responses.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `review_id` | `UUID` | `FK → performance_reviews.id, NOT NULL` | |
| `question_id` | `UUID` | `FK → template_questions.id, NOT NULL` | |
| `respondent_type` | `respondent_type_enum` | `NOT NULL` | `self` or `manager` |
| `rating_value` | `INTEGER` | `NULLABLE` | For rating questions |
| `text_value` | `TEXT` | `NULLABLE` | |
| `boolean_value` | `BOOLEAN` | `NULLABLE` | For boolean questions |
| `responded_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

**Unique:** `(review_id, question_id, respondent_type)` — one self answer and one manager answer per question.

---

#### `review_comments`

Threaded discussion attached to a review (e.g. employee-manager dialogue during review).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `review_id` | `UUID` | `FK → performance_reviews.id, NOT NULL` | |
| `parent_comment_id` | `UUID` | `FK → review_comments.id, NULLABLE` | |
| `author_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `visibility` | `comment_visibility_enum` | `NOT NULL, DEFAULT 'participants'` | `participants` / `manager_hr_only` / `hr_only` |
| `body` | `TEXT` | `NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `edited_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | |

---

#### `review_documents`

Documents (e.g. from Google Drive) pinned as evidence.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `review_id` | `UUID` | `FK → performance_reviews.id, NOT NULL` | |
| `source_system` | `VARCHAR(64)` | `NOT NULL` | e.g. `google_drive` |
| `source_document_id` | `VARCHAR(255)` | `NOT NULL` | |
| `document_name` | `VARCHAR(255)` | `NOT NULL` | |
| `source_url` | `TEXT` | `NULLABLE` | |
| `is_pinned` | `BOOLEAN` | `NOT NULL, DEFAULT false` | |
| `is_accessible` | `BOOLEAN` | `NOT NULL, DEFAULT true` | |
| `last_sync_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `pinned_by` | `UUID` | `FK → users.id, NULLABLE` | |
| `pinned_at` | `TIMESTAMPTZ` | `NULLABLE` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

#### `appeals`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `review_id` | `UUID` | `FK → performance_reviews.id, NOT NULL` | |
| `case_no` | `VARCHAR(32)` | `UNIQUE, NOT NULL` | Stable human-readable appeal number |
| `filed_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `assigned_to_type` | `appeal_assignee_enum` | `NOT NULL` | |
| `assigned_to` | `UUID` | `FK → users.id, NOT NULL` | |
| `reason` | `TEXT` | `NOT NULL` | |
| `status` | `appeal_status_enum` | `NOT NULL, DEFAULT 'submitted'` | |
| `filed_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `resolved_at` | `TIMESTAMPTZ` | `NULLABLE` | |

**Unique:** `(review_id)`

---

#### `appeal_responses`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `appeal_id` | `UUID` | `FK → appeals.id, NOT NULL` | |
| `responded_by` | `UUID` | `FK → users.id, NOT NULL` | |
| `visibility` | `comment_visibility_enum` | `NOT NULL, DEFAULT 'participants'` | `participants` replies are visible to the employee; HR-only notes stay internal |
| `response_text` | `TEXT` | `NOT NULL` | |
| `is_final` | `BOOLEAN` | `NOT NULL, DEFAULT false` | |
| `responded_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

### Cross-cutting

#### `notifications`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | |
| `recipient_id` | `UUID` | `FK → users.id, NOT NULL` | |
| `notification_type` | `notification_type_enum` | `NOT NULL` | |
| `review_id` | `UUID` | `FK → performance_reviews.id, NULLABLE` | |
| `appeal_id` | `UUID` | `FK → appeals.id, NULLABLE` | |
| `goal_id` | `UUID` | `FK → goals.id, NULLABLE` | |
| `title` | `VARCHAR(255)` | `NOT NULL` | |
| `body` | `TEXT` | `NOT NULL` | |
| `channel` | `notification_channel_enum` | `NOT NULL` | |
| `is_read` | `BOOLEAN` | `NOT NULL, DEFAULT false` | |
| `read_at` | `TIMESTAMPTZ` | `NULLABLE` | Set when `is_read` flips to true |
| `sent_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |

---

#### `audit_logs`

**Append-only, partitioned by month on `occurred_at`.**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `NOT NULL` | Sequential ordering |
| `actor_id` | `UUID` | `FK → users.id, NULLABLE` | NULL for system events |
| `actor_email` | `VARCHAR(255)` | `NOT NULL` | Snapshot of email at action time |
| `action` | `audit_action_enum` | `NOT NULL` | |
| `resource_type` | `VARCHAR(64)` | `NOT NULL` | |
| `resource_id` | `UUID` | `NOT NULL` | |
| `old_value` | `JSONB` | `NULLABLE` | |
| `new_value` | `JSONB` | `NULLABLE` | |
| `ip_address` | `INET` | `NULLABLE` | |
| `user_agent` | `TEXT` | `NULLABLE` | |
| `occurred_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Partition key |

**Primary Key:** `(id, occurred_at)` — partitioned tables in PostgreSQL require the partition key in the PK.

> Partitioning DDL is in [Indexes & Partitioning](#indexes--partitioning). Immutability policy (no UPDATE/DELETE) is in [Design Notes](#design-notes).

---

#### `security_violation_logs`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK, NOT NULL` | |
| `attempted_by` | `UUID` | `NULLABLE` | |
| `attempted_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | |
| `violation_type` | `VARCHAR(128)` | `NOT NULL` | |
| `details` | `TEXT` | `NULLABLE` | |

---

## Enums

```sql
CREATE TYPE rating_scale_enum AS ENUM (
  'outstanding', 'exceeds_expectations', 'meets_expectations',
  'needs_improvement', 'unacceptable'
);

CREATE TYPE employment_status_enum AS ENUM (
  'active', 'on_leave', 'terminated'
);

CREATE TYPE cycle_type_enum AS ENUM (
  'annual', 'quarterly', 'probation'
);

CREATE TYPE cycle_status_enum AS ENUM (
  'not_started', 'in_progress', 'locked', 'results_published', 'completed', 'closed'
);

CREATE TYPE goal_type_enum AS ENUM (
  'individual', 'team'
);

CREATE TYPE goal_status_enum AS ENUM (
  'pending_review', 'in_progress', 'revision_requested', 'completed', 'cancelled'
);

CREATE TYPE goal_review_decision_enum AS ENUM (
  'approved', 'revision_requested', 'cancelled'
);

CREATE TYPE review_status_enum AS ENUM (
  'pending_self_eval', 'self_eval_in_progress',
  'pending_manager_eval', 'manager_eval_in_progress',
  'pending_hr_review', 'completed', 'terminated'
);

CREATE TYPE respondent_type_enum AS ENUM (
  'self', 'manager'
);

CREATE TYPE question_type_enum AS ENUM (
  'rating', 'text', 'boolean'
);

CREATE TYPE appeal_assignee_enum AS ENUM (
  'senior_manager', 'hr'
);

CREATE TYPE appeal_status_enum AS ENUM (
  'submitted', 'under_review', 'need_more_info', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE notification_type_enum AS ENUM (
  'goal_published', 'kpi_published', 'goal_updated',
  'self_eval_reminder', 'manager_eval_reminder',
  'results_published', 'appeal_received', 'appeal_responded', 'appeal_decided'
);

CREATE TYPE notification_channel_enum AS ENUM (
  'email', 'push', 'in_app'
);

CREATE TYPE audit_action_enum AS ENUM (
  'create', 'read', 'update', 'delete',
  'publish', 'withdraw', 'submit', 'approve',
  'login', 'logout',
  'appeal_filed', 'appeal_responded',
  'department_change', 'role_grant', 'role_revoke'
);

CREATE TYPE identity_provider_enum AS ENUM (
  'google', 'azure_ad', 'okta', 'local'
);

CREATE TYPE comment_visibility_enum AS ENUM (
  'participants', 'manager_hr_only', 'hr_only'
);
```

---

## Constraints & Triggers

### KPI weight = 100 invariant (resolves issue #8)

A deferrable constraint trigger enforces that each employee's KPI weights sum to exactly 100 per cycle, evaluated at transaction commit. Weights live on `kpi_assignments` (per user); the cycle is resolved by joining to `kpis`:

```sql
CREATE OR REPLACE FUNCTION assert_kpi_weight_sum() RETURNS trigger AS $$
DECLARE
  v_cycle_id UUID;
  v_user_id  UUID;
  total      NUMERIC(7,2);
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  SELECT k.cycle_id INTO v_cycle_id
  FROM kpis k
  WHERE k.id = COALESCE(NEW.kpi_id, OLD.kpi_id);

  SELECT COALESCE(SUM(ka.weight), 0) INTO total
  FROM kpi_assignments ka
  JOIN kpis k ON k.id = ka.kpi_id
  WHERE k.cycle_id = v_cycle_id
    AND ka.user_id = v_user_id
    AND k.deleted_at IS NULL;

  IF total <> 0 AND total <> 100 THEN
    RAISE EXCEPTION 'Sum of kpi_assignments.weight for (cycle=%, user=%) must equal 100, got %',
      v_cycle_id, v_user_id, total;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_kpi_weight_sum
  AFTER INSERT OR UPDATE OR DELETE ON kpi_assignments
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION assert_kpi_weight_sum();
```

Total = 0 is permitted to allow intermediate transaction states; the application also explicitly validates non-zero before publishing. Goals carry no weight and have no equivalent constraint.

### Audit log immutability (preserved from original)

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON audit_logs
  FOR INSERT TO application_role WITH CHECK (true);

CREATE OR REPLACE FUNCTION block_audit_mutation() RETURNS trigger AS $$
BEGIN
  INSERT INTO security_violation_logs (attempted_by, violation_type, details)
  VALUES (current_setting('app.actor_id', true)::uuid,
          'audit_log_mutation_attempt',
          format('op=%s row_id=%s', TG_OP, OLD.id));
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION block_audit_mutation();
```

### Template version freeze

When a `template_version` is first referenced by a `cycle_template_assignments` row, its `template_questions` become read-only:

```sql
CREATE OR REPLACE FUNCTION assert_template_version_unfrozen() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cycle_template_assignments
    WHERE template_version_id = COALESCE(NEW.template_version_id, OLD.template_version_id)
  ) THEN
    RAISE EXCEPTION 'template_version is frozen (referenced by a cycle); create a new version to make changes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_template_questions_freeze
  BEFORE INSERT OR UPDATE OR DELETE ON template_questions
  FOR EACH ROW EXECUTE FUNCTION assert_template_version_unfrozen();
```

### Department history consistency

Partial unique index ensures only one open membership per user:

```sql
CREATE UNIQUE INDEX uniq_user_open_department
  ON user_department_history(user_id)
  WHERE effective_to IS NULL;
```

---

## Indexes & Partitioning

### Indexes

```sql
-- users
CREATE INDEX idx_users_department_id   ON users(department_id);
CREATE INDEX idx_users_manager_id      ON users(manager_id);
CREATE INDEX idx_users_employment      ON users(employment_status);
CREATE INDEX idx_users_job_category    ON users(job_category);

-- user_identities
CREATE INDEX idx_user_identities_user  ON user_identities(user_id);

-- user_department_history
CREATE INDEX idx_udh_user_effective    ON user_department_history(user_id, effective_from DESC);

-- template_versions
CREATE UNIQUE INDEX uniq_template_current_version
  ON template_versions(template_id) WHERE is_current;

-- performance_reviews
CREATE INDEX idx_reviews_cycle_id      ON performance_reviews(cycle_id);
CREATE INDEX idx_reviews_employee_id   ON performance_reviews(employee_id);
CREATE INDEX idx_reviews_manager_id    ON performance_reviews(manager_id);
CREATE INDEX idx_reviews_status        ON performance_reviews(status);

-- review_responses
CREATE INDEX idx_review_responses_review_question ON review_responses(review_id, question_id);

-- goals / progress
CREATE INDEX idx_goals_cycle_id        ON goals(cycle_id);
CREATE INDEX idx_goals_owner_id        ON goals(owner_id);
CREATE INDEX idx_goal_updates_goal_time ON goal_progress_updates(goal_id, recorded_at DESC);
CREATE INDEX idx_goal_reviews_goal_time ON goal_reviews(goal_id, reviewed_at DESC);

-- kpis / progress
CREATE INDEX idx_kpi_assignments_user_id  ON kpi_assignments(user_id);
CREATE INDEX idx_kpi_snapshots_assignment ON kpi_progress_snapshots(kpi_id, user_id, recorded_at DESC);
CREATE INDEX idx_kpi_confirmations_user   ON kpi_result_confirmations(confirmed_by);

-- appeals
CREATE INDEX idx_appeals_review_id     ON appeals(review_id);
CREATE INDEX idx_appeals_case_no       ON appeals(case_no);
CREATE INDEX idx_appeals_assigned_to   ON appeals(assigned_to);
CREATE INDEX idx_appeals_status        ON appeals(status);

-- notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

-- audit_logs (within each partition)
CREATE INDEX idx_audit_actor    ON audit_logs(actor_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_occurred ON audit_logs(occurred_at DESC);
```

### `audit_logs` partitioning (resolves issue #7)

Estimated load: 100K users × ~20 actions/day = ~2M rows/day → ~60M/month. Single-table queries become slow and `VACUUM` expensive. Use native range partitioning by month:

```sql
CREATE TABLE audit_logs (
  id            BIGSERIAL,
  actor_id      UUID REFERENCES users(id),
  actor_email   VARCHAR(255) NOT NULL,
  action        audit_action_enum NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id   UUID NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Monthly partitions; created in advance by a scheduled job (e.g. pg_partman)
CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
-- ...
```

> Old partitions (e.g. > 7 years) can be detached and archived to cold storage without touching live data. A monthly cron creates the next partition.

---

## Scoring Model

A review yields two computed numbers plus a human-assigned final rating:

```
kpi_score    = Σ over employee's KPI assignments:
                 (current / target) × assignment.weight

review_score = Σ over template_questions where question_type='rating' AND weight IS NOT NULL:
                 (rating_value / rating_scale_max) × weight                            ∈ [0, 100]

final_rating = HR/manager decision (rating_scale_enum), informed by both numbers.
```

KPI achievement is **linear**: `ratio = current / target`. There is no threshold floor or upper cap — a KPI exceeding its target contributes proportionally more than its weight, which the app surfaces as over-achievement. For KPIs where lower is better (e.g. defect rate), express the target as the inverse metric (e.g. "uptime %") so that higher always means better.

### Worked Example

Alice (`job_category = 'sales'`), cycle `2025 Q4`.

| KPI | weight | target | current | ratio | contribution |
|---|---|---|---|---|---|
| Revenue | 60 | 10M | 9M | 0.90 | 54.0 |
| New clients | 30 | 20 | 24 | 1.20 | 36.0 |
| CSAT | 10 | 90 | 90 | 1.00 | 10.0 |
| | | | | | **`kpi_score = 100.0`** |

| Question | type | weight | rating_value | scale | contribution |
|---|---|---|---|---|---|
| Q1 | rating | 40 | 4/5 | | 32.0 |
| Q2 | rating | 40 | 3/5 | | 24.0 |
| Q3 | rating | 20 | 5/5 | | 20.0 |
| Q4 | text | NULL | — | | not scored |
| | | | | | **`review_score = 76.0`** |

HR sees both, then picks `final_rating = exceeds_expectations`.

---

## Design Notes

### Immutability & soft delete

- `audit_logs`, `user_department_history`, `goal_progress_updates`, `goal_reviews`, `kpi_progress_snapshots`, `kpi_result_confirmations`, `template_questions` (once published) are **append-only**.
- Soft delete everywhere else: `users.terminated_at`, `evaluation_templates.is_active`, `performance_reviews.is_terminated_employee`, `goals.deleted_at`, `kpis.deleted_at`, `goal_comments.deleted_at`, `review_comments.deleted_at`.

### Historical reporting (resolves issue #5)

`users.department_id` reflects the **current** org chart. To answer "who was in Sales on 2025-06-30" or to attribute a past cycle's results to the department the employee was in at the time, read from [`user_department_history`](#user_department_history): pick the membership row whose `[effective_from, effective_to)` window contains the cycle's reference date. Live dashboards use `users.department_id` directly.

### Cycle deadlines (resolves issue #6)

All `TIMESTAMPTZ` columns store UTC. `performance_cycles.timezone` tells the UI which local wall-clock day a deadline lands on. Server-side enforcement uses `occurred_at_utc < deadline_utc`; UI displays `deadline_utc AT TIME ZONE cycle.timezone`.

### Single-rater reviews

Reviews are evaluated by exactly two parties: the employee (`self`) and the assigned manager (`manager`). `review_responses` is keyed by `respondent_type`, so each question has at most one self answer and one manager answer. Peer / 360 / direct-report review is intentionally **not** modeled; if needed later, it would be added via a `review_participants` table plus expanded `respondent_type_enum` without disturbing the existing rows.

### Cycle roster

There is no dedicated participant table. The roster of a cycle is the set of [`performance_reviews`](#performance_reviews) rows sharing that `cycle_id` (unique on `(cycle_id, employee_id)`). HR generates these rows at cycle start for every expected participant; an employee who should not be reviewed simply has no row.

- **Completion rate** is `count(status = 'completed') / count(*)` over the cycle's review rows, with `is_terminated_employee = true` rows excluded from the denominator. Because rows are created up front, the denominator is stable even as `users` changes later.
- **Trade-off accepted:** there is no place to record *why* a specific employee was excluded (the row just doesn't exist). If that becomes a requirement, reintroduce a `cycle_participants` table.

### Template versioning (resolves issue #4)

- Editing a template creates a new `template_version`, leaves all prior versions intact.
- A `cycle_template_assignments` row pins a specific `template_version_id`.
- A review's `template_version_id` makes the rendered form reproducible years later.

### Progress as a first-class concept (resolves issue #2)

`goals.progress_percent` and `kpi_assignments.current_value` are **caches** of the most recent entries in the corresponding history tables. The application writes both atomically. Dashboards and trend charts always query the history tables.

### Discussion (resolves issue #3)

Goal-level and review-level threads use separate tables (`goal_comments`, `review_comments`) rather than a polymorphic comment table, preserving FK integrity. `parent_comment_id` enables threading. `comment_visibility_enum` lets managers post HR-only notes.

### Auth surface (resolves issue #1)

`user_identities` is intentionally minimal: it links external IdP subjects to internal `users`. When SSO is finalized (e.g. Google OIDC), the implementation only needs to: (a) validate the IdP token, (b) look up `(provider, provider_subject)`, (c) issue a session. No further schema change required. Local password auth (e.g. for HR break-glass) would add a sibling table; not designed here.

### Departments are externally provisioned

The `departments` table is a **read-only mirror** of the organization's source-of-truth (e.g. the HR/HRIS system). Rows are seeded and refreshed by an external sync job; this service performs no create / edit / close operations on departments. Consequences:

- There is no department lifecycle (`closed_at`, closure procedure) in this schema — retirement is the source system's concern. When a department is no longer active upstream, the sync stops marking it active, but the row remains so that `users.department_id` and `user_department_history.department_id` references never dangle.
- New users may only be assigned to a `department_id` that exists in the seeded set.

### Encryption at rest

PII columns (`users.email`, `users.full_name`, free-text `review_responses.text_value`, `manager_comment`, `appeal.reason`) must be encrypted at rest via TDE or column-level AES-256 per infrastructure policy.
