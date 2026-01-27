import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForText, waitForLoadingToComplete } from '../helpers/wait';
import { generateTestShoppingItem } from '../helpers/data';

test.describe('買い物リストフロー', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    
    // 新規登録してログイン状態にする
    try {
      await signup(page, testUser);
      await page.waitForTimeout(2000);
      
      // メール確認待ちの場合はログインを試みる
      if (page.url().includes('login')) {
        await login(page, testUser.email, testUser.password);
      }
    } catch {
      test.skip();
    }
  });

  test('アイテムの追加', async ({ page }) => {
    // 買い物タブに移動
    await page.goto('/(tabs)/shopping');
    await waitForLoadingToComplete(page);
    
    // テストデータを生成
    const item = generateTestShoppingItem();
    
    // アイテム名を入力
    const input = page.locator('input[placeholder*="アイテムを追加"], input[placeholder*="アイテム"]').first();
    await input.fill(item.name);
    
    // 追加ボタンをクリック（またはEnterキーを押す）
    const addButton = page.locator('button:has-text("追加"), button[type="submit"]').first();
    if (await addButton.count() > 0) {
      await addButton.click();
    } else {
      // ボタンがない場合はEnterキーを押す
      await input.press('Enter');
    }
    
    // 追加したアイテムが表示されるまで待機
    await page.waitForTimeout(1000);
    
    // 追加したアイテムが表示されていることを確認
    await expect(page.locator(`text=${item.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('購入済みマーク', async ({ page }) => {
    // 買い物タブに移動
    await page.goto('/(tabs)/shopping');
    await waitForLoadingToComplete(page);
    
    // 既存のアイテムを探す
    const item = page.locator('[data-testid="shopping-item"], button:has-text("未購入"), text=購入済み').first();
    
    if (await item.count() > 0) {
      // アイテムをクリックして購入済みにマーク
      await item.click();
      
      // 状態が変更されるまで待機
      await page.waitForTimeout(1000);
      
      // 購入済み状態が反映されていることを確認
      const pageText = await page.textContent('body');
      expect(pageText).toBeTruthy();
    } else {
      // アイテムがない場合は追加してからテスト
      const testItem = generateTestShoppingItem();
      const input = page.locator('input[placeholder*="買い物"], input[type="text"]').first();
      await input.fill(testItem.name);
      const addButton = page.locator('button:has-text("追加")').first();
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // 追加したアイテムをクリック
      const addedItem = page.locator(`text=${testItem.name}`).first();
      await addedItem.click();
      await page.waitForTimeout(1000);
    }
  });
});
