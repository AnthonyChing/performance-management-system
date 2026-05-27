import { test, expect } from '@playwright/test';

test.describe('Employee Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('2.1 Authentication & Profile', () => {
    test('E-AUTH-01: 員工成功登入', async ({ page }) => {
      await page.route('**/sessions', async route => {
        await route.fulfill({ status: 200, json: { token: 'fake-emp-token', role: 'employee' } });
      });

      await page.fill('input[name="username"]', 'employee1');
      await page.fill('input[name="password"]', 'pass123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('E-PROF-01: 查看個人基本資料與考核週期', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-emp-token'));
      await page.route('**/me/profile', async route => {
        await route.fulfill({ status: 200, json: { name: 'John Doe', department: 'IT' } });
      });
      await page.route('**/me/performance-cycles', async route => {
        await route.fulfill({ status: 200, json: [{ current: true, name: '2026 Q1' }] });
      });
      
      await page.goto('/profile');
      await expect(page.locator('text="John Doe"')).toBeVisible();
      await expect(page.locator('text="2026 Q1"')).toBeVisible();
    });
  });

  test.describe('2.3 Self-Evaluation', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-emp-token'));
      await page.goto('/self-evaluation');
    });

    test('E-SELF-01 & E-SELF-02: 讀取並暫存自評', async ({ page }) => {
      await page.route('**/me/self-evaluation', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, json: { text: '' } });
        } else if (route.request().method() === 'PUT') {
          await route.fulfill({ status: 200, json: { success: true } });
        } else {
          route.continue();
        }
      });
      
      await page.fill('textarea[name="self_review"]', 'I did great this quarter.');
      await page.click('button:has-text("暫存")');
    });

    test('E-SELF-03: 提交自評', async ({ page }) => {
      await page.route('**/me/self-evaluation', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { success: true, locked: true } });
        } else {
          await route.fulfill({ status: 200, json: { text: 'I did great this quarter.' } });
        }
      });
      
      await page.click('button:has-text("提交")');
      await expect(page.locator('text="已送出"')).toBeVisible();
    });
  });

  test.describe('2.4 KPI Tracking', () => {
    test('E-KPI-01 & E-KPI-02: 個人績效檢視與確認', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-emp-token'));
      await page.goto('/kpis/result');
      
      await page.route('**/me/kpis/result', async route => {
        await route.fulfill({ status: 200, json: { score: 85, level: 'A' } });
      });
      await page.route('**/me/kpis/result-confirmations', async route => {
        await route.fulfill({ status: 200, json: { success: true } });
      });

      await expect(page.locator('text="85"')).toBeVisible();
      await page.click('button:has-text("確認績效")');
    });
  });

  test.describe('2.6 Appeals', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-emp-token'));
      await page.goto('/appeals/new');
    });

    test('E-APPL-01: 發起異議', async ({ page }) => {
      await page.route('**/me/appeals', async route => {
        await route.fulfill({ status: 201, json: { success: true } });
      });
      
      await page.fill('textarea[name="reason"]', 'Missing project bonus in KPI');
      await page.click('button:has-text("發起異議")');
      await expect(page.locator('text="成功"')).toBeVisible();
    });
  });
});
