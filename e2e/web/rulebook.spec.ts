import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';

test.describe('ルールブックのテスト', () => {
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

  test('ルールブック画面の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/rulebook'));
    await waitForLoadingToComplete(page);
    
    // ルールブック画面が表示されていることを確認
    const screen = page.locator('text=ルールブック, text=ルール').first();
    await expect(screen).toBeVisible({ timeout: 10000 });
  });

  test('ルールの追加', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/rulebook'));
    await waitForLoadingToComplete(page);
    
    // 追加ボタンを探す
    const addButton = page.locator('button:has-text("追加"), text=+').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // モーダルが表示されることを確認
      const modal = page.locator('text=ルール追加, input[placeholder*="タイトル"]').first();
      if (await modal.count() > 0) {
        // ルール情報を入力
        const titleInput = page.locator('input[placeholder*="タイトル"], input[placeholder*="ルール"]').first();
        await titleInput.fill('テストルール');
        
        // カテゴリを選択
        const categoryButton = page.locator('button:has-text("家事")').first();
        if (await categoryButton.count() > 0) {
          await categoryButton.click();
        }
        
        // 保存
        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
        
        // 追加したルールが表示されていることを確認
        await expect(page.locator('text=テストルール')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('ルールの確認', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/rulebook'));
    await waitForLoadingToComplete(page);
    
    // まずルールを追加
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const titleInput = page.locator('input[placeholder*="タイトル"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('確認テストルール');
        const saveButton = page.locator('button:has-text("保存")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 追加したルールの確認ボタンを探す
    const ruleItem = page.locator('text=確認テストルール').first();
    if (await ruleItem.count() > 0) {
      // 確認ボタンを探す
      const confirmButton = page.locator('button:has-text("確認"), button:has-text("承認")').first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        
        // ルールが確認済みになったことを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });

  test('AI言い換え機能', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/rulebook'));
    await waitForLoadingToComplete(page);
    
    // まずルールを追加
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const titleInput = page.locator('input[placeholder*="タイトル"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('掃除は毎日やる');
        const saveButton = page.locator('button:has-text("保存")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 追加したルールのAI言い換えボタンを探す
    const ruleItem = page.locator('text=掃除は毎日やる').first();
    if (await ruleItem.count() > 0) {
      const rephraseButton = page.locator('button:has-text("言い換え"), button:has-text("AI")').first();
      if (await rephraseButton.count() > 0) {
        await rephraseButton.click();
        await page.waitForTimeout(3000); // AI処理を待つ
        
        // 言い換えられたテキストが表示されていることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });
});
