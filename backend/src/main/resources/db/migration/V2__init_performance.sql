-- =====================================================================
-- V2: Performance Management tables
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

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
  'pending_self_eval', 'self_eval_in_progress', 'pending_manager_eval',
  'manager_eval_in_progress', 'pending_hr_review', 'completed', 'terminated'
);

CREATE TYPE rating_scale_enum AS ENUM (
  'outstanding', 'exceeds_expectations', 'meets_expectations',
  'needs_improvement', 'unacceptable'
);

CREATE TYPE appeal_assignee_enum AS ENUM (
  'senior_manager', 'hr'
);

CREATE TYPE appeal_status_enum AS ENUM (
  'submitted', 'under_review', 'need_more_info', 'approved', 'rejected', 'cancelled'
);

-- ---------------------------------------------------------------------
-- performance_cycles
-- ---------------------------------------------------------------------
CREATE TABLE performance_cycles (
  id                   UUID                NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(128)        NOT NULL,
  cycle_type           cycle_type_enum     NOT NULL,
  status               cycle_status_enum   NOT NULL DEFAULT 'not_started',
  timezone             VARCHAR(64)         NOT NULL DEFAULT 'Asia/Taipei',
  self_eval_start      TIMESTAMPTZ         NOT NULL,
  self_eval_end        TIMESTAMPTZ         NOT NULL,
  manager_eval_start   TIMESTAMPTZ         NOT NULL,
  manager_eval_end     TIMESTAMPTZ         NOT NULL,
  hr_review_end        TIMESTAMPTZ         NOT NULL,
  results_published_at TIMESTAMPTZ,
  appeal_deadline_days INTEGER             NOT NULL DEFAULT 7,
  is_locked            BOOLEAN             NOT NULL DEFAULT false,
  created_by           UUID                NOT NULL REFERENCES users(id),
  created_at           TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- performance_reviews
-- ---------------------------------------------------------------------
CREATE TABLE performance_reviews (
  id                     UUID                NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id               UUID                NOT NULL REFERENCES performance_cycles(id),
  employee_id            UUID                NOT NULL REFERENCES users(id),
  manager_id             UUID                NOT NULL REFERENCES users(id),
  co_manager_id          UUID                REFERENCES users(id),
  template_version_id    UUID,
  status                 review_status_enum  NOT NULL DEFAULT 'pending_self_eval',
  self_submitted_at      TIMESTAMPTZ,
  self_withdrawn_at      TIMESTAMPTZ,
  manager_submitted_at   TIMESTAMPTZ,
  hr_approved_at         TIMESTAMPTZ,
  final_rating           rating_scale_enum,
  manager_comment        TEXT,
  kpi_score              NUMERIC(6,2),
  review_score           NUMERIC(6,2),
  score_computed_at      TIMESTAMPTZ,
  is_terminated_employee BOOLEAN             NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, employee_id)
);

