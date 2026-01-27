# E2Eテスト実行ガイド

## 概要

FutariアプリのE2Eテストは、Web版（Playwright）とモバイル版（Detox）の両方に対応しています。

## 前提条件

### Web版テスト（Playwright）
- Node.js 20以上
- npm または yarn

### モバイル版テスト（Detox）
- Node.js 20以上
- iOS: Xcode と iOS Simulator
- Android: Android Studio と Android Emulator

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Playwrightブラウザのインストール（Web版）

```bash
npx playwright install
```

### 3. 環境変数の設定

`.env` ファイルまたは環境変数で以下を設定：

```bash
# テスト対象のURL（本番環境またはローカル）
BASE_URL=https://your-app.vercel.app
# または
BASE_URL=http://localhost:8081

# Supabase設定（テスト用のSupabaseプロジェクトを推奨）
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Web版テストの実行

### すべてのテストを実行

```bash
npm run test:e2e:web
```

### UIモードで実行（デバッグ用）

```bash
npm run test:e2e:web:ui
```

### ヘッドモードで実行（ブラウザを表示）

```bash
npm run test:e2e:web:headed
```

### 特定のテストファイルを実行

```bash
npx playwright test e2e/web/auth.spec.ts
```

### 特定のブラウザで実行

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## モバイル版テストの実行

### iOSシミュレーターで実行

```bash
npm run test:e2e:mobile:ios
```

### Androidエミュレーターで実行

```bash
npm run test:e2e:mobile:android
```

### すべてのモバイルテストを実行

```bash
npm run test:e2e:mobile
```

## テスト構成

### Web版テスト

- `e2e/web/auth.spec.ts` - 認証フロー（新規登録、ログイン、招待コード参加）
- `e2e/web/expenses.spec.ts` - 家計管理（支出追加、カテゴリフィルタ、月次サマリー）
- `e2e/web/chores.spec.ts` - 家事管理（家事追加、完了状態の切り替え）
- `e2e/web/shopping.spec.ts` - 買い物リスト（アイテム追加、購入済みマーク）
- `e2e/web/settings.spec.ts` - 設定（プロフィール編集）

### モバイル版テスト

- `e2e/mobile/auth.e2e.ts` - 認証フロー
- `e2e/mobile/expenses.e2e.ts` - 家計管理
- `e2e/mobile/chores.e2e.ts` - 家事管理
- `e2e/mobile/shopping.e2e.ts` - 買い物リスト

### ヘルパー関数

- `e2e/helpers/auth.ts` - 認証関連のヘルパー
- `e2e/helpers/data.ts` - テストデータの生成
- `e2e/helpers/wait.ts` - 待機処理のヘルパー

## CI/CD統合

GitHub Actionsで自動実行されます：

- **Web版**: すべてのプッシュとプルリクエストで実行
- **モバイル版**: 手動実行またはスケジュール実行

### GitHub Actionsの設定

`.github/workflows/e2e-tests.yml` を参照してください。

## 注意事項

### テスト環境

- **本番環境を使用する場合**: テストデータのクリーンアップが重要です
- **テスト用Supabaseプロジェクトの使用を推奨**: 本番データに影響を与えません

### メール確認

- Supabaseのメール確認が必要な場合、テスト用のメールサービス（Mailtrap等）の使用を検討
- または、テスト環境でメール確認を無効化

### フレーキーなテスト

- ネットワークの遅延やAPIの応答時間を考慮した適切なタイムアウト設定
- `waitFor` を使用した適切な待機処理

## トラブルシューティング

### Playwrightのテストが失敗する場合

1. ブラウザが正しくインストールされているか確認
   ```bash
   npx playwright install
   ```

2. テスト対象のURLが正しく設定されているか確認
   ```bash
   echo $BASE_URL
   ```

3. ログを確認
   ```bash
   npm run test:e2e:web -- --debug
   ```

### Detoxのテストが失敗する場合

1. シミュレーター/エミュレーターが起動しているか確認
   ```bash
   xcrun simctl list devices  # iOS
   adb devices  # Android
   ```

2. アプリが正しくビルドされているか確認
   ```bash
   detox build --configuration ios.sim.debug
   ```

3. ログを確認
   ```bash
   npm run test:e2e:mobile:ios -- --loglevel trace
   ```

## テストの追加

新しいテストを追加する場合：

1. 適切なテストファイルを作成（`e2e/web/` または `e2e/mobile/`）
2. テストケースを記述
3. 必要に応じてヘルパー関数を追加
4. テストを実行して動作確認

## 参考資料

- [Playwright Documentation](https://playwright.dev/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing/)
