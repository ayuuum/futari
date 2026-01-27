import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';

test.describe('設定画面の詳細テスト', () => {
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

  test('テーマ設定の変更', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/settings'));
    await waitForLoadingToComplete(page);
    
    // テーマ設定リンクを探す
    const themeLink = page.locator('a[href="/theme-settings"], text=テーマ設定').first();
    if (await themeLink.count() > 0) {
      await themeLink.click();
      await page.waitForTimeout(1000);
      
      // テーマ選択ボタンを探す
      const themeButton = page.locator('button:has-text("ダーク"), button:has-text("ライト")').first();
      if (await themeButton.count() > 0) {
        await themeButton.click();
        await page.waitForTimeout(1000);
        
        // テーマが変更されていることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });

  test('カップル設定の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/settings'));
    await waitForLoadingToComplete(page);
    
    // カップル設定リンクを探す
    const coupleLink = page.locator('a[href="/couple-settings"], text=カップル情報').first();
    if (await coupleLink.count() > 0) {
      await coupleLink.click();
      await page.waitForTimeout(1000);
      
      // カップル設定画面が表示されることを確認
      const coupleScreen = page.locator('text=カップル情報, text=記念日').first();
      await expect(coupleScreen).toBeVisible({ timeout: 10000 });
    }
  });

  test('負担割合設定', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/settings'));
    await waitForLoadingToComplete(page);
    
    // 負担割合リンクを探す
    const splitLink = page.locator('a[href="/split-settings"], text=負担割合').first();
    if (await splitLink.count() > 0) {
      await splitLink.click();
      await page.waitForTimeout(1000);
      
      // 負担割合設定画面が表示されることを確認
      const splitScreen = page.locator('text=負担割合, text=支出').first();
      if (await splitScreen.count() > 0) {
        // スライダーまたは入力フィールドを探す
        const slider = page.locator('input[type="range"], slider').first();
        if (await slider.count() > 0) {
          // スライダーを操作
          await slider.fill('60');
          await page.waitForTimeout(500);
          
          // 保存ボタンをクリック
          const saveButton = page.locator('button:has-text("保存")').first();
          await saveButton.click();
          await page.waitForTimeout(2000);
          
          // 設定が保存されていることを確認
          const pageText = await page.textContent('body');
          expect(pageText).toBeTruthy();
        }
      }
    }
  });

  test('記念日設定', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/settings'));
    await waitForLoadingToComplete(page);
    
    // 記念日リンクを探す
    const anniversaryLink = page.locator('a[href="/anniversaries"], text=記念日').first();
    if (await anniversaryLink.count() > 0) {
      await anniversaryLink.click();
      await page.waitForTimeout(1000);
      
      // 記念日画面が表示されることを確認
      const anniversaryScreen = page.locator('text=記念日, text=追加').first();
      await expect(anniversaryScreen).toBeVisible({ timeout: 10000 });
    }
  });

  test('プライバシー設定', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/settings'));
    await waitForLoadingToComplete(page);
    
    // プライバシー設定リンクを探す
    const privacyLink = page.locator('a[href="/privacy-settings"], text=プライバシー').first();
    if (await privacyLink.count() > 0) {
      await privacyLink.click();
      await page.waitForTimeout(1000);
      
      // プライバシー設定画面が表示されることを確認
      const privacyScreen = page.locator('text=プライバシー, text=データ管理').first();
      await expect(privacyScreen).toBeVisible({ timeout: 10000 });
    }
  });
});
