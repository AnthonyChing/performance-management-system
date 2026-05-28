-- =====================================================================
-- V8: Evaluation Templates (考核模板)
-- =====================================================================

CREATE TYPE evaluation_template_status_enum AS ENUM ('published', 'archived');
CREATE CAST (character varying AS evaluation_template_status_enum) WITH INOUT AS IMPLICIT;

-- ---------------------------------------------------------------------
-- evaluation_templates  (考核模板主表)
-- Binds a performance_cycle + employee_group to a set of assessment_templates with weights.
-- ---------------------------------------------------------------------
CREATE TABLE evaluation_templates (
  id                   UUID                              NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id             UUID                              NOT NULL REFERENCES performance_cycles(id),
  name                 VARCHAR(128)                      NOT NULL,
  description          TEXT,
  status               evaluation_template_status_enum   NOT NULL DEFAULT 'published',
  employee_group_type  VARCHAR(32)                       NOT NULL,
  employee_group_ref   VARCHAR(128),
  is_active            BOOLEAN                           NOT NULL DEFAULT true,
  created_by           UUID                              NOT NULL REFERENCES users(id),
  updated_by           UUID                              REFERENCES users(id),
  created_at           TIMESTAMPTZ                       NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ                       NOT NULL DEFAULT now(),
  archived_at          TIMESTAMPTZ,
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT chk_eval_tmpl_group_type
    CHECK (employee_group_type IN ('all', 'department', 'job_category')),
  CONSTRAINT chk_eval_tmpl_group_ref
    CHECK (
      (employee_group_type = 'all'  AND employee_group_ref IS NULL) OR
      (employee_group_type <> 'all' AND employee_group_ref IS NOT NULL)
    )
);

-- Only one active (non-archived, non-deleted) evaluation template per cycle + group.
CREATE UNIQUE INDEX uniq_eval_template_cycle_group
  ON evaluation_templates(cycle_id, employee_group_type, COALESCE(employee_group_ref, ''))
  WHERE deleted_at IS NULL AND archived_at IS NULL;

-- ---------------------------------------------------------------------
-- evaluation_template_components
-- Records which assessment_template versions are included in an evaluation_template,
-- along with their weight contribution.
-- ---------------------------------------------------------------------
CREATE TABLE evaluation_template_components (
  id                              UUID          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_template_id          UUID          NOT NULL REFERENCES evaluation_templates(id),
  assessment_template_id          UUID          NOT NULL REFERENCES assessment_templates(id),
  assessment_template_version_id  UUID          NOT NULL REFERENCES template_versions(id),
  weight_percent                  NUMERIC(5,2)  NOT NULL,
  sort_order                      INTEGER       NOT NULL DEFAULT 0,
  created_at                      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT chk_weight_positive CHECK (weight_percent > 0 AND weight_percent <= 100),
  UNIQUE (evaluation_template_id, assessment_template_id)
);

-- Indexes
CREATE INDEX idx_eval_templates_cycle   ON evaluation_templates(cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_eval_templates_status  ON evaluation_templates(status)   WHERE deleted_at IS NULL;
CREATE INDEX idx_eval_tmpl_components   ON evaluation_template_components(evaluation_template_id);
