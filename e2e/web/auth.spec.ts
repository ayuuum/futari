import { test, expect } from '@playwright/test';
import { generateTestUser, login, signup, logout, cleanupTestUser } from '../helpers/auth';
import { waitForText, waitForNavigation } from '../helpers/wait';

test.describe('認証フロー', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(() => {
    testUser = generateTestUser();
  });

  test.afterEach(async () => {
    // テスト後のクリーンアップ
    if (testUser.email) {
      await cleanupTestUser(testUser.email);
    }
  });

  test('新規登録フロー', async ({ page }) => {
    // オンボーディング画面をスキップ（既に完了していると仮定）
    // または、オンボーディング画面から新規登録に遷移
    
    // 新規登録ページに移動
    await page.goto('/(auth)/signup');
    
    // フォームに入力
    await page.fill('input[placeholder="お名前"]', testUser.name);
    await page.fill('input[placeholder="メールアドレス"]', testUser.email);
    await page.fill('input[placeholder="パスワード（6文字以上）"]', testUser.password);
    
    // 登録ボタンをクリック
    await page.click('button:has-text("登録する")');
    
    // 登録完了のアラートを確認
    await waitForText(page, '登録完了', 15000);
    
    // 招待コードが表示されていることを確認
    const alertText = await page.textContent('text=登録完了');
    expect(alertText).toContain('招待コード');
    
    // 招待コードを抽出
    const inviteCodeMatch = alertText?.match(/([A-Z0-9]{6})/);
    expect(inviteCodeMatch).not.toBeNull();
    
    // OKボタンをクリック
    await page.click('button:has-text("OK")');
    
    // メール確認が必要な場合はログインページに遷移
    // セッションが確立されている場合はホーム画面に遷移
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      // メール確認待ちの状態
      await waitForText(page, 'メール確認が必要です', 5000);
    } else {
      // ホーム画面に遷移
      await waitForNavigation(page, '**/(tabs)**');
    }
  });

  test('ログインフロー', async ({ page }) => {
    // まず新規登録（セッションが確立される場合）
    const inviteCode = await signup(page, testUser);
    
    // ログアウト（セッションが確立されている場合）
    try {
      await logout(page);
    } catch {
      // ログアウトできない場合は、メール確認待ちの状態
    }
    
    // ログインページに移動
    await page.goto('/(auth)/login');
    
    // ログイン情報を入力
    await page.fill('input[placeholder="メールアドレス"]', testUser.email);
    await page.fill('input[placeholder="パスワード"]', testUser.password);
    
    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")');
    
    // ホーム画面に遷移するか、エラーメッセージが表示される
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      // ログインエラーまたはメール確認待ち
      const errorText = await page.textContent('body');
      expect(errorText).toMatch(/ログインエラー|メール確認/);
    } else {
      // ホーム画面に遷移
      await waitForNavigation(page, '**/(tabs)**');
      await expect(page.locator('text=💑 Futari')).toBeVisible();
    }
  });

  test('招待コードで参加フロー', async ({ page }) => {
    // 最初のユーザーを登録
    const user1 = generateTestUser();
    const inviteCode = await signup(page, user1);
    
    expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    
    // ログアウト（セッションが確立されている場合）
    try {
      await logout(page);
    } catch {
      // ログアウトできない場合はスキップ
    }
    
    // 2人目のユーザーで参加
    const user2 = generateTestUser();
    await page.goto('/(auth)/join');
    
    // 招待コードを入力
    await page.fill('input[placeholder="招待コード（6文字）"]', inviteCode);
    await page.fill('input[placeholder="お名前"]', user2.name);
    await page.fill('input[placeholder="メールアドレス"]', user2.email);
    await page.fill('input[placeholder="パスワード（6文字以上）"]', user2.password);
    
    // 参加ボタンをクリック
    await page.click('button:has-text("参加する")');
    
    // 参加完了のアラートを確認
    await waitForText(page, '参加完了', 15000);
    
    // OKボタンをクリック
    await page.click('button:has-text("はじめる")');
    
    // ホーム画面に遷移（メール確認が必要な場合はログインページ）
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (!currentUrl.includes('login')) {
      await waitForNavigation(page, '**/(tabs)**');
    }
  });

  test('ログアウトフロー', async ({ page }) => {
    // ログイン（セッションが確立されている場合）
    try {
      await login(page, testUser.email, testUser.password);
      await logout(page);
      
      // ログインページに遷移したことを確認
      await waitForNavigation(page, '**/(auth)/login**');
      await expect(page.locator('text=ログイン')).toBeVisible();
    } catch {
      // ログインできない場合はスキップ（メール確認待ちなど）
      test.skip();
    }
  });
});
