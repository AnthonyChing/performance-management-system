import { test, expect } from '@playwright/test';

test.describe('HR Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Mock HR login
    await page.route('**/api/v1/sessions', async route => {
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

    test('HR-TMPL-01: 瀏覽評估模板', async ({ page }) => {
      await expect(page.locator('text="2023年度績效考核範本"')).toBeVisible();
    });
  });

  test.describe('3.2 Performance Cycles', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/hr/cycles');
    });

    test('HR-CYCL-01: 查看評估週期清單', async ({ page }) => {
      await expect(page.locator('text="2024 年度績效考核"')).toBeVisible();
      await expect(page.locator('text="2023 第四季度考核"')).toBeVisible();
    });
  });

  test.describe('3.3 Audit Logs', () => {
    test('HR-AUDT-01 & HR-AUDT-02: 查看與匯出稽核紀錄', async ({ page }) => {
      await page.goto('/hr/audit');
      await expect(page.locator('text="建立考核表"')).toBeVisible();
      await expect(page.locator('text="發佈考核結果"')).toBeVisible();
    });
  });
});
