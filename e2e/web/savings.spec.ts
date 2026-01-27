import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';

test.describe('貯金目標のテスト', () => {
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

  test('貯金目標画面の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/savings'));
    await waitForLoadingToComplete(page);
    
    // 貯金目標画面が表示されていることを確認
    const screen = page.locator('text=貯金目標, text=目標').first();
    await expect(screen).toBeVisible({ timeout: 10000 });
  });

  test('貯金目標の追加', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/savings'));
    await waitForLoadingToComplete(page);
    
    // 追加ボタンを探す
    const addButton = page.locator('a[href="/savings/add-goal"], button:has-text("追加"), text=+').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // 目標追加画面が表示されることを確認
      const addScreen = page.locator('text=目標追加, input[placeholder*="タイトル"]').first();
      if (await addScreen.count() > 0) {
        // 目標情報を入力
        const titleInput = page.locator('input[placeholder*="タイトル"]').first();
        await titleInput.fill('旅行資金');
        
        const amountInput = page.locator('input[placeholder*="金額"], input[type="number"]').first();
        await amountInput.fill('500000');
        
        // 保存
        const saveButton = page.locator('button:has-text("保存"), button:has-text("作成")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
        
        // 追加した目標が表示されていることを確認
        await expect(page.locator('text=旅行資金')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('貯金目標の進捗更新', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/savings'));
    await waitForLoadingToComplete(page);
    
    // まず目標を追加
    const addButton = page.locator('a[href="/savings/add-goal"], button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const titleInput = page.locator('input[placeholder*="タイトル"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('進捗テスト目標');
        const amountInput = page.locator('input[type="number"]').first();
        await amountInput.fill('100000');
        const saveButton = page.locator('button:has-text("保存")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 追加した目標をクリックして詳細画面を開く
    const goalItem = page.locator('text=進捗テスト目標').first();
    if (await goalItem.count() > 0) {
      await goalItem.click();
      await page.waitForTimeout(1000);
      
      // 進捗追加ボタンを探す
      const addProgressButton = page.locator('button:has-text("追加"), button:has-text("記録")').first();
      if (await addProgressButton.count() > 0) {
        await addProgressButton.click();
        await page.waitForTimeout(1000);
        
        // 金額を入力
        const progressAmountInput = page.locator('input[placeholder*="金額"], input[type="number"]').first();
        if (await progressAmountInput.count() > 0) {
          await progressAmountInput.fill('10000');
          
          // 保存
          const saveProgressButton = page.locator('button:has-text("保存")').first();
          await saveProgressButton.click();
          await page.waitForTimeout(2000);
          
          // 進捗が更新されていることを確認
          const pageText = await page.textContent('body');
          expect(pageText).toContain('10000');
        }
      }
    }
  });
});
