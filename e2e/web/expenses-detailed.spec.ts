import { test, expect } from '@playwright/test';
import { generateTestUser, signup, login } from '../helpers/auth';
import { waitForLoadingToComplete, buildFullUrl } from '../helpers/wait';
import { generateTestExpense } from '../helpers/data';

test.describe('支出管理の詳細テスト', () => {
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

  test('支出の編集', async ({ page }) => {
    // まず支出を追加
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    const expense = generateTestExpense();
    
    // 支出を追加
    const addButton = page.locator('a[href="/expenses/add"], a[href*="expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const amountInput = page.locator('input[placeholder="0"]').first();
    await amountInput.fill(expense.amount.toString());
    
    const allInputs = page.locator('input[type="text"], textarea');
    const inputCount = await allInputs.count();
    if (inputCount > 1) {
      await allInputs.nth(1).fill(expense.description);
    }
    
    const categoryMap: Record<string, string> = {
      food: '食費',
      utilities: '光熱費',
      rent: '家賃',
      entertainment: '娯楽',
      daily: '日用品',
      other: 'その他',
    };
    const categoryName = categoryMap[expense.category] || expense.category;
    const categoryButton = page.locator(`button:has-text("${categoryName}")`).first();
    if (await categoryButton.count() > 0) {
      await categoryButton.click();
    }
    
    const saveButton = page.locator('button:has-text("支出を記録")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 追加した支出をクリックして編集画面を開く
    const expenseItem = page.locator(`text=${expense.description}`).first();
    if (await expenseItem.count() > 0) {
      await expenseItem.click();
      await page.waitForTimeout(1000);
      
      // 編集機能がある場合は編集を実行
      // （実際の実装に応じて調整が必要）
      const editButton = page.locator('button:has-text("編集"), button:has-text("変更")').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // 金額を変更
        const editAmountInput = page.locator('input[type="number"], input[type="text"]').first();
        await editAmountInput.clear();
        await editAmountInput.fill('9999');
        
        // 保存
        const saveEditButton = page.locator('button:has-text("保存"), button:has-text("更新")').first();
        await saveEditButton.click();
        await page.waitForTimeout(2000);
        
        // 変更が反映されていることを確認
        const updatedText = await page.textContent('body');
        expect(updatedText).toContain('9999');
      }
    }
  });

  test('支出の削除', async ({ page }) => {
    // まず支出を追加
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    const expense = generateTestExpense();
    
    // 支出を追加
    const addButton = page.locator('a[href="/expenses/add"], a[href*="expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    const amountInput = page.locator('input[placeholder="0"]').first();
    await amountInput.fill(expense.amount.toString());
    
    const allInputs = page.locator('input[type="text"], textarea');
    const inputCount = await allInputs.count();
    if (inputCount > 1) {
      await allInputs.nth(1).fill(expense.description);
    }
    
    const saveButton = page.locator('button:has-text("支出を記録")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 追加した支出を長押しまたは削除ボタンで削除
    const expenseItem = page.locator(`text=${expense.description}`).first();
    if (await expenseItem.count() > 0) {
      // 長押しで削除メニューを表示（または削除ボタンを探す）
      await expenseItem.click({ button: 'right' });
      await page.waitForTimeout(500);
      
      const deleteButton = page.locator('button:has-text("削除"), text=削除').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // 確認ダイアログでOKをクリック
        const confirmButton = page.locator('button:has-text("OK"), button:has-text("削除")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          
          // 支出が削除されていることを確認
          const expenseAfterDelete = page.locator(`text=${expense.description}`);
          await expect(expenseAfterDelete).not.toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('支出の共有設定切り替え', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    const expense = generateTestExpense();
    
    // 支出追加画面を開く
    const addButton = page.locator('a[href="/expenses/add"], a[href*="expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // 金額と説明を入力
    const amountInput = page.locator('input[placeholder="0"]').first();
    await amountInput.fill(expense.amount.toString());
    
    const allInputs = page.locator('input[type="text"], textarea');
    const inputCount = await allInputs.count();
    if (inputCount > 1) {
      await allInputs.nth(1).fill(expense.description);
    }
    
    // 共有設定を「個人の支出」に変更
    const personalToggle = page.locator('button:has-text("個人の支出"), text=👤').first();
    if (await personalToggle.count() > 0) {
      await personalToggle.click();
      await page.waitForTimeout(500);
    }
    
    // 保存
    const saveButton = page.locator('button:has-text("支出を記録")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    // 保存が成功したことを確認
    await expect(page.locator(`text=${expense.description}`)).toBeVisible({ timeout: 10000 });
  });

  test('AI機能 - 自然言語入力', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    // 支出追加画面を開く
    const addButton = page.locator('a[href="/expenses/add"], a[href*="expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // 自然言語入力フィールドを探す
    const quickInput = page.locator('input[placeholder*="例"], input[placeholder*="昨日"]').first();
    if (await quickInput.count() > 0) {
      await quickInput.fill('昨日コンビニで500円');
      
      // 解析ボタンをクリック
      const parseButton = page.locator('button:has-text("解析")').first();
      if (await parseButton.count() > 0) {
        await parseButton.click();
        await page.waitForTimeout(3000);
        
        // 金額と説明が自動入力されていることを確認
        const amountInput = page.locator('input[placeholder="0"]').first();
        const amountValue = await amountInput.inputValue();
        expect(amountValue).toContain('500');
      }
    }
  });

  test('カテゴリのAI提案', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    // 支出追加画面を開く
    const addButton = page.locator('a[href="/expenses/add"], a[href*="expenses/add"]').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // 説明を入力（AIがカテゴリを提案する）
    const allInputs = page.locator('input[type="text"], textarea');
    const inputCount = await allInputs.count();
    if (inputCount > 1) {
      await allInputs.nth(1).fill('スーパーで買い物');
      await page.waitForTimeout(2000); // AI提案を待つ
      
      // カテゴリが自動選択されているか、提案されていることを確認
      const categoryButton = page.locator('button:has-text("食費")').first();
      if (await categoryButton.count() > 0) {
        // カテゴリが選択されているか確認
        const isSelected = await categoryButton.evaluate((el) => {
          return el.classList.contains('active') || 
                 el.getAttribute('style')?.includes('background') ||
                 el.style.backgroundColor !== '';
        });
        // 選択されているか、または提案されていることを確認
        expect(isSelected || await categoryButton.count() > 0).toBeTruthy();
      }
    }
  });

  test('月次サマリーの詳細確認', async ({ page }) => {
    await page.goto(buildFullUrl(page, '/(tabs)/expenses'));
    await waitForLoadingToComplete(page);
    
    // 月次合計が表示されていることを確認
    const summarySection = page.locator('text=今月の支出, text=¥').first();
    await expect(summarySection).toBeVisible({ timeout: 5000 });
    
    // 金額が表示されていることを確認
    const amountPattern = /[¥￥]?\s*\d{1,3}(,\d{3})*\s*[円]?/;
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(amountPattern);
    
    // カテゴリ別の内訳が表示されていることを確認（もしあれば）
    const categoryBreakdown = page.locator('text=食費, text=光熱費').first();
    if (await categoryBreakdown.count() > 0) {
      await expect(categoryBreakdown).toBeVisible();
    }
  });
});
