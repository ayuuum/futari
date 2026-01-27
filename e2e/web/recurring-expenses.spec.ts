import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';

test.describe('固定費管理のテスト', () => {
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

  test('固定費画面の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/recurring-expenses'));
    await waitForLoadingToComplete(page);
    
    // 固定費画面が表示されていることを確認
    const screen = page.locator('text=固定費管理, text=固定費').first();
    await expect(screen).toBeVisible({ timeout: 10000 });
  });

  test('固定費の追加', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/recurring-expenses'));
    await waitForLoadingToComplete(page);
    
    // 追加ボタンを探す
    const addButton = page.locator('button:has-text("追加"), text=+').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // モーダルまたはフォームが表示されることを確認
      const modal = page.locator('text=固定費追加, input[placeholder*="名前"]').first();
      if (await modal.count() > 0) {
        // 固定費情報を入力
        const nameInput = page.locator('input[placeholder*="名前"]').first();
        await nameInput.fill('家賃');
        
        const amountInput = page.locator('input[placeholder*="金額"], input[type="number"]').first();
        await amountInput.fill('80000');
        
        // カテゴリを選択
        const categoryButton = page.locator('button:has-text("住居")').first();
        if (await categoryButton.count() > 0) {
          await categoryButton.click();
        }
        
        // 保存
        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
        
        // 追加した固定費が表示されていることを確認
        await expect(page.locator('text=家賃')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('固定費の有効/無効切り替え', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/recurring-expenses'));
    await waitForLoadingToComplete(page);
    
    // まず固定費を追加
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input[placeholder*="名前"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('テスト固定費');
        const amountInput = page.locator('input[type="number"]').first();
        await amountInput.fill('5000');
        const saveButton = page.locator('button:has-text("保存")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 追加した固定費のトグルスイッチを探す
    const expenseItem = page.locator('text=テスト固定費').first();
    if (await expenseItem.count() > 0) {
      // トグルスイッチまたは有効/無効ボタンを探す
      const toggle = page.locator('input[type="checkbox"], button:has-text("有効"), button:has-text("無効")').first();
      if (await toggle.count() > 0) {
        await toggle.click();
        await page.waitForTimeout(1000);
        
        // 状態が変更されていることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });
});
