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

const baseURL = process.env.BASE_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  || 'http://localhost:8081';

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
  ],

  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
