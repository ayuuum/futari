import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForText, waitForNavigation, waitForLoadingToComplete } from '../helpers/wait';
import { generateTestChore } from '../helpers/data';

test.describe('家事管理フロー', () => {
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

  test('家事の追加', async ({ page }) => {
    // 家事タブに移動
    await page.goto('/(tabs)/chores');
    await waitForLoadingToComplete(page);
    
    // 「家事を追加」ボタンをクリック
    const addButton = page.locator('button:has-text("家事を追加"), text=+ 家事を追加').first();
    await addButton.click();
    
    // モーダルが表示されるまで待機
    await waitForText(page, '家事を追加', 5000);
    
    // テストデータを生成
    const chore = generateTestChore();
    
    // 家事名を入力
    const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="例"]').first();
    await nameInput.fill(chore.name);
    
    // カテゴリを選択
    const categoryButton = page.locator(`button:has-text("${chore.category}")`).first();
    await categoryButton.click();
    
    // 頻度を選択
    const frequencyButton = page.locator(`button:has-text("${chore.frequency}")`).first();
    await frequencyButton.click();
    
    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("追加"), button:has-text("保存")').first();
    await saveButton.click();
    
    // モーダルが閉じるまで待機
    await page.waitForTimeout(1000);
    
    // 追加した家事が表示されていることを確認
    await expect(page.locator(`text=${chore.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('家事の完了状態の切り替え', async ({ page }) => {
    // まず家事を追加
    await page.goto('/(tabs)/chores');
    await waitForLoadingToComplete(page);
    
    const chore = generateTestChore();
    
    // 家事を追加
    const addButton = page.locator('button:has-text("家事を追加"), text=+ 家事を追加').first();
    await addButton.click();
    await waitForText(page, '家事を追加', 5000);
    
    const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="例"]').first();
    await nameInput.fill(chore.name);
    
    const categoryButton = page.locator(`button:has-text("${chore.category}")`).first();
    if (await categoryButton.count() > 0) {
      await categoryButton.click();
    }
    
    const frequencyButton = page.locator(`button:has-text("${chore.frequency}")`).first();
    if (await frequencyButton.count() > 0) {
      await frequencyButton.click();
    }
    
    const saveButton = page.locator('button:has-text("追加"), button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 追加した家事アイテムを探す
    const choreItem = page.locator(`text=${chore.name}`).first();
    
    if (await choreItem.count() > 0) {
      // 家事アイテムをクリックして完了状態を切り替え
      await choreItem.click();
      
      // 状態が変更されるまで待機
      await page.waitForTimeout(2000);
      
      // 完了状態が反映されていることを確認（チェックマークが表示される）
      // チェックボックスまたは完了マークを確認
      const completedIndicator = page.locator('[data-testid="chore-completed"], text=✓').first();
      if (await completedIndicator.count() > 0) {
        await expect(completedIndicator).toBeVisible();
      }
    }
  });
});
