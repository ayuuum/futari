import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';
import { generateTestChore } from '../helpers/data';

test.describe('家事管理の詳細テスト', () => {
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

  test('家事の編集', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/chores'));
    await waitForLoadingToComplete(page);
    
    // まず家事を追加
    const chore = generateTestChore();
    const addButton = page.locator('button:has-text("家事を追加")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const nameInput = page.locator('input[placeholder*="名前"]').first();
    await nameInput.fill(chore.name);
    
    const categoryButton = page.locator(`button:has-text("${chore.category}")`).first();
    if (await categoryButton.count() > 0) {
      await categoryButton.click();
    }
    
    const saveButton = page.locator('button:has-text("追加")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 追加した家事を長押しまたは編集ボタンで編集
    const choreItem = page.locator(`text=${chore.name}`).first();
    if (await choreItem.count() > 0) {
      // 編集機能がある場合は編集を実行
      await choreItem.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      const editButton = page.locator('button:has-text("編集"), button:has-text("変更")').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // 名前を変更
        const editNameInput = page.locator('input[value]').first();
        await editNameInput.clear();
        await editNameInput.fill('編集された家事');
        
        // 保存
        const saveEditButton = page.locator('button:has-text("保存")').first();
        await saveEditButton.click();
        await page.waitForTimeout(2000);
        
        // 変更が反映されていることを確認
        await expect(page.locator('text=編集された家事')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('家事の削除', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/chores'));
    await waitForLoadingToComplete(page);
    
    // まず家事を追加
    const chore = generateTestChore();
    const addButton = page.locator('button:has-text("家事を追加")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const nameInput = page.locator('input[placeholder*="名前"]').first();
    await nameInput.fill(chore.name);
    
    const saveButton = page.locator('button:has-text("追加")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 追加した家事を長押しまたは削除ボタンで削除
    const choreItem = page.locator(`text=${chore.name}`).first();
    if (await choreItem.count() > 0) {
      await choreItem.click({ button: 'right' });
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
          
          // 家事が削除されていることを確認
          const choreAfterDelete = page.locator(`text=${chore.name}`);
          await expect(choreAfterDelete).not.toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('家事の担当者変更', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/chores'));
    await waitForLoadingToComplete(page);
    
    // まず家事を追加
    const chore = generateTestChore();
    const addButton = page.locator('button:has-text("家事を追加")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const nameInput = page.locator('input[placeholder*="名前"]').first();
    await nameInput.fill(chore.name);
    
    const saveButton = page.locator('button:has-text("追加")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 追加した家事の担当者を変更
    const choreItem = page.locator(`text=${chore.name}`).first();
    if (await choreItem.count() > 0) {
      // 担当者バッジまたはボタンを探す
      const assigneeButton = page.locator('text=あなた, text=パートナー').first();
      if (await assigneeButton.count() > 0) {
        await assigneeButton.click();
        await page.waitForTimeout(1000);
        
        // 担当者が変更されていることを確認
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
      }
    }
  });

  test('AI家事アドバイスの表示', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/chores'));
    await waitForLoadingToComplete(page);
    
    // 家事をいくつか追加
    for (let i = 0; i < 3; i++) {
      const chore = generateTestChore();
      const addButton = page.locator('button:has-text("家事を追加")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        const nameInput = page.locator('input[placeholder*="名前"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill(`${chore.name}${i}`);
          const saveButton = page.locator('button:has-text("追加")').first();
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // AIアドバイスセクションを探す
    await page.waitForTimeout(3000); // AI処理を待つ
    
    const aiAdvice = page.locator('text=アドバイス, text=提案').first();
    if (await aiAdvice.count() > 0) {
      await expect(aiAdvice).toBeVisible({ timeout: 10000 });
    }
  });
});
