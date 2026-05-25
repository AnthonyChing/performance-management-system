-- =====================================================================
-- Dev-only seed data (repeatable migration).
-- Loaded ONLY under the `dev` Spring profile via application-dev.properties
-- (spring.flyway.locations += classpath:db/seed). Never runs in prod/test.
--
-- Idempotent: safe to re-run. Departments are normally provisioned by the
-- external HR system; these are stand-ins so the read-only endpoints have data.
-- Fixed UUIDs keep references stable across runs.
-- =====================================================================

-- ---- departments (a small org tree) --------------------------------
INSERT INTO departments (id, name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp',        NULL),
  ('00000000-0000-0000-0000-000000000011', 'Engineering',      '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000111', 'Backend',          '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000112', 'Frontend',         '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000012', 'Sales',            '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000013', 'People & Culture', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ---- users ----------------------------------------------------------
INSERT INTO users (id, employee_id, email, full_name, department_id, manager_id, job_title, job_category) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'E-HR001',  'helen.ho@acme.test', 'Helen Ho', '00000000-0000-0000-0000-000000000013', NULL,                                   'HR Business Partner', 'hr'),
  ('00000000-0000-0000-0000-0000000000b1', 'E-MGR001', 'mandy.ma@acme.test', 'Mandy Ma', '00000000-0000-0000-0000-000000000111', NULL,                                   'Engineering Manager', 'engineering'),
  ('00000000-0000-0000-0000-0000000000c1', 'E-EMP001', 'eric.lin@acme.test', 'Eric Lin', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-0000000000b1', 'Backend Engineer',    'engineering'),
  ('00000000-0000-0000-0000-0000000000c2', 'E-EMP002', 'emma.wu@acme.test',  'Emma Wu',  '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-0000000000b1', 'Backend Engineer',    'engineering')
ON CONFLICT (id) DO NOTHING;

-- ---- user_roles (role ids resolved by name; granted_by = Helen) ------
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT seed.user_id, r.id, '00000000-0000-0000-0000-0000000000a1'::uuid
FROM (VALUES
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'hr'),
  ('00000000-0000-0000-0000-0000000000b1'::uuid, 'manager'),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'employee'),
  ('00000000-0000-0000-0000-0000000000c2'::uuid, 'employee')
) AS seed(user_id, role_name)
JOIN roles r ON r.name = seed.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ---- user_department_history (one open membership per user) ----------
-- Guarded by NOT EXISTS to respect uniq_user_open_department and stay idempotent.
INSERT INTO user_department_history (user_id, department_id, effective_from, recorded_by)
SELECT u.id, u.department_id, now(), '00000000-0000-0000-0000-0000000000a1'::uuid
FROM users u
WHERE u.id IN (
        '00000000-0000-0000-0000-0000000000a1',
        '00000000-0000-0000-0000-0000000000b1',
        '00000000-0000-0000-0000-0000000000c1',
        '00000000-0000-0000-0000-0000000000c2')
  AND NOT EXISTS (
        SELECT 1 FROM user_department_history h
        WHERE h.user_id = u.id AND h.effective_to IS NULL);
