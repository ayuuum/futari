#!/usr/bin/env node

/**
 * Supabase メールテンプレート自動設定スクリプト
 * 
 * 使用方法:
 * 1. Supabaseダッシュボードから Access Token を取得
 *    - Settings → Access Tokens → Generate new token
 * 2. 環境変数を設定:
 *    export SUPABASE_ACCESS_TOKEN=your_access_token
 *    export SUPABASE_PROJECT_ID=your_project_id
 * 3. スクリプトを実行:
 *    npm run setup:email-templates
 */

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_ID) {
  console.error('❌ エラー: 環境変数が設定されていません');
  console.error('以下の環境変数を設定してください:');
  console.error('  - SUPABASE_ACCESS_TOKEN');
  console.error('  - SUPABASE_PROJECT_ID');
  console.error('\n取得方法:');
  console.error('  1. Supabaseダッシュボード → Settings → Access Tokens');
  console.error('  2. "Generate new token" をクリック');
  console.error('  3. トークンをコピーして環境変数に設定');
  process.exit(1);
}

const SUPABASE_API_URL = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}`;

const templates = [
  {
    name: 'confirm_signup',
    subject: 'Futari アカウントの確認',
    body: `{{if eq .Data.language "ja" }}
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
{{ end }}`,
  },
  {
    name: 'magic_link',
    subject: 'Futari ログインリンク',
    body: `{{if eq .Data.language "ja" }}
<h1>ログインリンク</h1>
<p>以下のリンクをクリックしてログインしてください：</p>
<p><a href="{{ .Token }}">ログインする</a></p>
<p>このリンクは1時間有効です。</p>
{{ else }}
<h1>Login Link</h1>
<p>Click the link below to sign in:</p>
<p><a href="{{ .Token }}">Sign In</a></p>
<p>This link expires in 1 hour.</p>
{{ end }}`,
  },
  {
    name: 'change_email',
    subject: 'Futari メールアドレス変更の確認',
    body: `{{if eq .Data.language "ja" }}
<h1>メールアドレス変更の確認</h1>
<p>以下のリンクをクリックしてメールアドレスを変更してください：</p>
<p><a href="{{ .ConfirmationURL }}">メールアドレスを変更する</a></p>
{{ else }}
<h1>Confirm Email Change</h1>
<p>Click the link below to change your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>
{{ end }}`,
  },
  {
    name: 'reset_password',
    subject: 'Futari パスワードリセット',
    body: `{{if eq .Data.language "ja" }}
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
{{ end }}`,
  },
];

async function updateEmailTemplate(template) {
  try {
    const response = await fetch(
      `${SUPABASE_API_URL}/auth/templates/${template.name}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: template.subject,
          content: template.body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ ${template.name} の更新に失敗:`, error);
      return false;
    }

    console.log(`✅ ${template.name} を更新しました`);
    return true;
  } catch (error) {
    console.error(`❌ ${template.name} の更新中にエラー:`, error.message);
    return false;
  }
}

async function main() {
  console.log('📧 Supabase メールテンプレートを設定中...\n');

  let successCount = 0;
  let failCount = 0;

  for (const template of templates) {
    const success = await updateEmailTemplate(template);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // APIレート制限を避けるため、少し待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 結果:');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失敗: ${failCount}`);

  if (failCount > 0) {
    console.error('\n⚠️  一部のテンプレートの更新に失敗しました。');
    console.error('Supabase Management APIのアクセス権限を確認してください。');
    console.error('\n代替方法: SUPABASE_EMAIL_SETUP.md を参照して手動で設定してください。');
    process.exit(1);
  } else {
    console.log('\n🎉 すべてのメールテンプレートが正常に設定されました！');
  }
}

main().catch(console.error);
