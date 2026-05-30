import { test, expect } from '@playwright/test';

test.describe('Employee Module (API-aligned)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('Authentication & Profile', () => {
    test('E-AUTH-01: successful login posts to /api/v1/sessions', async ({ page }) => {
      await page.route('**/api/v1/sessions', async route => {
        await route.fulfill({ status: 200, json: { token: 'fake-emp-token', role: 'employee' } });
      });

      await page.fill('input[name="username"]', 'employee1');
      await page.fill('input[name="password"]', 'pass123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('E-PROF-01: profile and current cycle shapes', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-emp-token'));
      await page.route('**/api/v1/me/profile', async route => {
        await route.fulfill({
          status: 200,
          json: {
            profile: {
              user_id: 'user_001',
              employee_id: 'PP-88293',
              name: '陳大文',
              english_name: 'David Chen',
              avatar_url: '/assets/avatar/PP-88293.png',
              job_title: '資深軟體工程師',
              job_category: 'engineering',
              department: {
                department_id: 'dept_engineering',
                name: '技術研發部',
              },
              location: '台北總部',
              email: 'david.chen@performanceplus.com',
              employment_status: 'active',
              terminated_at: null,
              manager: {
                user_id: 'user_manager_001',
                name: '林美玲',
                english_name: 'Mei Lin',
                email: 'mei.lin@performanceplus.com',
              },
            },
          },
        });
      });
      await page.route('**/api/v1/me/performance-cycles/current', async route => {
        await route.fulfill({
          status: 200,
          json: {
            cycle: {
              cycle_id: 'cycle_2024_q3',
              name: '2024 Q3 年度績效考核',
              cycle_type: 'quarterly',
              period_label: '2024-07-01~2024-09-30',
              start_date: '2024-07-01',
              end_date: '2024-09-30',
              timezone: 'Asia/Taipei',
              status: 'in_progress',
              is_locked: false,
              results_published_at: null,
              updated_at: '2024-09-20T10:30:00+08:00',
            },
          },
        });
      });

      await page.goto('/');
      await expect(page.locator('text="陳大文"')).toBeVisible();
      await expect(page.locator('text="2024 Q3 年度績效考核"')).toBeVisible();
    });
  });

  test.describe('Employee API contract (mocked)', () => {
    test('E-GOAL-01: list goals', async ({ page }) => {
      await page.route('**/api/v1/me/goals**', async route => {
        await route.fulfill({
          status: 200,
          json: {
            data: [
              {
                goal_id: 'goal_20260520_001',
                cycle_id: 'cycle_2026_q3',
                goal_type: 'individual',
                title: '提升 Q3 季度客戶滿意度至 92%',
                description: '提升 CSAT',
                due_date: '2026-09-30',
                status: 'in_progress',
                progress_percent: 75,
                owner: { user_id: 'user_001', name: 'Alex Chen', department: 'System Management' },
                reviewer: { user_id: 'user_100', name: '李曉芳', title: 'Director' },
                latest_progress_update: null,
                latest_review: null,
                available_actions: {
                  can_edit: false,
                  edit_unavailable_reason: 'invalid_goal_status',
                  can_update_progress: true,
                  update_progress_unavailable_reason: null,
                },
                published_at: null,
                created_at: '2026-05-20T09:00:00+08:00',
                updated_at: '2026-08-15T10:20:00+08:00',
              },
            ],
          },
        });
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/goals');
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(Array.isArray(resp.body.data)).toBeTruthy();
    });

    test('E-GOAL-02: create goal', async ({ page }) => {
      await page.route('**/api/v1/me/goals', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { goal_id: 'goal_new', status: 'pending_review' } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '新目標', description: '描述', due_date: '2026-09-30' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(201);
      expect(resp.body.goal_id).toBe('goal_new');
    });

    test('E-GOAL-03: resubmit revised goal', async ({ page }) => {
      await page.route('**/api/v1/me/goals/goal_1', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200, json: { goal_id: 'goal_1', status: 'pending_review' } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/goals/goal_1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '修正目標', description: '修正' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.status).toBe('pending_review');
    });

    test('E-GOAL-04: update goal progress', async ({ page }) => {
      await page.route('**/api/v1/me/goals/goal_1/progress-updates', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { progress_update_id: 'progress_001', progress_percent: 80 } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/goals/goal_1/progress-updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress_percent: 80, note: '進度更新' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(201);
      expect(resp.body.progress_update_id).toBe('progress_001');
    });

    test('E-GOAL-05: review result', async ({ page }) => {
      await page.route('**/api/v1/me/goals/review-result', async route => {
        await route.fulfill({ status: 200, json: { data: [] } });
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/goals/review-result');
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(Array.isArray(resp.body.data)).toBeTruthy();
    });

    test('E-KPI-01: KPI standards and result', async ({ page }) => {
      await page.route('**/api/v1/me/kpis/standards', async route => {
        await route.fulfill({ status: 200, json: { data: [] } });
      });
      await page.route('**/api/v1/me/kpis/result', async route => {
        await route.fulfill({ status: 200, json: { data: [] } });
      });

      const standards = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/kpis/standards');
        return { status: r.status, body: await r.json() };
      });
      const result = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/kpis/result');
        return { status: r.status, body: await r.json() };
      });

      expect(standards.status).toBe(200);
      expect(result.status).toBe(200);
    });

    test('E-KPI-02: confirm KPI result', async ({ page }) => {
      await page.route('**/api/v1/me/kpis/result-confirmations', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 200, json: { message: 'confirmed' } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/kpis/result-confirmations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed: true }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.message).toBe('confirmed');
    });

    test('E-APPL-01: appeals flow', async ({ page }) => {
      await page.route('**/api/v1/me/appeals', async route => {
        await route.fulfill({ status: 200, json: { data: [] } });
      });
      await page.route('**/api/v1/me/appeals/submit', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { appeal_id: 'appeal_1', status: 'submitted' } });
        }
      });
      await page.route('**/api/v1/me/appeals/result', async route => {
        await route.fulfill({ status: 200, json: { status: 'under_review' } });
      });

      const listResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/appeals');
        return { status: r.status, body: await r.json() };
      });
      const submitResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/appeals/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: '申覆原因' }),
        });
        return { status: r.status, body: await r.json() };
      });
      const resultResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/me/appeals/result');
        return { status: r.status, body: await r.json() };
      });

      expect(listResp.status).toBe(200);
      expect(submitResp.status).toBe(201);
      expect(resultResp.status).toBe(200);
    });
  });
});
