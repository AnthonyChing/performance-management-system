import { test, expect } from '@playwright/test';

test.describe('Manager Module', () => {
  test.beforeEach(async ({ page }) => {
    // 假設有一個基礎的登入頁面
    await page.goto('/login');
  });

  test.describe('1.1 Authentication', () => {
    test('M-AUTH-01: 成功使用有效的主管帳密登入系統', async ({ page }) => {
      await page.route('**/sessions', async route => {
        await route.fulfill({ status: 200, json: { token: 'fake-jwt-token', role: 'manager' } });
      });

      await page.fill('input[name="username"]', 'manager1');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('M-AUTH-02: 輸入錯誤的帳密登入失敗', async ({ page }) => {
      await page.route('**/sessions', async route => {
        await route.fulfill({ status: 401, json: { error: 'Invalid credentials' } });
      });

      await page.fill('input[name="username"]', 'manager1');
      await page.fill('input[name="password"]', 'wrongpass');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toBeVisible();
    });
  });

  test.describe('1.2 Notifications', () => {
    test.beforeEach(async ({ page }) => {
      // Mock login state and setup storage
      await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
      await page.goto('/notifications');
    });

    test('M-NOTI-01: 查看一般系統通知', async ({ page }) => {
      await page.route('**/notifications?type=system', async route => {
        await route.fulfill({ status: 200, json: [{ id: 1, text: 'System update' }] });
      });
      await page.click('text="系統通知"');
      await expect(page.locator('text="System update"')).toBeVisible();
    });

    test('M-NOTI-02: 查看待辦事項', async ({ page }) => {
      await page.route('**/notifications?type=todo', async route => {
        await route.fulfill({ status: 200, json: [{ id: 2, text: 'Please review performance' }] });
      });
      await page.click('text="待辦事項"');
      await expect(page.locator('text="Please review performance"')).toBeVisible();
    });

    test('M-NOTI-03: 更新通知狀態為已讀', async ({ page }) => {
      await page.route('**/notifications/1', async route => {
        await route.fulfill({ status: 200, json: { success: true } });
      });
      await page.click('button:has-text("標示為已讀")');
      // 可以驗證未讀數量是否有減少
    });
  });

  test.describe('1.3 Goals & KPIs Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
      await page.goto('/goals-kpis');
    });

    test('M-GOAL-01 & M-GOAL-02: 新增/編輯團隊目標', async ({ page }) => {
      await page.route('**/teams/1/goals', async route => {
        await route.fulfill({ status: 201, json: { id: 1, title: 'Q1 Revenue' } });
      });
      await page.click('button:has-text("新增團隊目標")');
      await page.fill('input[name="goal_title"]', 'Q1 Revenue');
      await page.click('button:has-text("儲存")');
      await expect(page.locator('text="成功新增"')).toBeVisible();
    });

    test('M-KPI-01 & M-KPI-02: 設定團隊KPI與調整權重', async ({ page }) => {
      await page.route('**/teams/1/kpis', async route => {
        await route.fulfill({ status: 201, json: { id: 1, weight: 50 } });
      });
      await page.click('button:has-text("新增KPI")');
      await page.fill('input[name="kpi_weight"]', '50');
      await page.click('button:has-text("儲存")');
    });
  });

  test.describe('1.4 Team Evaluations', () => {
    test('M-EVAL-01: 查看考核狀態總覽', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
      await page.route('**/teams/1/evaluations/status', async route => {
        await route.fulfill({ status: 200, json: [{ userId: 2, status: 'submitted' }] });
      });
      await page.goto('/evaluations/status');
      await expect(page.locator('text="已提交"')).toBeVisible();
    });

    test('M-EVAL-02 & M-EVAL-03: 填寫評分表與計算', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
      await page.goto('/evaluations/user/2');
      await page.route('**/users/2/evaluations/1', async route => {
        await route.fulfill({ status: 200, json: { success: true } });
      });
      await page.fill('input[name="score"]', '90');
      await page.click('button:has-text("暫存")');
    });
  });

  test.describe('1.6 Appeals Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
      await page.goto('/appeals');
    });

    test('M-APPL-01 & M-APPL-02: 異議列表與詳情檢視', async ({ page }) => {
      await page.route('**/teams/1/appeals', async route => {
        await route.fulfill({ status: 200, json: [{ id: 1, title: 'Score unfair' }] });
      });
      await page.reload();
      await expect(page.locator('text="Score unfair"')).toBeVisible();
    });

    test('M-APPL-03: 處理異議申請', async ({ page }) => {
      await page.route('**/teams/1/appeals/1', async route => {
        await route.fulfill({ status: 200, json: { status: 'resolved' } });
      });
      await page.click('button:has-text("決議")');
      await page.fill('textarea[name="comment"]', 'Approved score adjustment.');
      await page.click('button:has-text("送出異議結果")');
    });
  });
});
