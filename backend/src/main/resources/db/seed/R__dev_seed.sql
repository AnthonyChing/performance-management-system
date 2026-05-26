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

-- ---- performance_cycles ----------------------------------------
INSERT INTO performance_cycles (
  id, name, cycle_type, status, timezone,
  self_eval_start, self_eval_end,
  manager_eval_start, manager_eval_end,
  hr_review_end, appeal_deadline_days, is_locked, created_by
) VALUES (
  '00000000-0000-0000-0000-000000010001',
  '2026 Q3 Quarterly Review',
  'quarterly', 'in_progress', 'Asia/Taipei',
  '2026-07-01T00:00:00+08:00', '2026-08-31T23:59:59+08:00',
  '2026-09-01T00:00:00+08:00', '2026-09-30T23:59:59+08:00',
  '2026-10-15T23:59:59+08:00', 7, false,
  '00000000-0000-0000-0000-0000000000a1'
) ON CONFLICT (id) DO NOTHING;

-- ---- performance_reviews ----------------------------------------
INSERT INTO performance_reviews (
  id, cycle_id, employee_id, manager_id, status, is_terminated_employee
) VALUES (
  '00000000-0000-0000-0000-000000020001',
  '00000000-0000-0000-0000-000000010001',
  '00000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-0000000000b1',
  'self_eval_in_progress', false
) ON CONFLICT (id) DO NOTHING;

-- ---- goals (2 個) ----------------------------------------
INSERT INTO goals (id, cycle_id, owner_id, set_by, goal_type, title, description, progress_percent, due_date, status)
VALUES (
  '00000000-0000-0000-0000-000000030001',
  '00000000-0000-0000-0000-000000010001',
  '00000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-0000000000c1',
  'individual',
  '提升 API 回應效能',
  '透過快取優化與查詢調整，將核心 API p95 延遲降至 200ms 以下。',
  0, '2026-09-30', 'pending_review'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO goals (id, cycle_id, owner_id, set_by, goal_type, title, description, progress_percent, due_date, status, published_at)
VALUES (
  '00000000-0000-0000-0000-000000030002',
  '00000000-0000-0000-0000-000000010001',
  '00000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-0000000000c1',
  'individual',
  '完成 CI/CD pipeline 自動化',
  '建立完整的自動化部署流程，涵蓋 build、test、deploy 各階段。',
  40, '2026-08-31', 'in_progress',
  '2026-07-15T10:00:00+08:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO goal_reviews (id, goal_id, decision, comment, reviewed_by, reviewed_at)
VALUES (
  '00000000-0000-0000-0000-000000040001',
  '00000000-0000-0000-0000-000000030002',
  'approved', '方向正確，請繼續推進。',
  '00000000-0000-0000-0000-0000000000b1',
  '2026-07-15T10:00:00+08:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO goal_progress_updates (id, goal_id, progress_percent, note, updated_by, recorded_at)
VALUES (
  '00000000-0000-0000-0000-000000050001',
  '00000000-0000-0000-0000-000000030002',
  40, '已完成 build 和 test 階段設定，deploy 尚在進行中。',
  '00000000-0000-0000-0000-0000000000c1',
  '2026-07-20T09:00:00+08:00'
) ON CONFLICT (id) DO NOTHING;

-- ---- kpis (2 個) ----------------------------------------
INSERT INTO kpis (id, cycle_id, created_by, kpi_type, title, description, unit, target_operator, target_value, target_unit, target_display_text, published_at)
VALUES (
  '00000000-0000-0000-0000-000000060001',
  '00000000-0000-0000-0000-000000010001',
  '00000000-0000-0000-0000-0000000000b1',
  'individual', 'Code Review 通過率', '程式碼審核一次通過率須達 90% 以上。', '%',
  'gte', 90.0, 'percent', '通過率 >= 90%', '2026-07-01T09:00:00+08:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO kpis (id, cycle_id, created_by, kpi_type, title, description, unit, target_operator, target_value, target_unit, target_display_text, published_at)
VALUES (
  '00000000-0000-0000-0000-000000060002',
  '00000000-0000-0000-0000-000000010001',
  '00000000-0000-0000-0000-0000000000b1',
  'individual', '功能交付數量', 'Q3 完成並上線的功能模組數量。', 'modules',
  'gte', 4.0, 'module', '完成 >= 4 個功能模組', '2026-07-01T09:00:00+08:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO kpi_assignments (kpi_id, user_id, weight, target_value, current_value)
VALUES ('00000000-0000-0000-0000-000000060001', '00000000-0000-0000-0000-0000000000c1', 60.0, 90.0, 85.0)
ON CONFLICT (kpi_id, user_id) DO NOTHING;

INSERT INTO kpi_assignments (kpi_id, user_id, weight, target_value, current_value)
VALUES ('00000000-0000-0000-0000-000000060002', '00000000-0000-0000-0000-0000000000c1', 40.0, 4.0, 2.0)
ON CONFLICT (kpi_id, user_id) DO NOTHING;
