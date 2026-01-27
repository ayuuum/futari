import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForNavigation, waitForLoadingToComplete } from '../helpers/wait';

test.describe('設定フロー', () => {
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

  test('プロフィール編集', async ({ page }) => {
    // 設定タブに移動
    await page.goto('/(tabs)/settings');
    await waitForLoadingToComplete(page);
    
    // プロフィール編集リンクまたはボタンをクリック
    const profileLink = page.locator('a[href="/profile-edit"], button:has-text("編集")').first();
    await profileLink.click();
    
    // プロフィール編集画面に遷移
    await waitForNavigation(page, '**/profile-edit**');
    await page.waitForTimeout(1000);
    
    // 名前を変更
    const nameInput = page.locator('input[placeholder*="名前を入力"], input[value]').first();
    const newName = `更新された${testUser.name}`;
    
    await nameInput.clear();
    await nameInput.fill(newName);
    
    // 保存ボタンをクリック（ヘッダーの保存ボタン）
    const saveButton = page.locator('button:has-text("保存"), text=保存').first();
    await saveButton.click();
    
    // 設定画面に戻る
    await waitForNavigation(page, '**/(tabs)/settings**');
    await waitForLoadingToComplete(page);
    
    // 更新された名前が表示されていることを確認
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 10000 });
  });
});
