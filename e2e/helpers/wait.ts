import { Page, expect } from '@playwright/test';

/**
 * 待機処理のヘルパー関数
 */

/**
 * 要素が表示されるまで待機
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

/**
 * テキストが表示されるまで待機
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(`text=${text}`, { timeout, state: 'visible' });
}

/**
 * ナビゲーション完了まで待機
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * ローディングが完了するまで待機
 */
export async function waitForLoadingToComplete(page: Page, timeout = 10000): Promise<void> {
  // ActivityIndicatorが非表示になるまで待機
  try {
    await page.waitForSelector('[data-testid="loading"]', { 
      timeout: 2000, 
      state: 'hidden' 
    });
  } catch {
    // ローディング要素がない場合はスキップ
  }
  
  // または、特定のコンテンツが表示されるまで待機
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * アラートが表示されるまで待機（React Native Alertの場合）
 */
export async function waitForAlert(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  // React Native Alertは、Web版では通常のテキストとして表示される
  // または、モーダルとして表示される場合もある
  try {
    await waitForText(page, text, timeout);
  } catch {
    // モーダル内のテキストを探す
    await page.waitForSelector(`[role="alert"]:has-text("${text}")`, { timeout });
  }
}

/**
 * フォーム送信後の遷移を待機
 */
export async function waitForFormSubmission(
  page: Page,
  successIndicator: string,
  timeout = 10000
): Promise<void> {
  // 成功メッセージまたは次の画面への遷移を待機
  await Promise.race([
    waitForText(page, successIndicator, timeout),
    page.waitForURL('**/(tabs)**', { timeout }),
  ]);
}
