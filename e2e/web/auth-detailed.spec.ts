import { test, expect } from '@playwright/test';
import { generateTestUser, buildFullUrl } from '../helpers/wait';

test.describe('認証の詳細テスト', () => {
  test('新規登録 - バリデーションエラー（空のフィールド）', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(auth)/signup'));
    
    // 何も入力せずに登録ボタンをクリック
    await page.click('button:has-text("登録する")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|入力してください/);
  });

  test('新規登録 - パスワード要件エラー（6文字未満）', async ({ page }) => {
    const testUser = generateTestUser();
    await page.goto(buildFullUrl(page, '/(auth)/signup'));
    
    await page.fill('input[placeholder="お名前"]', testUser.name);
    await page.fill('input[placeholder="メールアドレス"]', testUser.email);
    await page.fill('input[placeholder="パスワード（6文字以上）"]', '12345'); // 5文字
    
    await page.click('button:has-text("登録する")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/パスワード|6文字以上/);
  });

  test('新規登録 - 無効なメールアドレス', async ({ page }) => {
    const testUser = generateTestUser();
    await page.goto(buildFullUrl(page, '/(auth)/signup'));
    
    await page.fill('input[placeholder="お名前"]', testUser.name);
    await page.fill('input[placeholder="メールアドレス"]', 'invalid-email');
    await page.fill('input[placeholder="パスワード（6文字以上）"]', testUser.password);
    
    await page.click('button:has-text("登録する")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|メールアドレス/);
  });

  test('ログイン - 無効な認証情報', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(auth)/login'));
    
    await page.fill('input[placeholder="メールアドレス"]', 'nonexistent@example.com');
    await page.fill('input[placeholder="パスワード"]', 'wrongpassword');
    
    await page.click('button:has-text("ログイン")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/ログインエラー|認証/);
  });

  test('ログイン - 空のフィールド', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(auth)/login'));
    
    // 何も入力せずにログインボタンをクリック
    await page.click('button:has-text("ログイン")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|入力してください/);
  });

  test('招待コード参加 - 無効な招待コード', async ({ page }) => {
    const testUser = generateTestUser();
    await page.goto(buildFullUrl(page, '/(auth)/join'));
    
    await page.fill('input[placeholder="招待コード（6文字）"]', 'INVALID');
    await page.fill('input[placeholder="お名前"]', testUser.name);
    await page.fill('input[placeholder="メールアドレス"]', testUser.email);
    await page.fill('input[placeholder="パスワード（6文字以上）"]', testUser.password);
    
    await page.click('button:has-text("参加する")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|招待コード/);
  });

  test('新規登録 - 重複メールアドレス', async ({ page }) => {
    const testUser = generateTestUser();
    
    // 最初のユーザーを登録
    await page.goto(buildFullUrl(page, '/(auth)/signup'));
    await page.fill('input[placeholder="お名前"]', testUser.name);
    await page.fill('input[placeholder="メールアドレス"]', testUser.email);
    await page.fill('input[placeholder="パスワード（6文字以上）"]', testUser.password);
    await page.click('button:has-text("登録する")');
    await page.waitForTimeout(3000);
    
    // 同じメールアドレスで再度登録を試みる
    await page.goto(buildFullUrl(page, '/(auth)/signup'));
    await page.fill('input[placeholder="お名前"]', '別の名前');
    await page.fill('input[placeholder="メールアドレス"]', testUser.email);
    await page.fill('input[placeholder="パスワード（6文字以上）"]', testUser.password);
    await page.click('button:has-text("登録する")');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/エラー|既に登録|ユーザー/);
  });
});
