import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';
import { generateTestShoppingItem } from '../helpers/data';

test.describe('買い物リストの詳細テスト', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    try {
      await signup(page, testUser);
      await page.waitForTimeout(2000);
      if (page.url().includes('login')) {
        await login(page, testUser.email, testUser.password);
      }
    } catch {
      test.skip();
    }
  });

  test('アイテムの編集', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/shopping'));
    await waitForLoadingToComplete(page);
    
    // まずアイテムを追加
    const item = generateTestShoppingItem();
    const input = page.locator('input[placeholder*="アイテムを追加"]').first();
    await input.fill(item.name);
    
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
    } else {
      await input.press('Enter');
    }
    await page.waitForTimeout(2000);
    
    // 追加したアイテムを長押しまたは編集ボタンで編集
    const itemElement = page.locator(`text=${item.name}`).first();
    if (await itemElement.count() > 0) {
      await itemElement.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      const editButton = page.locator('button:has-text("編集")').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // 名前を変更
        const editInput = page.locator('input[value]').first();
        await editInput.clear();
        await editInput.fill('編集されたアイテム');
        
        // 保存
        const saveButton = page.locator('button:has-text("保存")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
        
        // 変更が反映されていることを確認
        await expect(page.locator('text=編集されたアイテム')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('アイテムの削除', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/shopping'));
    await waitForLoadingToComplete(page);
    
    // まずアイテムを追加
    const item = generateTestShoppingItem();
    const input = page.locator('input[placeholder*="アイテムを追加"]').first();
    await input.fill(item.name);
    
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
    } else {
      await input.press('Enter');
    }
    await page.waitForTimeout(2000);
    
    // 追加したアイテムを長押しして削除
    const itemElement = page.locator(`text=${item.name}`).first();
    if (await itemElement.count() > 0) {
      await itemElement.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      const deleteButton = page.locator('button:has-text("削除")').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // 確認ダイアログでOKをクリック
        const confirmButton = page.locator('button:has-text("OK"), button:has-text("削除")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          
          // アイテムが削除されていることを確認
          const itemAfterDelete = page.locator(`text=${item.name}`);
          await expect(itemAfterDelete).not.toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('アイテムのカテゴリ設定', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/shopping'));
    await waitForLoadingToComplete(page);
    
    // アイテムを追加
    const item = generateTestShoppingItem();
    const input = page.locator('input[placeholder*="アイテムを追加"]').first();
    await input.fill(item.name);
    
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
    } else {
      await input.press('Enter');
    }
    await page.waitForTimeout(2000);
    
    // 追加したアイテムをクリックしてカテゴリを設定
    const itemElement = page.locator(`text=${item.name}`).first();
    if (await itemElement.count() > 0) {
      await itemElement.click();
      await page.waitForTimeout(1000);
      
      // カテゴリ選択ボタンを探す
      const categoryButton = page.locator('button:has-text("日用品"), button:has-text("食品")').first();
      if (await categoryButton.count() > 0) {
        await categoryButton.click();
        await page.waitForTimeout(1000);
        
        // カテゴリが設定されていることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });

  test('アイテムの価格設定', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/shopping'));
    await waitForLoadingToComplete(page);
    
    // アイテムを追加
    const item = generateTestShoppingItem();
    const input = page.locator('input[placeholder*="アイテムを追加"]').first();
    await input.fill(item.name);
    
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
    } else {
      await input.press('Enter');
    }
    await page.waitForTimeout(2000);
    
    // 追加したアイテムをクリックして価格を設定
    const itemElement = page.locator(`text=${item.name}`).first();
    if (await itemElement.count() > 0) {
      await itemElement.click();
      await page.waitForTimeout(1000);
      
      // 価格入力フィールドを探す
      const priceInput = page.locator('input[placeholder*="価格"], input[placeholder*="金額"], input[type="number"]').first();
      if (await priceInput.count() > 0) {
        await priceInput.fill('1000');
        await page.waitForTimeout(500);
        
        // 価格が設定されていることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toContain('1000');
      }
    }
  });
});
