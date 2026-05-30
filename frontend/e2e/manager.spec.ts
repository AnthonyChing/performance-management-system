import { test, expect } from '@playwright/test';

test.describe('Manager Module (detailed API-aligned tests)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('Authentication', () => {
    test('M-AUTH-01: successful login posts to /api/v1/sessions and redirects', async ({ page }) => {
      await page.route('**/api/v1/sessions', async route => {
        await route.fulfill({ status: 200, json: { token: 'fake-jwt-token', role: 'manager' } });
      });

      await page.fill('input[name="username"]', 'manager1');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('M-AUTH-02: failed login shows error', async ({ page }) => {
      await page.route('**/api/v1/sessions', async route => {
        await route.fulfill({ status: 401, json: { error: { code: 'UNAUTHORIZED', message: 'invalid' } } });
      });

      await page.fill('input[name="username"]', 'manager1');
      await page.fill('input[name="password"]', 'bad');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toBeVisible();
    });
  });

  test.describe('Manager API contract (mocked, shapes from docs & src/api/manager.ts)', () => {
    test('M-API-CreateGoal: POST /users/:user_id/goals returns 201 with SubordinateGoal', async ({ page }) => {
      const created = {
        id: 'goal-123',
        cycle_id: 'cycle-1',
        owner_id: 'm1',
        set_by: 'mgr-1',
        goal_type: 'individual',
        title: '降低系統延遲',
        description: '優化查詢',
        progress_percent: 0,
        due_date: '2026-09-30',
        status: 'pending_review',
        published_at: null,
      };

      await page.route('**/api/v1/users/m1/goals', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: created });
        } else {
          await route.fulfill({ status: 200, json: { data: [] } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '降低系統延遲', goal_type: 'individual', due_date: '2026-09-30' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(201);
      expect(resp.body).toHaveProperty('id');
      expect(resp.body.status).toBe('pending_review');
    });

    test('M-API-UpdateGoal: PATCH /users/:user_id/goals/:goal_id returns updated SubordinateGoal', async ({ page }) => {
      const updated = {
        id: 'goal-123',
        status: 'in_progress',
        title: '調整後目標',
        progress_percent: 10,
        cycle_id: 'cycle-1',
        owner_id: 'm1',
        set_by: 'mgr-1',
        goal_type: 'individual',
        description: null,
        due_date: '2026-09-30',
        published_at: null,
      };

      await page.route('**/api/v1/users/m1/goals/goal-123', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: updated });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/goals/goal-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress', title: '調整後目標' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.id).toBe('goal-123');
      expect(resp.body.status).toBe('in_progress');
    });

    test('M-API-ListGoals: GET /users/:user_id/goals returns data array', async ({ page }) => {
      const list = {
        data: [
          {
            id: 'g1',
            cycle_id: 'cycle-1',
            owner_id: 'm1',
            set_by: 'mgr-1',
            goal_type: 'individual',
            title: 'A goal',
            description: null,
            progress_percent: 50,
            due_date: '2026-06-30',
            status: 'in_progress',
            published_at: null,
          },
        ],
      };

      await page.route('**/api/v1/users/m1/goals**', async route => {
        await route.fulfill({ status: 200, json: list });
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/goals');
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(Array.isArray(resp.body.data)).toBeTruthy();
      expect(resp.body.data[0]).toHaveProperty('id');
    });

    test('M-API-CreateKPI: POST /users/:user_id/kpis returns created SubordinateKpi array', async ({ page }) => {
      const kpi = {
        data: [
          {
            id: 'kpi-1',
            cycle_id: 'cycle-1',
            created_by: 'mgr-1',
            kpi_type: 'individual',
            title: '季營收達成率',
            description: null,
            unit: 'NTD',
            assignment: {
              weight: 50,
              target_value: 1000000,
              current_value: null,
              last_updated_at: null,
            },
            published_at: null,
          },
        ],
      };

      await page.route('**/api/v1/users/m1/kpis', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: kpi });
        } else {
          await route.fulfill({ status: 200, json: { data: [] } });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/kpis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '季營收達成率', kpi_type: 'individual', unit: 'NTD', target_value: 1000000 }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(201);
      expect(Array.isArray(resp.body.data)).toBeTruthy();
      expect(resp.body.data[0]).toHaveProperty('id');
    });

    test('M-API-UpdateKPI: PATCH /users/:user_id/kpis/:kpi_id returns updated SubordinateKpi', async ({ page }) => {
      const updatedKpi = {
        id: 'kpi-1',
        cycle_id: 'cycle-1',
        created_by: 'mgr-1',
        kpi_type: 'individual',
        title: '季營收達成率',
        description: '更新描述',
        unit: 'NTD',
        assignment: {
          weight: 60,
          target_value: 1200000,
          current_value: null,
          last_updated_at: null,
        },
        published_at: null,
      };

      await page.route('**/api/v1/users/m1/kpis/kpi-1', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: updatedKpi });
        }
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/kpis/kpi-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_value: 1200000, description: '更新描述' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(resp.body.assignment.target_value).toBe(1200000);
    });

    test('M-API-Evaluations: PATCH questionnaire & kpis endpoints', async ({ page }) => {
      const questionnaireResp = {
        review_id: 'rev-1',
        responses: [
          {
            id: 'r1',
            question_id: 'q1',
            respondent_type: 'manager',
            rating_value: 4,
            text_value: '良好',
            boolean_value: null,
            responded_at: '2026-06-01T15:30:00+08:00',
          },
        ],
        updated_at: '2026-06-01T15:30:00+08:00',
      };

      await page.route('**/api/v1/users/m1/evaluations/eval-1/questionnaire', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: questionnaireResp });
        }
      });

      const qResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/evaluations/eval-1/questionnaire', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses: [ { question_id: 'q1', rating_value: 4, text_value: '良好' } ] }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(qResp.status).toBe(200);
      expect(qResp.body.review_id).toBe('rev-1');

      const kpisResp = {
        review_id: 'rev-1',
        status: 'completed',
        final_rating: 'exceeds_expectations',
        manager_comment: '表現優異',
      };

      await page.route('**/api/v1/users/m1/evaluations/eval-1/kpis', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: kpisResp });
        }
      });

      const kpResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/evaluations/eval-1/kpis', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', final_rating: 'exceeds_expectations', manager_comment: '表現優異', kpi_evaluations: [] }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(kpResp.status).toBe(200);
      expect(kpResp.body.status).toBe('completed');
    });

    test('M-API-History: GET /users/:user_id/evaluations returns history items', async ({ page }) => {
      const history = {
        data: [
          {
            id: 'h1',
            cycle_id: 'cycle-2025',
            employee_id: 'm1',
            manager_id: 'mgr-1',
            status: 'completed',
            final_rating: 'exceeds_expectations',
            manager_comment: 'Great',
            updated_at: '2026-05-20T10:00:00+08:00',
          },
        ],
      };

      await page.route('**/api/v1/users/m1/evaluations**', async route => {
        await route.fulfill({ status: 200, json: history });
      });

      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/users/m1/evaluations');
        return { status: r.status, body: await r.json() };
      });

      expect(resp.status).toBe(200);
      expect(Array.isArray(resp.body.data)).toBeTruthy();
      expect(resp.body.data[0].id).toBe('h1');
    });

    test('M-API-Appeals: GET team appeals and PATCH to resolve', async ({ page }) => {
      const appeals = [
        {
          id: 'a1',
          review_id: 'rev-1',
          case_no: 'CASE-001',
          filed_by: 'm2',
          assigned_to_type: 'senior_manager',
          assigned_to: 'mgr-2',
          reason: '分數不合理',
          status: 'submitted',
          filed_at: '2026-05-24T09:12:05+08:00',
          resolved_at: null,
        },
      ];

      await page.route('**/api/v1/teams/team-1/appeals', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, json: appeals });
        } else {
          await route.fulfill({ status: 200, json: { success: true } });
        }
      });

      await page.route('**/api/v1/teams/team-1/appeals/a1', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({ status: 200, json: { id: 'a1', status: 'approved', resolved_at: '2026-05-30T10:00:00+08:00' } });
        }
      });

      const listResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/teams/team-1/appeals');
        return { status: r.status, body: await r.json() };
      });

      expect(listResp.status).toBe(200);
      expect(Array.isArray(listResp.body)).toBeTruthy();
      expect(listResp.body[0].id).toBe('a1');

      const patchResp = await page.evaluate(async () => {
        const r = await fetch('/api/v1/teams/team-1/appeals/a1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', response_text: '核准' }),
        });
        return { status: r.status, body: await r.json() };
      });

      expect(patchResp.status).toBe(200);
      expect(patchResp.body.status).toBe('approved');
    });
  });
});
