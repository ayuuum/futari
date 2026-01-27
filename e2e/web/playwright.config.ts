import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * E2Eテスト設定
 * 
 * 環境変数:
 * - BASE_URL: テスト対象のURL（デフォルト: http://localhost:8081）
 * - EXPO_PUBLIC_SUPABASE_URL: SupabaseプロジェクトのURL
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY: Supabaseの匿名キー
 */

// .envファイルを読み込む（プロジェクトルートから）
config({ path: resolve(__dirname, '../../.env') });

// #region agent log
// Node.js環境ではfetchが使えない可能性があるため、ファイルに直接書き込む
const fs = require('fs');
const logPath = resolve(__dirname, '../../.cursor/debug.log');
try {
  const logEntry = JSON.stringify({location:'playwright.config.ts:15',message:'Environment variables loaded',data:{hasBaseUrl:!!process.env.BASE_URL,baseUrlValue:process.env.BASE_URL,hasVercelUrl:!!process.env.VERCEL_URL,vercelUrlValue:process.env.VERCEL_URL,hasSupabaseUrl:!!process.env.EXPO_PUBLIC_SUPABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'}) + '\n';
  fs.appendFileSync(logPath, logEntry);
} catch (e) {
  console.error('Failed to write log:', e);
}
// #endregion

const baseURL = process.env.BASE_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  || 'http://localhost:8081';

// #region agent log
try {
  const logEntry = JSON.stringify({location:'playwright.config.ts:30',message:'baseURL calculated',data:{baseURL,baseUrlType:typeof baseURL,baseUrlLength:baseURL?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'}) + '\n';
  fs.appendFileSync(logPath, logEntry);
  console.log('[Playwright Config] baseURL:', baseURL);
} catch (e) {
  console.error('Failed to write log:', e);
}
// #endregion

export default defineConfig({
  testDir: './e2e/web',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 詳細テストは時間がかかるため、CI環境ではchromiumのみ実行
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
    ]),
  ],

  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
