import { device, expect, element, by, waitFor } from 'detox';

describe('買い物リストフロー', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('アイテムの追加', async () => {
    // 買い物タブに移動
    await element(by.text('買い物')).tap();

    // アイテム名を入力
    const itemName = `テストアイテム${Date.now()}`;
    await waitFor(element(by.placeholderText('買い物')).or(element(by.id('shopping-input'))))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.placeholderText('買い物')).typeText(itemName);

    // 追加ボタンをタップ
    await element(by.text('追加')).tap();

    // 追加したアイテムが表示されるまで待機
    await waitFor(element(by.text(itemName)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('購入済みマーク', async () => {
    // 買い物タブに移動
    await element(by.text('買い物')).tap();

    // 既存のアイテムをタップ
    await waitFor(element(by.id('shopping-item')).atIndex(0))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('shopping-item')).atIndex(0).tap();

    // 状態が変更されるまで待機
    await waitFor(element(by.text('購入済み')).or(element(by.text('未購入'))))
      .toBeVisible()
      .withTimeout(5000);
  });
});
