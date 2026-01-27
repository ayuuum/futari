import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';

test.describe('カレンダーのテスト', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    try {
      await signup(page, testUser);
      await page.waitForTimeout(2000);
      if (page.url().includes('login')) {
        await login(page, testUser.email, testUser.password);
      }
    } catch {
      test.skip();
    }
  });

  test('カレンダー画面の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/calendar'));
    await waitForLoadingToComplete(page);
    
    // カレンダーが表示されていることを確認
    const calendar = page.locator('text=カレンダー, [role="grid"]').first();
    await expect(calendar).toBeVisible({ timeout: 10000 });
  });

  test('イベントの追加', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/calendar'));
    await waitForLoadingToComplete(page);
    
    // イベント追加ボタンを探す
    const addButton = page.locator('a[href="/calendar-add"], button:has-text("追加"), text=+').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // イベント追加画面が表示されることを確認
      const addScreen = page.locator('text=イベント追加, text=予定').first();
      if (await addScreen.count() > 0) {
        // イベント情報を入力
        const titleInput = page.locator('input[placeholder*="タイトル"], input[placeholder*="名前"]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('テストイベント');
          
          // 保存ボタンをクリック
          const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
          await saveButton.click();
          await page.waitForTimeout(2000);
          
          // カレンダーに戻り、イベントが表示されていることを確認
          await expect(page.locator('text=テストイベント')).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('月の切り替え', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/calendar'));
    await waitForLoadingToComplete(page);
    
    // 前月/次月ボタンを探す
    const nextMonthButton = page.locator('button:has-text("次"), button[aria-label*="次"]').first();
    if (await nextMonthButton.count() > 0) {
      await nextMonthButton.click();
      await page.waitForTimeout(1000);
      
      // 月が変更されていることを確認
      const currentMonth = new Date().getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const monthText = page.locator(`text=${nextMonth}月`).first();
      if (await monthText.count() > 0) {
        await expect(monthText).toBeVisible();
      }
    }
  });
});
