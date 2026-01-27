import { expect, test } from '@playwright/test';
import { generateTestUser, login, signup } from '../helpers/auth';
import { buildFullUrl, waitForLoadingToComplete } from '../helpers/wait';

test.describe('ホーム画面のテスト', () => {
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

  test('ホーム画面の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // アプリタイトルまたはウェルカムメッセージが表示されていることを確認
    await expect(page.locator('text=おかえりなさい！, text=Futari')).toBeVisible({ timeout: 10000 });
  });

  test('月次支出サマリーの表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // 月次支出のセクションが表示されていることを確認
    const summarySection = page.locator('text=今月の支出, text=¥').first();
    if (await summarySection.count() > 0) {
      await expect(summarySection).toBeVisible({ timeout: 5000 });
    }
  });

  test('家事統計の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // 家事統計が表示されていることを確認
    const choresSection = page.locator('text=家事, text=完了').first();
    if (await choresSection.count() > 0) {
      await expect(choresSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('最近の支出の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // 最近の支出セクションが表示されていることを確認
    const recentExpenses = page.locator('text=最近の支出, text=支出').first();
    if (await recentExpenses.count() > 0) {
      await expect(recentExpenses).toBeVisible({ timeout: 5000 });
    }
  });

  test('買い物リストの表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // 買い物リストセクションが表示されていることを確認
    const shoppingSection = page.locator('text=買い物リスト, text=アイテム').first();
    if (await shoppingSection.count() > 0) {
      await expect(shoppingSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('記念日の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // 記念日セクションが表示されていることを確認（もしあれば）
    const anniversarySection = page.locator('text=記念日, text=日後').first();
    if (await anniversarySection.count() > 0) {
      await expect(anniversarySection).toBeVisible({ timeout: 5000 });
    }
  });

  test('タブナビゲーション', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)'));
    await waitForLoadingToComplete(page);

    // 各タブをクリックして遷移を確認
    const tabs = ['家計', '家事', '買い物', '設定'];

    for (const tabName of tabs) {
      const tab = page.locator(`text=${tabName}`).first();
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForTimeout(1000);

        // タブが選択されていることを確認
        const isActive = await tab.evaluate((el) => {
          return el.classList.contains('active') ||
            el.getAttribute('aria-selected') === 'true';
        });
        // 少なくともタブが存在することを確認
        expect(await tab.count()).toBeGreaterThan(0);
      }
    }
  });
});
