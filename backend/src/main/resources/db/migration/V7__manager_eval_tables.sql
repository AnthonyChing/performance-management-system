-- =====================================================================
-- V7: Review response and KPI evaluation tables for manager evaluation
-- =====================================================================

-- Manager/employee questionnaire answers per review
CREATE TABLE review_responses (
  id              UUID         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id       UUID         NOT NULL REFERENCES performance_reviews(id),
  question_id     UUID         NOT NULL REFERENCES template_questions(id),
  respondent_id   UUID         NOT NULL REFERENCES users(id),
  respondent_type VARCHAR(32)  NOT NULL,
  rating_value    INTEGER,
  text_value      TEXT,
  responded_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (review_id, question_id, respondent_type)
);

-- Manager KPI score + feedback per review per KPI
CREATE TABLE kpi_evaluations (
  id               UUID         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id        UUID         NOT NULL REFERENCES performance_reviews(id),
  kpi_id           UUID         NOT NULL REFERENCES kpis(id),
  manager_score    NUMERIC(5,2),
  manager_feedback TEXT,
  evaluated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (review_id, kpi_id)
);

CREATE INDEX idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX idx_kpi_evaluations_review_id  ON kpi_evaluations(review_id);
