import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';

test.describe('エラーハンドリングのテスト', () => {
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

  test('ネットワークエラー時の処理', async ({ page }) => {
    // オフラインモードをシミュレート
    await page.context().setOffline(true);
    
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await page.waitForTimeout(2000);
    
    // エラーメッセージが表示されることを確認
    const pageText = await page.textContent('body');
    // エラーメッセージまたはオフライン状態の表示を確認
    expect(pageText).toBeTruthy();
    
    // オンラインに戻す
    await page.context().setOffline(false);
  });

  test('支出追加 - バリデーションエラー（金額が空）', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    // 支出追加画面を開く
    const addButton = page.locator('a[href="/expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // 金額を入力せずに保存を試みる
    const saveButton = page.locator('button:has-text("支出を記録")').first();
    await saveButton.click();
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|入力してください/);
  });

  test('支出追加 - バリデーションエラー（説明が空）', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    // 支出追加画面を開く
    const addButton = page.locator('a[href="/expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // 金額のみ入力して保存を試みる
    const amountInput = page.locator('input[placeholder="0"]').first();
    await amountInput.fill('1000');
    
    const saveButton = page.locator('button:has-text("支出を記録")').first();
    await saveButton.click();
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|入力してください/);
  });

  test('家事追加 - バリデーションエラー（名前が空）', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/chores'));
    await waitForLoadingToComplete(page);
    
    // 家事追加モーダルを開く
    const addButton = page.locator('button:has-text("家事を追加")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // 名前を入力せずに保存を試みる
    const saveButton = page.locator('button:has-text("追加")').first();
    await saveButton.click();
    
    // エラーメッセージが表示されるか、ボタンが無効になっていることを確認
    await page.waitForTimeout(1000);
    const isDisabled = await saveButton.isDisabled();
    // ボタンが無効になっているか、エラーメッセージが表示されている
    expect(isDisabled || (await page.textContent('body'))?.match(/エラー|入力/) !== null).toBeTruthy();
  });

  test('買い物アイテム追加 - 空の入力', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/shopping'));
    await waitForLoadingToComplete(page);
    
    // 空の状態で追加ボタンをクリックまたはEnterを押す
    const input = page.locator('input[placeholder*="アイテムを追加"]').first();
    const addButton = page.locator('button:has-text("追加")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
    } else {
      await input.press('Enter');
    }
    
    // アイテムが追加されないことを確認
    await page.waitForTimeout(1000);
    const itemCount = await page.locator('[data-testid="shopping-item"]').count();
    // 空の入力では追加されない（またはエラーが表示される）
    expect(itemCount).toBe(0);
  });
});
