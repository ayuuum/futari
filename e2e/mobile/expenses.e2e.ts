import { device, expect, element, by, waitFor } from 'detox';

describe('家計管理フロー', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('支出の追加', async () => {
    // ログイン（既にログインしていると仮定）
    // 実際のテストでは、事前にログイン処理を実行

    // 家計タブに移動
    await element(by.text('家計')).tap();

    // 「支出を追加」ボタンまたはリンクをタップ
    await waitFor(element(by.text('支出を追加')).or(element(by.id('add-expense-button'))))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('支出を追加')).tap();

    // 金額を入力
    await waitFor(element(by.placeholderText('金額')).or(element(by.id('amount-input'))))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.placeholderText('金額')).typeText('1000');

    // 説明を入力
    await element(by.placeholderText('説明')).or(element(by.placeholderText('内容'))).typeText('テスト支出');

    // カテゴリを選択（カテゴリボタンをタップ）
    await element(by.text('食費')).tap();

    // 保存ボタンをタップ
    await element(by.text('保存')).or(element(by.text('追加'))).tap();

    // リスト画面に戻る
    await waitFor(element(by.text('テスト支出')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('カテゴリフィルタ', async () => {
    // 家計タブに移動
    await element(by.text('家計')).tap();

    // カテゴリボタンをタップ（例: 食費）
    await waitFor(element(by.text('食費')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('食費')).tap();

    // フィルタリングされた結果が表示されることを確認
    await waitFor(element(by.id('expense-list')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
