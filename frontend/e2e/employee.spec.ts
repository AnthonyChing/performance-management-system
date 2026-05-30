import { test, expect } from '@playwright/test';

test.describe('Employee Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('2.1 Authentication & Profile', () => {
    test('E-AUTH-01: 員工成功登入', async ({ page }) => {
      await page.route('**/api/v1/sessions', async route => {
        await route.fulfill({ status: 200, json: { token: 'fake-emp-token', role: 'employee' } });
      });

      await page.fill('input[name="username"]', 'employee1');
      await page.fill('input[name="password"]', 'pass123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('E-PROF-01: 查看個人基本資料與考核週期', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-emp-token'));
      await page.route('**/api/v1/me/profile', async route => {
        await route.fulfill({
          status: 200,
          json: {
            profile: {
              user_id: 'u-emp-1',
              employee_id: 'E-1001',
              name: 'John Doe',
              english_name: 'John Doe',
              avatar_url: null,
              job_title: 'Software Engineer',
              job_category: 'Engineering',
              department: {
                department_id: 'dept-01',
                name: 'IT',
              },
              location: 'Taipei',
              email: 'john.doe@example.com',
              employment_status: 'active',
              terminated_at: null,
              manager: {
                user_id: 'u-mgr-1',
                name: 'Jane Manager',
                english_name: 'Jane Manager',
                email: 'jane.manager@example.com',
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
              cycle_id: 'cycle-2026-q1',
              name: '2026 Q1',
              cycle_type: 'quarterly',
              period_label: '2026 Q1',
              start_date: '2026-01-01',
              end_date: '2026-03-31',
              timezone: 'Asia/Taipei',
              status: 'in_progress',
              is_locked: false,
              results_published_at: null,
              updated_at: '2026-01-10T08:00:00Z',
            },
          },
        });
      });
      
      await page.goto('/');
      await expect(page.locator('text="John Doe"')).toBeVisible();
      await expect(page.locator('text="2026 Q1"')).toBeVisible();
    });
  });
});
