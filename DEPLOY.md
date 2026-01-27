# Futari PWA デプロイガイド

## 1. Web ビルド

```bash
npm run build:web
```

これで `dist/` ディレクトリに静的サイトが生成されます。

## 2. デプロイ先の選択

### Vercel（推奨・無料）

1. [Vercel](https://vercel.com) にアカウント作成（GitHub 連携可）
2. プロジェクトをインポート（GitHub連携推奨）
3. ビルド設定：
   - **Framework Preset**: Other
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. 環境変数を設定（後述）
5. デプロイ

**コマンドラインから**:
```bash
npm install -g vercel
vercel --prod
```
（プロジェクトルートから実行。`vercel.json`が自動的に認識されます）

### Netlify（無料）

1. [Netlify](https://netlify.com) にアカウント作成
2. ドラッグ&ドロップで `dist` フォルダをアップロード
3. または GitHub 連携で自動デプロイ（`netlify.toml`を作成推奨）

**コマンドラインから**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages（無料）

1. GitHub リポジトリに `dist` を push（通常はGitHub Actionsで自動化）
2. Settings → Pages で `dist` をソースに設定
3. 自動で `https://yourusername.github.io/Futari` に公開

## 3. 環境変数の設定

デプロイ先で以下の環境変数を設定してください（ビルド時に必要）:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Vercel/Netlify**: プロジェクト設定 → Environment Variables から追加

## 4. カスタムドメイン（任意）

Vercel/Netlify でカスタムドメインを設定できます（無料プランでも可）。

## 5. ホーム画面に追加

デプロイ後、スマホのブラウザでアクセスすると:

- **iOS Safari**: 共有ボタン → 「ホーム画面に追加」
- **Android Chrome**: メニュー → 「ホーム画面に追加」または自動でバナー表示

## 6. 更新方法

コードを更新したら:

```bash
npm run build:web
```

その後、デプロイ先に再デプロイ（Vercel/Netlify は GitHub 連携で自動更新も可能）。

---

## トラブルシューティング

### ビルドエラーが出る場合

- `expo export:web` が失敗する場合は、`npx expo install --fix` を実行
- 依存関係の問題: `rm -rf node_modules package-lock.json && npm install`

### PWA が動作しない場合

- HTTPS でアクセスしているか確認（HTTP では PWA 機能が制限される）
- ブラウザの開発者ツール → Application → Manifest で manifest.json が読み込まれているか確認

### Supabase 接続エラー

- 環境変数が正しく設定されているか確認
- Supabase の RLS ポリシーが正しく設定されているか確認

### 404エラーが発生する場合

- Vercelの場合：`vercel.json`がプロジェクトルートに配置されているか確認
- 出力ディレクトリが`dist`に設定されているか確認
- 環境変数（`EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`）が設定されているか確認
- ブラウザの開発者ツール（Networkタブ）で、どのリソースが404になっているか確認