-- ---------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------
CREATE TABLE goals (
  id               UUID               NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id         UUID               NOT NULL REFERENCES performance_cycles(id),
  owner_id         UUID               NOT NULL REFERENCES users(id),
  set_by           UUID               NOT NULL REFERENCES users(id),
  goal_type        goal_type_enum     NOT NULL DEFAULT 'individual',
  title            VARCHAR(255)       NOT NULL,
  description      TEXT,
  progress_percent INTEGER            NOT NULL DEFAULT 0,
  due_date         DATE,
  status           goal_status_enum   NOT NULL DEFAULT 'pending_review',
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- goal_progress_updates
-- ---------------------------------------------------------------------
CREATE TABLE goal_progress_updates (
  id               UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id          UUID        NOT NULL REFERENCES goals(id),
  progress_percent INTEGER     NOT NULL,
  note             TEXT,
  updated_by       UUID        NOT NULL REFERENCES users(id),
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- goal_reviews
-- ---------------------------------------------------------------------
CREATE TABLE goal_reviews (
  id          UUID                        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id     UUID                        NOT NULL REFERENCES goals(id),
  decision    goal_review_decision_enum   NOT NULL,
  comment     TEXT,
  reviewed_by UUID                        NOT NULL REFERENCES users(id),
  reviewed_at TIMESTAMPTZ                 NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- kpis
-- ---------------------------------------------------------------------
CREATE TABLE kpis (
  id                  UUID            NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id            UUID            NOT NULL REFERENCES performance_cycles(id),
  created_by          UUID            NOT NULL REFERENCES users(id),
  kpi_type            goal_type_enum  NOT NULL DEFAULT 'individual',
  title               VARCHAR(255)    NOT NULL,
  description         TEXT,
  unit                VARCHAR(32),
  target_operator     VARCHAR(16),
  target_value        NUMERIC(15,4),
  target_unit         VARCHAR(32),
  target_display_text VARCHAR(255),
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- kpi_assignments
-- ---------------------------------------------------------------------
CREATE TABLE kpi_assignments (
  kpi_id          UUID            NOT NULL REFERENCES kpis(id),
  user_id         UUID            NOT NULL REFERENCES users(id),
  weight          NUMERIC(5,2)    NOT NULL DEFAULT 0,
  target_value    NUMERIC(15,4)   NOT NULL,
  current_value   NUMERIC(15,4),
  last_updated_at TIMESTAMPTZ,
  PRIMARY KEY (kpi_id, user_id)
);

-- ---------------------------------------------------------------------
-- kpi_progress_snapshots
-- ---------------------------------------------------------------------
CREATE TABLE kpi_progress_snapshots (
  id          BIGSERIAL   NOT NULL PRIMARY KEY,
  kpi_id      UUID        NOT NULL,
  user_id     UUID        NOT NULL,
  value       NUMERIC(15,4) NOT NULL,
  note        TEXT,
  recorded_by UUID        NOT NULL REFERENCES users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (kpi_id, user_id) REFERENCES kpi_assignments(kpi_id, user_id)
);

-- ---------------------------------------------------------------------
-- kpi_result_confirmations
-- ---------------------------------------------------------------------
CREATE TABLE kpi_result_confirmations (
  id           UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID        NOT NULL UNIQUE REFERENCES performance_reviews(id),
  confirmed_by UUID        NOT NULL REFERENCES users(id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- appeals
-- ---------------------------------------------------------------------
CREATE TABLE appeals (
  id               UUID                  NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id        UUID                  NOT NULL UNIQUE REFERENCES performance_reviews(id),
  case_no          VARCHAR(32)           NOT NULL UNIQUE,
  filed_by         UUID                  NOT NULL REFERENCES users(id),
  assigned_to_type appeal_assignee_enum  NOT NULL,
  assigned_to      UUID                  NOT NULL REFERENCES users(id),
  reason           TEXT                  NOT NULL,
  status           appeal_status_enum    NOT NULL DEFAULT 'submitted',
  filed_at         TIMESTAMPTZ           NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- appeal_responses
-- ---------------------------------------------------------------------
CREATE TABLE appeal_responses (
  id            UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id     UUID        NOT NULL REFERENCES appeals(id),
  responded_by  UUID        NOT NULL REFERENCES users(id),
  response_text TEXT        NOT NULL,
  is_final      BOOLEAN     NOT NULL DEFAULT false,
  responded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_performance_cycles_status   ON performance_cycles(status);
CREATE INDEX idx_reviews_cycle_employee      ON performance_reviews(cycle_id, employee_id);
CREATE INDEX idx_reviews_employee_id         ON performance_reviews(employee_id);
CREATE INDEX idx_goals_cycle_owner           ON goals(cycle_id, owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goal_reviews_goal_time      ON goal_reviews(goal_id, reviewed_at DESC);
CREATE INDEX idx_goal_updates_goal_time      ON goal_progress_updates(goal_id, recorded_at DESC);
CREATE INDEX idx_kpi_assignments_user_id     ON kpi_assignments(user_id);
CREATE INDEX idx_kpi_snapshots_assignment    ON kpi_progress_snapshots(kpi_id, user_id, recorded_at DESC);
CREATE INDEX idx_appeals_review_id           ON appeals(review_id);
