-- =====================================================================
-- V1: Identity & Organization foundation
-- Source design: docs/database/new-schema.md (Identity & Org section)
-- Tables: departments, users, roles, user_roles,
--         user_identities, user_department_history
-- =====================================================================

-- gen_random_uuid() is provided by pgcrypto (bundled with Postgres 17).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

CREATE TYPE employment_status_enum AS ENUM (
  'active',
  'on_leave',
  'terminated'
);

CREATE TYPE identity_provider_enum AS ENUM (
  'google',
  'azure_ad',
  'okta',
  'local'
);

-- ---------------------------------------------------------------------
-- departments
-- Tree structure (parent_id self-FK). Soft-closed via closed_at,
-- never hard-deleted, so historical snapshots stay valid.
-- ---------------------------------------------------------------------
CREATE TABLE departments (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(128) NOT NULL,
  parent_id  UUID         REFERENCES departments(id),
  closed_at  TIMESTAMPTZ,
  closed_by  UUID,                                  -- FK added after users exists
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       VARCHAR(64)            NOT NULL UNIQUE,
  email             VARCHAR(255)           NOT NULL UNIQUE,
  full_name         VARCHAR(255)           NOT NULL,
  department_id     UUID                   NOT NULL REFERENCES departments(id),
  manager_id        UUID                   REFERENCES users(id),
  job_title         VARCHAR(128)           NOT NULL,
  job_category      VARCHAR(64)            NOT NULL,
  employment_status employment_status_enum NOT NULL DEFAULT 'active',
  mfa_enabled       BOOLEAN                NOT NULL DEFAULT false,
  locale            VARCHAR(10)            NOT NULL DEFAULT 'zh-TW',
  timezone          VARCHAR(64)            NOT NULL DEFAULT 'Asia/Taipei',
  created_at        TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ            NOT NULL DEFAULT now(),
  terminated_at     TIMESTAMPTZ
);

-- departments.closed_by FK can now point at users.
ALTER TABLE departments
  ADD CONSTRAINT departments_closed_by_fkey
  FOREIGN KEY (closed_by) REFERENCES users(id);

-- ---------------------------------------------------------------------
-- roles + user_roles (RBAC)
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(64) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE user_roles (
  user_id    UUID        NOT NULL REFERENCES users(id),
  role_id    UUID        NOT NULL REFERENCES roles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID        NOT NULL REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Seed the four canonical roles.
INSERT INTO roles (name, description) VALUES
  ('employee', 'Standard employee; self-evaluate, view own KPIs, file appeals'),
  ('manager',  'Set goals/KPIs, evaluate direct reports, import documents'),
  ('hr',       'Manage cycles, templates, completion tracking, audit'),
  ('admin',    'System administrator; no access to performance data');

-- ---------------------------------------------------------------------
-- user_identities (forward-looking SSO placeholder)
-- ---------------------------------------------------------------------
CREATE TABLE user_identities (
  id                UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID                   NOT NULL REFERENCES users(id),
  provider          identity_provider_enum NOT NULL,
  provider_subject  VARCHAR(255)           NOT NULL,
  provider_email    VARCHAR(255),
  linked_at         TIMESTAMPTZ            NOT NULL DEFAULT now(),
  last_login_at     TIMESTAMPTZ,
  UNIQUE (provider, provider_subject)
);

-- ---------------------------------------------------------------------
-- user_department_history (append-only)
-- Powers historical reporting after employees transfer departments.
-- ---------------------------------------------------------------------
CREATE TABLE user_department_history (
  id             BIGSERIAL   PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES users(id),
  department_id  UUID        NOT NULL REFERENCES departments(id),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,
  recorded_by    UUID        NOT NULL REFERENCES users(id),
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each user has at most one open membership at a time.
CREATE UNIQUE INDEX uniq_user_open_department
  ON user_department_history (user_id)
  WHERE effective_to IS NULL;

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_users_department_id  ON users (department_id);
CREATE INDEX idx_users_manager_id     ON users (manager_id);
CREATE INDEX idx_users_employment     ON users (employment_status);
CREATE INDEX idx_users_job_category   ON users (job_category);

CREATE INDEX idx_user_identities_user ON user_identities (user_id);

CREATE INDEX idx_udh_user_effective
  ON user_department_history (user_id, effective_from DESC);
