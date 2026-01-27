import { Page } from '@playwright/test';
import { buildFullUrl } from './wait';

/**
 * 認証関連のヘルパー関数
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

/**
 * テスト用ユーザーを生成
 */
export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `test-user-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `テストユーザー${timestamp}`,
  };
}

/**
 * ログイン処理
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // #region agent log
  const targetPath = '/(auth)/login';
  const fullUrl = buildFullUrl(page, targetPath);
  fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'helpers/auth.ts:30',message:'Before login page.goto',data:{targetPath,fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // ログインページに移動
  await page.goto(fullUrl);
  
  // メールアドレスを入力
  await page.fill('input[placeholder="メールアドレス"]', email);
  
  // パスワードを入力
  await page.fill('input[placeholder="パスワード"]', password);
  
  // ログインボタンをクリック
  await page.click('button:has-text("ログイン")');
  
  // ホーム画面に遷移するまで待機
  await page.waitForURL('**/(tabs)**', { timeout: 10000 });
}

/**
 * 新規登録処理
 */
export async function signup(page: Page, user: TestUser): Promise<string> {
  // #region agent log
  const targetPath = '/(auth)/signup';
  const fullUrl = buildFullUrl(page, targetPath);
  fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'helpers/auth.ts:50',message:'Before signup page.goto',data:{targetPath,fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // 新規登録ページに移動
  await page.goto(fullUrl);
  
  // 名前を入力
  await page.fill('input[placeholder="お名前"]', user.name);
  
  // メールアドレスを入力
  await page.fill('input[placeholder="メールアドレス"]', user.email);
  
  // パスワードを入力
  await page.fill('input[placeholder="パスワード（6文字以上）"]', user.password);
  
  // 登録ボタンをクリック
  await page.click('button:has-text("登録する")');
  
  // 登録完了のアラートを待機
  await page.waitForSelector('text=登録完了', { timeout: 10000 });
  
  // 招待コードを取得（アラートから）
  const alertText = await page.textContent('text=登録完了');
  const inviteCodeMatch = alertText?.match(/([A-Z0-9]{6})/);
  const inviteCode = inviteCodeMatch ? inviteCodeMatch[1] : '';
  
  // OKボタンをクリック
  await page.click('button:has-text("OK")');
  
  return inviteCode;
}

/**
 * 招待コードで参加
 */
export async function joinWithInviteCode(
  page: Page,
  inviteCode: string,
  user: TestUser
): Promise<void> {
  // #region agent log
  const targetPath = '/(auth)/join';
  const fullUrl = buildFullUrl(page, targetPath);
  fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'helpers/auth.ts:87',message:'Before join page.goto',data:{targetPath,fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // 参加ページに移動
  await page.goto(fullUrl);
  
  // 招待コードを入力
  await page.fill('input[placeholder="招待コード（6文字）"]', inviteCode);
  
  // 名前を入力
  await page.fill('input[placeholder="お名前"]', user.name);
  
  // メールアドレスを入力
  await page.fill('input[placeholder="メールアドレス"]', user.email);
  
  // パスワードを入力
  await page.fill('input[placeholder="パスワード（6文字以上）"]', user.password);
  
  // 参加ボタンをクリック
  await page.click('button:has-text("参加する")');
  
  // 参加完了のアラートを待機
  await page.waitForSelector('text=参加完了', { timeout: 10000 });
  
  // OKボタンをクリック
  await page.click('button:has-text("はじめる")');
  
  // ホーム画面に遷移するまで待機
  await page.waitForURL('**/(tabs)**', { timeout: 10000 });
}

/**
 * ログアウト処理
 */
export async function logout(page: Page): Promise<void> {
  // #region agent log
  const targetPath = '/(tabs)/settings';
  const fullUrl = buildFullUrl(page, targetPath);
  fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'helpers/auth.ts:135',message:'Before logout page.goto',data:{targetPath,fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // 設定タブに移動
  await page.goto(fullUrl);
  
  // ログアウトボタンをクリック
  await page.click('text=ログアウト');
  
  // ログインページに遷移するまで待機
  await page.waitForURL('**/(auth)/login**', { timeout: 10000 });
}

/**
 * テスト用ユーザーをSupabaseから削除（クリーンアップ）
 */
export async function cleanupTestUser(email: string): Promise<void> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase環境変数が設定されていません。クリーンアップをスキップします。');
    return;
  }
  
  try {
    // 注意: 実際の実装では、Management APIを使用してユーザーを削除する必要があります
    // ここでは簡易的な実装として、Supabaseクライアントを使用
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // ユーザーを削除（実際にはAdmin APIが必要）
    // テスト環境では、テスト用のSupabaseプロジェクトを使用することを推奨
    console.log(`テストユーザー ${email} のクリーンアップが必要です（手動で削除してください）`);
  } catch (error) {
    console.error('クリーンアップエラー:', error);
  }
}
