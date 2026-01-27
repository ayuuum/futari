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

プロジェクトルートに `.env` ファイルを作成し、以下を設定：

```bash
# テスト対象のURL（本番環境またはローカル）
BASE_URL=https://your-app.vercel.app
# または
BASE_URL=http://localhost:8081

# Supabase設定（テスト用のSupabaseプロジェクトを推奨）
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxx
```

**注意**: 
- `.env` ファイルは自動的に読み込まれます（`playwright.config.ts`で`dotenv`を使用）
- 環境変数は `EXPO_PUBLIC_` プレフィックスが必要です
- テスト用のSupabaseプロジェクトを使用することを推奨します（本番データに影響を与えません）

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

#### 基本テスト
- `e2e/web/auth.spec.ts` - 認証フロー（新規登録、ログイン、招待コード参加、ログアウト）
- `e2e/web/expenses.spec.ts` - 家計管理（支出追加、カテゴリフィルタ、月次サマリー）
- `e2e/web/chores.spec.ts` - 家事管理（家事追加、完了状態の切り替え）
- `e2e/web/shopping.spec.ts` - 買い物リスト（アイテム追加、購入済みマーク）
- `e2e/web/settings.spec.ts` - 設定（プロフィール編集）

#### 詳細テスト
- `e2e/web/auth-detailed.spec.ts` - 認証の詳細テスト（バリデーション、エラーハンドリング、パスワード要件、重複メール）
- `e2e/web/expenses-detailed.spec.ts` - 支出管理の詳細テスト（編集、削除、AI機能、共有設定切り替え）
- `e2e/web/chores-detailed.spec.ts` - 家事管理の詳細テスト（編集、削除、担当者変更、AIアドバイス）
- `e2e/web/shopping-detailed.spec.ts` - 買い物リストの詳細テスト（編集、削除、カテゴリ設定、価格設定）
- `e2e/web/home.spec.ts` - ホーム画面のテスト（ダッシュボード、統計情報、タブナビゲーション）
- `e2e/web/calendar.spec.ts` - カレンダーのテスト（イベント追加、月の切り替え）
- `e2e/web/report.spec.ts` - レポートのテスト（月次レポート、AIサマリー、アドバイス、トレンド表示）
- `e2e/web/recurring-expenses.spec.ts` - 固定費管理のテスト（追加、有効/無効切り替え）
- `e2e/web/rulebook.spec.ts` - ルールブックのテスト（追加、確認、AI言い換え）
- `e2e/web/savings.spec.ts` - 貯金目標のテスト（追加、進捗更新）
- `e2e/web/settings-detailed.spec.ts` - 設定画面の詳細テスト（テーマ変更、カップル設定、負担割合、記念日、プライバシー）
- `e2e/web/error-handling.spec.ts` - エラーハンドリングのテスト（ネットワークエラー、バリデーションエラー）

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

### 環境変数が読み込まれない場合

1. `.env` ファイルがプロジェクトルートに存在するか確認
   ```bash
   ls -la .env
   ```

2. `.env` ファイルの内容を確認（値が正しく設定されているか）
   ```bash
   cat .env
   ```

3. 環境変数の形式を確認
   - `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY` が正しく設定されているか
   - 値に余分なスペースや引用符がないか

4. テスト実行時に環境変数が読み込まれているか確認
   ```bash
   # 環境変数を表示してからテストを実行
   node -e "require('dotenv').config(); console.log(process.env.EXPO_PUBLIC_SUPABASE_URL)"
   ```

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
