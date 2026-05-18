# Phase 0 — Backend Foundation

This document describes the first concrete chunk of backend work: laying the rails that every later feature will travel on. Nothing in this phase is business logic — it is the plumbing that lets us write business logic safely.

## Goals

By the end of Phase 0:

1. A local PostgreSQL is available via `docker compose up`.
2. Schema is managed by **Flyway migrations**, not Hibernate `ddl-auto`.
3. The first migration creates the identity & org tables (`departments`, `users`, `roles`, `user_roles`) from [`new-schema.md`](../database/new-schema.md).
4. Backend boots, connects to the DB, runs migrations, and `/api/v1/health` still passes.

What is **not** in Phase 0:

- JPA entities, repositories, services, controllers — those start in Phase 1.
- Real SSO/auth — stubbed in Phase 1.
- Any KPI / review / cycle tables — added in later migrations.

## Why this order

| Decision | Reason |
|---|---|
| **Flyway over `ddl-auto=update`** | `ddl-auto` is convenient in dev but never safe in prod (auto-drops columns, no audit trail, no rollback). Switching later means rewriting the dev workflow. Switch now while there is nothing to migrate. |
| **Postgres in docker-compose** | The app already targets PG (`spring-boot-starter-data-jpa` + `postgresql` driver). Until now there was no DB to talk to locally. Adding it to the same compose file means `docker compose up` gives a working stack. |
| **Identity tables first** | Almost every later table FK-references `users`. Building reviews / goals / KPIs first means writing migrations that cannot be applied. |
| **No entities yet** | We want one verified migration committed before opening the floodgates. Separates "schema works" from "Java code works" so failures are easier to diagnose. |

## File-by-file plan

### 1. `backend/pom.xml`

Add Flyway core dependency (Spring Boot auto-configures it when present):

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

> Version is inherited from Spring Boot's BOM (3.3.0 → Flyway 10.x).

### 2. `docker-compose.yml`

Add a `postgres` service and wire `backend` to depend on it:

- Image: `postgres:17-alpine`
- Named volume for data persistence
- Healthcheck via `pg_isready`
- Backend gets DB connection via env vars (`DB_HOST=postgres`, etc.)

### 3. `backend/src/main/resources/application.properties`

- Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate` — Hibernate may verify that entities match the schema, but never modify it.
- Add `spring.flyway.enabled=true` (explicit), `spring.flyway.locations=classpath:db/migration`
- Keep existing DB connection settings; they already read from env vars with localhost defaults.

### 4. `backend/src/main/resources/db/migration/V1__init_org.sql`

Single migration creating the identity & org foundation, sized to match [`new-schema.md`](../database/new-schema.md):

| Object | Notes |
|---|---|
| Enum `employment_status_enum` | active / on_leave / terminated |
| Enum `identity_provider_enum` | google / azure_ad / okta / local |
| Enum `audit_action_enum` | (full set, used by future tables — declared now to avoid migration churn) |
| Table `departments` | Tree (parent_id self-FK), with `closed_at` / `closed_by` |
| Table `users` | Includes `job_category`, `timezone`, `mfa_enabled` |
| Table `roles` | Seeded with `employee`, `manager`, `hr`, `admin` |
| Table `user_roles` | Composite PK `(user_id, role_id)` |
| Table `user_identities` | SSO placeholder (Google sub → user_id) |
| Table `user_department_history` | Append-only org-change record |
| Indexes | Per [`new-schema.md` Indexes](../database/new-schema.md#indexes--partitioning) for these tables |

> Audit log table, cycles, templates, goals, KPIs, reviews — **deferred to later migrations** (V2, V3, …). One vertical slice at a time.

## Acceptance check

After this phase, the following must hold:

```bash
# from repo root
docker compose up --build -d postgres backend
docker compose logs backend | grep -E "Flyway|Migrated"
# expect: "Successfully applied 1 migration to schema..."

curl -fsS http://localhost:8080/api/v1/health
# expect: 200 OK

docker compose exec postgres psql -U pms -d pms -c "\dt"
# expect: departments, users, roles, user_roles, user_identities,
#         user_department_history, flyway_schema_history
```

## What comes next (Phase 1 preview)

Once Phase 0 lands, Phase 1 picks up the first vertical slice:

1. JPA `Department` entity + repository
2. `DepartmentService` (business rule: cannot close a department with active users)
3. `DepartmentController` — REST endpoints under `/api/v1/departments`
4. First integration test via Testcontainers (already wired in `pom.xml`)

That slice proves Controller → Service → Repository → DB end-to-end and becomes the template every other CRUD reuses.
