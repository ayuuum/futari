# Supabase Edge Functions (AI)

AI機能は Supabase Edge Functions でプロキシしています。APIキーをクライアントに載せずに OpenAI を呼び出せます。

## デプロイ

1. [Supabase CLI](https://supabase.com/docs/guides/cli) をインストールし、プロジェクトをリンクします。
2. シークレットに `OPENAI_API_KEY` を設定します。

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

3. 関数をデプロイします。**Cursor のターミナルから**次のどちらかで実行できます。

```bash
# リポジトリルートで npm 経由（推奨）
npm run supabase:deploy-functions

# または CLI を直接
supabase functions deploy
```

個別デプロイする場合:

```bash
supabase functions deploy category-suggest
supabase functions deploy receipt-ocr
# ... 他の関数も同様
```

## 関数一覧

| 関数名 | 用途 |
|--------|------|
| category-suggest | 支出の内容からカテゴリを1つ提案 |
| receipt-ocr | レシート画像 (base64) から金額・説明・カテゴリを抽出 |
| parse-expense | 自然言語の一文から日付・金額・内容・カテゴリを抽出 |
| report-summary | 月次レポートの短文サマリー生成 |
| spending-advice | 支出傾向への一言アドバイス |
| rule-rephrase | ルール文を丁寧な表現に言い換え |
| chore-advice | 家事分担のバランスに基づく一言アドバイス |

## ローカル開発

```bash
supabase functions serve
```

各関数は `http://localhost:54321/functions/v1/<function-name>` で呼び出せます。Expo アプリからは Supabase プロジェクトの Functions URL を参照するため、デプロイ済みの関数か、ngrok 等でポートを公開する必要があります。
