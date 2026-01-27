# Supabase メールテンプレート日本語化ガイド

## 1. Supabaseダッシュボードでの設定

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. **Authentication** → **Email Templates** を開く
4. 以下のテンプレートを日本語化：

### Confirm signup（新規登録確認メール）

**Subject（件名）:**
```
Futari アカウントの確認
```

**Body（本文）:**
```html
{{if eq .Data.language "ja" }}
<h1>Futariへようこそ！</h1>
<p>以下のリンクをクリックしてアカウントを確認してください：</p>
<p><a href="{{ .ConfirmationURL }}">アカウントを確認する</a></p>
<p>このリンクは24時間有効です。</p>
<p>このメールに心当たりがない場合は、無視してください。</p>
{{ else }}
<h1>Welcome to Futari!</h1>
<p>Click the link below to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Account</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't request this email, you can safely ignore it.</p>
{{ end }}
```

### Magic Link（マジックリンク）

**Subject:**
```
Futari ログインリンク
```

**Body:**
```html
{{if eq .Data.language "ja" }}
<h1>ログインリンク</h1>
<p>以下のリンクをクリックしてログインしてください：</p>
<p><a href="{{ .Token }}">ログインする</a></p>
<p>このリンクは1時間有効です。</p>
{{ else }}
<h1>Login Link</h1>
<p>Click the link below to sign in:</p>
<p><a href="{{ .Token }}">Sign In</a></p>
<p>This link expires in 1 hour.</p>
{{ end }}
```

### Change Email Address（メールアドレス変更）

**Subject:**
```
Futari メールアドレス変更の確認
```

**Body:**
```html
{{if eq .Data.language "ja" }}
<h1>メールアドレス変更の確認</h1>
<p>以下のリンクをクリックしてメールアドレスを変更してください：</p>
<p><a href="{{ .ConfirmationURL }}">メールアドレスを変更する</a></p>
{{ else }}
<h1>Confirm Email Change</h1>
<p>Click the link below to change your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>
{{ end }}
```

### Reset Password（パスワードリセット）

**Subject:**
```
Futari パスワードリセット
```

**Body:**
```html
{{if eq .Data.language "ja" }}
<h1>パスワードリセット</h1>
<p>以下のリンクをクリックしてパスワードをリセットしてください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセットする</a></p>
<p>このリンクは1時間有効です。</p>
<p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
{{ else }}
<h1>Reset Password</h1>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
{{ end }}
```

## 2. テンプレート変数

Supabaseのメールテンプレートでは以下の変数が使用できます：

- `{{ .ConfirmationURL }}` - 確認リンクURL
- `{{ .Token }}` - トークン（マジックリンクなど）
- `{{ .Email }}` - ユーザーのメールアドレス
- `{{ .Data.language }}` - ユーザーメタデータの言語設定（コード側で `language: 'ja'` を設定）

## 3. 注意事項

- テンプレートを保存後、すぐに反映されます
- 既存のユーザーにも新しいテンプレートが適用されます
- 条件分岐（`{{if eq .Data.language "ja" }}`）により、日本語と英語の両方に対応可能

## 4. コード側の設定

コード側では既に `language: 'ja'` が設定されています：
- `app/(auth)/signup.tsx` - 新規登録時
- `app/(auth)/join.tsx` - 招待コードで参加時

これにより、Supabaseダッシュボードで設定した日本語テンプレートが使用されます。
