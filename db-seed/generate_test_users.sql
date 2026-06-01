-- =====================================================================
-- db-seed/generate_test_users.sql
-- Generates 30,000 users for k6 load testing
-- Run this directly in the Staging database via Cloud SQL Studio or psql.
-- =====================================================================

DO $$
DECLARE
  v_dept_id UUID;
  v_role_employee UUID;
  v_role_manager UUID;
  v_role_hr UUID;
  v_hr_user_id UUID;
  v_manager_user_id UUID;
  v_emp_count INT := 30000;
BEGIN
  -- 1. Create a dummy department if not exists
  INSERT INTO departments (name) VALUES ('Load Test Dept') RETURNING id INTO v_dept_id;

  -- 2. Get Role IDs
  SELECT id INTO v_role_employee FROM roles WHERE name = 'employee';
  SELECT id INTO v_role_manager FROM roles WHERE name = 'manager';
  SELECT id INTO v_role_hr FROM roles WHERE name = 'hr';

  -- 3. Create a master HR user (id: 1)
  INSERT INTO users (employee_id, email, full_name, department_id, job_title, job_category)
  VALUES ('TEST-HR-1', 'hr_1@loadtest.com', 'Load Test HR', v_dept_id, 'HR Specialist', 'HR')
  RETURNING id INTO v_hr_user_id;
  
  INSERT INTO user_roles (user_id, role_id, granted_by) VALUES (v_hr_user_id, v_role_hr, v_hr_user_id);

  -- 4. Create a master Manager user (id: 2)
  INSERT INTO users (employee_id, email, full_name, department_id, job_title, job_category, manager_id)
  VALUES ('TEST-MGR-2', 'manager_2@loadtest.com', 'Load Test Manager', v_dept_id, 'Manager', 'Management', v_hr_user_id)
  RETURNING id INTO v_manager_user_id;
  
  INSERT INTO user_roles (user_id, role_id, granted_by) VALUES (v_manager_user_id, v_role_manager, v_hr_user_id);

  -- 5. Generate 29,998 remaining employees in bulk (to make total 30,000)
  INSERT INTO users (id, employee_id, email, full_name, english_name, department_id, manager_id, job_title, job_category)
  SELECT
    gen_random_uuid(),
    'TEST-EMP-' || seq_num,
    'employee_' || LPAD(seq_num::text, 6, '0') || '@loadtest.com',
    'Test Employee ' || seq_num,
    'Test Employee ' || seq_num,
    v_dept_id,
    v_manager_user_id, -- Assign all to the master manager for simple team queries
    'Tester',
    'Engineering'
  FROM generate_series(3, v_emp_count) AS t(seq_num);

  -- Assign the 'employee' role to all newly generated employees
  INSERT INTO user_roles (user_id, role_id, granted_by)
  SELECT u.id, v_role_employee, v_hr_user_id
  FROM users u
  WHERE u.email LIKE '%@loadtest.com' AND u.email != 'hr_1@loadtest.com' AND u.email != 'manager_2@loadtest.com';

  RAISE NOTICE 'Successfully generated % test users', v_emp_count;
END $$;
