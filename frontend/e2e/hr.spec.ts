import { test, expect } from '@playwright/test';

test.describe('HR Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Mock HR login
    await page.route('**/sessions', async route => {
      await route.fulfill({ status: 200, json: { token: 'fake-hr-token', role: 'hr' } });
    });
    await page.fill('input[name="username"]', 'hr_admin');
    await page.fill('input[name="password"]', 'hrpass123');
    await page.click('button[type="submit"]');
    await page.evaluate(() => localStorage.setItem('token', 'fake-hr-token'));
  });

  test('HR-AUTH-01: HR 登入後導向考核週期', async ({ page }) => {
    await expect(page).toHaveURL(/.*hr\/cycles/);
  });

  test.describe('3.1 Assessment Templates', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hr/templates');
    });

    test('HR-TMPL-01 & HR-TMPL-04: 瀏覽與建立評估模板', async ({ page }) => {
      await page.route('**/hr/assessment-templates?page=1', async route => {
        await route.fulfill({ status: 200, json: [{ id: 1, name: '2026 Developer Template' }] });
      });
      await page.route('**/hr/assessment-templates', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { success: true, id: 2 } });
        }
      });

      // View list
      await expect(page.locator('text="2026 Developer Template"')).toBeVisible();

      // Create new
      await page.click('button:has-text("新增模板")');
      await page.fill('input[name="template_name"]', 'Q3 Marketing Template');
      await page.click('button:has-text("儲存模板")');
    });

    test('HR-TMPL-03: 刪除評估模板', async ({ page }) => {
      await page.route('**/hr/assessment-templates/1', async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 200, json: { success: true } });
        }
      });

      await page.click('button[aria-label="Delete Template 1"]');
      await page.click('button:has-text("確認刪除")');
    });
  });

  test.describe('3.2 Performance Cycles', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hr/cycles');
    });

    test('HR-CYCL-01 & HR-CYCL-02: 查看與建立評估週期', async ({ page }) => {
      await page.route('**/hr/performance-cycles', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, json: [{ id: 1, name: '2026 Q1 Cycle', status: 'active' }] });
        } else if (route.request().method() === 'POST') {
          await route.fulfill({ status: 201, json: { success: true } });
        }
      });

      await expect(page.locator('text="2026 Q1 Cycle"')).toBeVisible();

      await page.click('button:has-text("建立週期")');
      await page.fill('input[name="cycle_name"]', '2026 Q2 Cycle');
      await page.click('button:has-text("送出")');
    });

    test('HR-CYCL-04: 切換週期狀態', async ({ page }) => {
      await page.route('**/hr/performance-cycles/1/status', async route => {
        await route.fulfill({ status: 200, json: { success: true, status: 'closed' } });
      });

      await page.click('button:has-text("關閉週期")');
      await expect(page.locator('text="已成功更新狀態"')).toBeVisible();
    });
  });

  test.describe('3.3 Audit Logs', () => {
    test('HR-AUDT-01 & HR-AUDT-02: 查看與匯出稽核紀錄', async ({ page }) => {
      await page.goto('/hr/audit-logs');
      await page.route('**/hr/audit-logs*', async route => {
        await route.fulfill({ status: 200, json: [{ id: 1, action: 'CREATE_CYCLE', user: 'HR Admin' }] });
      });
      await page.route('**/hr/audit-log-exports', async route => {
        await route.fulfill({ status: 200, body: 'id,action\n1,CREATE_CYCLE' }); // Mock CSV response
      });

      await expect(page.locator('text="CREATE_CYCLE"')).toBeVisible();
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("匯出紀錄")');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('3.4 Assessment Statuses', () => {
    test('HR-STAT-01: 查看全公司考核進度總覽', async ({ page }) => {
      await page.goto('/hr/status');
      await page.route('**/hr/assessment-statuses', async route => {
        await route.fulfill({ status: 200, json: { completed: 150, total: 200, rate: '75%' } });
      });

      await expect(page.locator('text="75%"')).toBeVisible();
    });
  });
});
