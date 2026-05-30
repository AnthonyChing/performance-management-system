import { test, expect } from '@playwright/test';

test.describe('HR Module (API-aligned)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.route('**/api/v1/sessions', async route => {
      await route.fulfill({ status: 200, json: { token: 'fake-hr-token', role: 'hr' } });
    });
    await page.fill('input[name="username"]', 'hr_admin');
    await page.fill('input[name="password"]', 'hrpass123');
    await page.click('button[type="submit"]');
    await page.evaluate(() => localStorage.setItem('token', 'fake-hr-token'));
  });

  test('HR-AUTH-01: HR login redirects to cycles', async ({ page }) => {
    await expect(page).toHaveURL(/.*hr\/cycles/);
  });

  test.describe('Assessment Templates', () => {
    test('HR-TMPL-01: list templates', async ({ page }) => {
      await page.route('**/api/v1/hr/assessment-templates**', async route => {
        await route.fulfill({
          status: 200,
          json: {
            data: [
              {
                id: 'tmpl-1',
                name: '工程部門 2026 評估模板',
                job_category: 'engineering',
                status: 'draft',
                is_active: true,
              },
            ],
            meta: { current_page: 1, total_pages: 1, total_count: 1 },
          },
        });
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates?page=1');
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.data[0].id).toBe('tmpl-1');
    });

    test('HR-TMPL-02: create, update, publish, duplicate, delete template', async ({ page }) => {
      await page.route('**/api/v1/hr/assessment-templates', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { id: 'tmpl-2', name: '新模板', status: 'draft', is_active: true, description: null, job_category: 'sales', usage_count: 0 } });
        }
      });
      await page.route('**/api/v1/hr/assessment-templates/tmpl-2', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { id: 'tmpl-2', name: '新模板', status: 'draft', is_active: true, description: '更新', job_category: 'sales', usage_count: 0 } });
        } else if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, body: '' });
        }
      });
      await page.route('**/api/v1/hr/assessment-templates/tmpl-2/publish', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200, json: { id: 'tmpl-2', status: 'published', updated_at: '2026-05-27T09:00:00+08:00' } });
        }
      });
      await page.route('**/api/v1/hr/assessment-templates/tmpl-2/duplicate', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { id: 'tmpl-3', name: '新模板 (複製)', status: 'draft', is_active: true, usage_count: 0, description: null, job_category: 'sales' } });
        }
      });

      const created = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '新模板', description: null, job_category: 'sales' }),
        });
        return { status: r.status, body: await r.json() };
      });

      const updated = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-2', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: '更新' }),
        });
        return { status: r.status, body: await r.json() };
      });

      const published = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-2/publish', { method: 'POST' });
        return { status: r.status, body: await r.json() };
      });

      const duplicated = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-2/duplicate', { method: 'POST' });
        return { status: r.status, body: await r.json() };
      });

      const deleted = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-2', { method: 'DELETE' });
        return { status: r.status };
      });

      expect(created.status).toBe(201);
      expect(updated.status).toBe(200);
      expect(published.body.status).toBe('published');
      expect(duplicated.status).toBe(201);
      expect(deleted.status).toBe(204);
    });

    test('HR-TMPL-03: question CRUD and reorder', async ({ page }) => {
      await page.route('**/api/v1/hr/assessment-templates/tmpl-1/questions**', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { id: 'q1', template_id: 'tmpl-1', question_text: '問題1', question_type: 'rating', rating_scale_max: 5, is_required: true, sort_order: 1 } });
        } else if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { id: 'q1', template_id: 'tmpl-1', question_text: '問題1-更新', question_type: 'rating', rating_scale_max: 5, is_required: true, sort_order: 1 } });
        } else {
          await route.fulfill({ status: 200, json: { data: [ { id: 'q1', question_text: '問題1', question_type: 'rating', sort_order: 1 } ] } });
        }
      });
      await page.route('**/api/v1/hr/assessment-templates/tmpl-1/questions/q1', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, json: { id: 'q1', template_id: 'tmpl-1', question_text: '問題1', question_type: 'rating', rating_scale_max: 5, is_required: true, sort_order: 1 } });
        } else if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { id: 'q1', template_id: 'tmpl-1', question_text: '問題1-更新', question_type: 'rating', rating_scale_max: 5, is_required: true, sort_order: 1 } });
        } else if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, body: '' });
        }
      });
      await page.route('**/api/v1/hr/assessment-templates/tmpl-1/questions/reorder', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { message: 'Questions reordered successfully.' } });
        }
      });

      const created = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-1/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_text: '問題1', question_type: 'rating', rating_scale_max: 5, is_required: true }),
        });
        return { status: r.status, body: await r.json() };
      });

      const updated = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-1/questions/q1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_text: '問題1-更新' }),
        });
        return { status: r.status, body: await r.json() };
      });

      const list = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-1/questions');
        return { status: r.status, body: await r.json() };
      });

      const reorder = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-1/questions/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordered_question_ids: ['q1'] }),
        });
        return { status: r.status, body: await r.json() };
      });

      const deleted = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-1/questions/q1', { method: 'DELETE' });
        return { status: r.status };
      });

      expect(created.status).toBe(201);
      expect(updated.status).toBe(200);
      expect(list.status).toBe(200);
      expect(reorder.body.message).toBe('Questions reordered successfully.');
      expect(deleted.status).toBe(204);
    });

    test('HR-TMPL-04: legacy application', async ({ page }) => {
      await page.route('**/api/v1/hr/assessment-templates/tmpl-1/applications', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200, json: { message: 'Template applied successfully to selected groups.' } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/assessment-templates/tmpl-1/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_departments: ['dept-1'], target_job_levels: ['L3'] }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.message).toBe('Template applied successfully to selected groups.');
    });
  });

  test.describe('Evaluation Templates', () => {
    test('HR-EVAL-01: list and get evaluation templates', async ({ page }) => {
      await page.route('**/api/v1/hr/evaluation-templates**', async route => {
        await route.fulfill({
          status: 200,
          json: {
            data: [
              {
                template_id: 'eval-1',
                cycle: { cycle_id: 'cycle-1', name: '2024 年度績效考核', status: 'not_started' },
                name: '2023年度績效考核範本',
                description: '範本',
                status: 'published',
                employee_group: { group_id: 'all', group_type: 'all', name: '全體員工', description: null },
                assessment_template_count: 3,
                total_weight_percent: 100,
                available_actions: { can_edit: true, can_archive: true, edit_blocked_reason: null },
                updated_at: '2026-05-15T14:30:00+08:00',
              },
            ],
            meta: { current_page: 1, total_pages: 1, total_count: 1 },
          },
        });
      });
      await page.route('**/api/v1/hr/evaluation-templates/eval-1', async route => {
        await route.fulfill({
          status: 200,
          json: {
            template_id: 'eval-1',
            cycle: { cycle_id: 'cycle-1', name: '2024 年度績效考核', cycle_type: 'annual', status: 'not_started' },
            name: '2023年度績效考核範本',
            description: '範本',
            status: 'published',
            employee_group: { group_id: 'all', group_type: 'all', name: '全體員工', description: '所有 active 員工' },
            assessment_templates: [
              { assessment_template_id: 'tmpl-1', assessment_template_version_id: 'tmpl-1-v1', name: '核心勝任力評估', question_count: 15, weight_percent: 40 },
            ],
            total_weight_percent: 100,
            available_actions: { can_edit: true, can_archive: true, edit_blocked_reason: null },
            created_by: 'hr-1',
            updated_by: 'hr-1',
            created_at: '2026-05-01T10:00:00+08:00',
            updated_at: '2026-05-15T14:30:00+08:00',
          },
        });
      });

      const list = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/evaluation-templates?page=1');
        return { status: r.status, body: await r.json() };
      });
      const detail = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/evaluation-templates/eval-1');
        return { status: r.status, body: await r.json() };
      });

      expect(list.status).toBe(200);
      expect(detail.body.template_id).toBe('eval-1');
    });

    test('HR-EVAL-02: create and update evaluation template', async ({ page }) => {
      await page.route('**/api/v1/hr/evaluation-templates', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { template_id: 'eval-2', cycle: { cycle_id: 'cycle-1', name: '2024 年度績效考核', status: 'not_started' }, name: '2024 年度研發部門績效考核', description: '說明', status: 'published', employee_group: { group_id: 'department:dept-1', group_type: 'department', name: '技術研發部', description: null }, assessment_templates: [], total_weight_percent: 100, available_actions: { can_edit: true, can_archive: true, edit_blocked_reason: null } } });
        }
      });
      await page.route('**/api/v1/hr/evaluation-templates/eval-2', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { template_id: 'eval-2', cycle: { cycle_id: 'cycle-1', name: '2024 年度績效考核', status: 'not_started' }, name: '2024 年度研發部門績效考核 - 修正版', description: '修正', status: 'published', employee_group: { group_id: 'job_category:engineering', group_type: 'job_category', name: 'Engineering', description: null }, assessment_templates: [], total_weight_percent: 100, available_actions: { can_edit: true, can_archive: true, edit_blocked_reason: null } } });
        }
      });

      const created = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/evaluation-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycle_id: 'cycle-1', name: '2024 年度研發部門績效考核', employee_group_id: 'department:dept-1', assessment_templates: [ { assessment_template_id: 'tmpl-1', weight_percent: 100 } ] }),
        });
        return { status: r.status, body: await r.json() };
      });

      const updated = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/evaluation-templates/eval-2', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '2024 年度研發部門績效考核 - 修正版', employee_group_id: 'job_category:engineering' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(created.status).toBe(201);
      expect(updated.status).toBe(200);
    });
  });

  test.describe('Employee Groups and Cycles', () => {
    test('HR-GRP-01: list employee groups', async ({ page }) => {
      await page.route('**/api/v1/hr/employee-groups', async route => {
        await route.fulfill({ status: 200, json: { data: [ { group_id: 'all', group_type: 'all', name: '全體員工', description: '所有 active 員工' } ] } });
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/employee-groups');
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.data[0].group_id).toBe('all');
    });

    test('HR-CYCL-01: create, list, get, update, update status', async ({ page }) => {
      await page.route('**/api/v1/hr/performance-cycles', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { cycle_id: 'cycle-1', name: '2026 總部員工績效考核', status: 'not_started', timezone: 'Asia/Taipei' } });
        } else {
          await route.fulfill({ status: 200, json: { data: [ { cycle_id: 'cycle-1', name: '2026 總部員工績效考核', status: 'not_started' } ], meta: { current_page: 1, total_pages: 1, total_count: 1 } } });
        }
      });
      await page.route('**/api/v1/hr/performance-cycles/cycle-1', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, json: { cycle_id: 'cycle-1', name: '2026 總部員工績效考核', status: 'not_started' } });
        } else if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { cycle_id: 'cycle-1', name: '2026 總部員工績效考核 (更新)', status: 'not_started' } });
        }
      });
      await page.route('**/api/v1/hr/performance-cycles/cycle-1/status', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { cycle_id: 'cycle-1', name: '2026 總部員工績效考核', status: 'in_progress' } });
        }
      });

      const created = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/performance-cycles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '2026 總部員工績效考核', start_date: '2026-07-01', end_date: '2026-09-30', timezone: 'Asia/Taipei', target_groups: [] }),
        });
        return { status: r.status, body: await r.json() };
      });

      const list = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/performance-cycles?page=1');
        return { status: r.status, body: await r.json() };
      });

      const detail = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/performance-cycles/cycle-1');
        return { status: r.status, body: await r.json() };
      });

      const updated = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/performance-cycles/cycle-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '2026 總部員工績效考核 (更新)' }),
        });
        return { status: r.status, body: await r.json() };
      });

      const statusResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/performance-cycles/cycle-1/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(created.status).toBe(201);
      expect(list.status).toBe(200);
      expect(detail.status).toBe(200);
      expect(updated.status).toBe(200);
      expect(statusResp.body.status).toBe('in_progress');
    });
  });

  test.describe('Audit & Notifications', () => {
    test('HR-AUDT-01: list and export audit logs', async ({ page }) => {
      await page.route('**/api/v1/hr/audit-logs**', async route => {
        await route.fulfill({ status: 200, json: { data: [ { id: 'log-1', action: '發佈考核結果' } ], meta: { current_page: 1, total_pages: 1, total_count: 1 } } });
      });
      await page.route('**/api/v1/hr/audit-log-exports', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200, json: { file_url: 'https://example.com/audit.csv' } });
        }
      });

      const list = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/audit-logs?page=1');
        return { status: r.status, body: await r.json() };
      });

      const exportResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/audit-log-exports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(list.status).toBe(200);
      expect(exportResp.body.file_url).toBe('https://example.com/audit.csv');
    });

    test('HR-NOTI-01: create notification', async ({ page }) => {
      await page.route('**/api/v1/hr/notifications', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200, json: { message: 'sent' } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/hr/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'system', message: '公告' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.message).toBe('sent');
    });
  });
});
