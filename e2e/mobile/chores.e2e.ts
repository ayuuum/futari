import { device, expect, element, by, waitFor } from 'detox';

describe('家事管理フロー', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('家事の追加', async () => {
    // 家事タブに移動
    await element(by.text('家事')).tap();

    // 「家事を追加」ボタンをタップ
    await waitFor(element(by.text('家事を追加')).or(element(by.id('add-chore-button'))))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('家事を追加')).tap();

    // モーダルが表示されるまで待機
    await waitFor(element(by.placeholderText('家事')).or(element(by.placeholderText('名前'))))
      .toBeVisible()
      .withTimeout(5000);

    // 家事名を入力
    const choreName = `テスト家事${Date.now()}`;
    await element(by.placeholderText('家事')).typeText(choreName);

    // カテゴリを選択
    await element(by.text('掃除')).tap();

    // 頻度を選択
    await element(by.text('週1回')).tap();

    // 保存ボタンをタップ
    await element(by.text('追加')).or(element(by.text('保存'))).tap();

    // 追加した家事が表示されるまで待機
    await waitFor(element(by.text(choreName)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('家事の完了状態の切り替え', async () => {
    // 家事タブに移動
    await element(by.text('家事')).tap();

    // 既存の家事アイテムをタップ
    await waitFor(element(by.id('chore-item')).atIndex(0))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('chore-item')).atIndex(0).tap();

    // 状態が変更されるまで待機
    await waitFor(element(by.text('完了')).or(element(by.text('未完了'))))
      .toBeVisible()
      .withTimeout(5000);
  });
});
