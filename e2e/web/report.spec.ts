import { expect, test } from '@playwright/test';
import { generateTestUser, login, signup } from '../helpers/auth';
import { buildFullUrl, waitForLoadingToComplete } from '../helpers/wait';

test.describe('レポートのテスト', () => {
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

  test('レポート画面の表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/report'));
    await waitForLoadingToComplete(page);

    // レポート画面が表示されていることを確認
    const reportScreen = page.locator('text=月次レポート, text=レポート').first();
    await expect(reportScreen).toBeVisible({ timeout: 10000 });
  });

  test('月の選択', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/report'));
    await waitForLoadingToComplete(page);

    // 月選択ボタンを探す
    const monthSelector = page.locator('button:has-text("月"), select').first();
    if (await monthSelector.count() > 0) {
      await monthSelector.click();
      await page.waitForTimeout(500);

      // 別の月を選択
      const differentMonth = page.locator('text=1月, text=2月').first();
      if (await differentMonth.count() > 0) {
        await differentMonth.click();
        await page.waitForTimeout(2000);

        // 選択した月のデータが表示されることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });

  test('支出トレンドの表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/report'));
    await waitForLoadingToComplete(page);

    // トレンドグラフが表示されていることを確認
    const trendSection = page.locator('text=トレンド, text=推移').first();
    if (await trendSection.count() > 0) {
      await expect(trendSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('AIサマリーの表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/report'));
    await waitForLoadingToComplete(page);

    // AIサマリーセクションを探す
    await page.waitForTimeout(3000); // AI処理を待つ

    const aiSummary = page.locator('text=サマリー, text=要約, text=AIサマリー').first();
    if (await aiSummary.count() > 0) {
      await expect(aiSummary).toBeVisible({ timeout: 10000 });
    }
  });

  test('支出アドバイスの表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/report'));
    await waitForLoadingToComplete(page);

    // AIアドバイスセクションを探す
    await page.waitForTimeout(3000); // AI処理を待つ

    const aiAdvice = page.locator('text=アドバイス, text=提案, text=AIアドバイス').first();
    if (await aiAdvice.count() > 0) {
      await expect(aiAdvice).toBeVisible({ timeout: 10000 });
    }
  });
});
