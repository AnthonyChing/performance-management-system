-- =====================================================================
-- V5: Assessment Templates, Questions, Versions, Audit Logs
-- =====================================================================

CREATE TYPE template_status_enum AS ENUM ('draft', 'published');
CREATE TYPE question_type_enum   AS ENUM ('rating', 'text', 'boolean');

-- ---------------------------------------------------------------------
-- assessment_templates
-- ---------------------------------------------------------------------
CREATE TABLE assessment_templates (
  id           UUID                   NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255)           NOT NULL,
  description  TEXT,
  job_function VARCHAR(64),
  status       template_status_enum   NOT NULL DEFAULT 'draft',
  is_active    BOOLEAN                NOT NULL DEFAULT true,
  created_by   UUID                   NOT NULL REFERENCES users(id),
  updated_by   UUID                   NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ            NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- template_versions  (one record per published template)
-- ---------------------------------------------------------------------
CREATE TABLE template_versions (
  id          UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID        NOT NULL REFERENCES assessment_templates(id),
  version     INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

-- Wire up the FK that was left dangling in V2
ALTER TABLE performance_reviews
  ADD CONSTRAINT fk_reviews_template_version
  FOREIGN KEY (template_version_id) REFERENCES template_versions(id);

-- ---------------------------------------------------------------------
-- template_questions
-- ---------------------------------------------------------------------
CREATE TABLE template_questions (
  id               UUID                 NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID                 NOT NULL REFERENCES assessment_templates(id),
  question_text    TEXT                 NOT NULL,
  question_type    question_type_enum   NOT NULL,
  rating_scale_max INTEGER,
  is_required      BOOLEAN              NOT NULL DEFAULT true,
  sort_order       INTEGER              NOT NULL DEFAULT 0,
  created_by       UUID                 NOT NULL REFERENCES users(id),
  updated_by       UUID                 NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- cycle_template_assignments  (which template a cycle uses)
-- ---------------------------------------------------------------------
CREATE TABLE cycle_template_assignments (
  cycle_id    UUID        NOT NULL REFERENCES performance_cycles(id),
  template_id UUID        NOT NULL REFERENCES assessment_templates(id),
  assigned_by UUID        NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cycle_id, template_id)
);

-- ---------------------------------------------------------------------
-- audit_logs  (append-only, partitioned by month)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES users(id),
  action      VARCHAR(64) NOT NULL,
  resource    VARCHAR(64) NOT NULL,
  resource_id UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Default catch-all partition (specific monthly partitions added by ops)
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- ---------------------------------------------------------------------
-- Implicit casts for new enum types (mirrors V4 pattern)
-- ---------------------------------------------------------------------
CREATE CAST (character varying AS template_status_enum) WITH INOUT AS IMPLICIT;
CREATE CAST (character varying AS question_type_enum)   WITH INOUT AS IMPLICIT;

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_assessment_templates_status    ON assessment_templates(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_template_questions_template    ON template_questions(template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cycle_template_assignments     ON cycle_template_assignments(template_id);
CREATE INDEX idx_audit_logs_actor               ON audit_logs_default(actor_id);
CREATE INDEX idx_audit_logs_resource            ON audit_logs_default(resource, resource_id);
