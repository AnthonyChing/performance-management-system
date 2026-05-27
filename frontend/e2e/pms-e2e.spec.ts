import { test, expect } from '@playwright/test';

test('自動化測試：首頁載入與截圖', async ({ page }) => {
  // 假設前端 Vite 伺服器跑在 3000 port (請依照實際情況調整)
  await page.goto('http://127.0.0.1:3000/');

  // 1. 驗證網頁是否成功載入 (這裡可以請前端同學改成驗證特定按鈕或標題)
  // await expect(page.getByRole('button', { name: '登入' })).toBeVisible();

  // 2. 拍一張截圖當作測試證據 (截圖會存放在 test-results 資料夾，非常適合放在專題報告中！)
  await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
});
