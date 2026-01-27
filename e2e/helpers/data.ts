/**
 * テストデータ管理のヘルパー関数
 */

/**
 * テスト用の支出データを生成
 */
export interface TestExpense {
  amount: number;
  description: string;
  category: string;
  date: string;
  is_shared: boolean;
}

export function generateTestExpense(): TestExpense {
  const categories = ['food', 'utilities', 'rent', 'entertainment', 'daily', 'other'];
  const descriptions = [
    'スーパーで買い物',
    'コンビニ',
    'ランチ',
    '電気代',
    'ガス代',
    '家賃',
    '映画鑑賞',
    '日用品',
  ];
  
  return {
    amount: Math.floor(Math.random() * 10000) + 100,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    date: new Date().toISOString().slice(0, 10),
    is_shared: Math.random() > 0.5,
  };
}

/**
 * テスト用の家事データを生成
 */
export interface TestChore {
  name: string;
  category: string;
  frequency: string;
  assigned_to: 'me' | 'partner' | 'none';
}

export function generateTestChore(): TestChore {
  const categories = ['掃除', '料理', '洗濯', 'ゴミ出し', '買い物', 'その他'];
  const frequencies = ['毎日', '週1回', '週2回', '月1回', 'その他'];
  const assignedTo: ('me' | 'partner' | 'none')[] = ['me', 'partner', 'none'];
  
  return {
    name: `テスト家事${Date.now()}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
    assigned_to: assignedTo[Math.floor(Math.random() * assignedTo.length)],
  };
}

/**
 * テスト用の買い物アイテムを生成
 */
export interface TestShoppingItem {
  name: string;
  category?: string;
  estimated_price?: number;
}

export function generateTestShoppingItem(): TestShoppingItem {
  const items = [
    '牛乳',
    '卵',
    'パン',
    'トイレットペーパー',
    '洗剤',
    '米',
    '野菜',
    '肉',
  ];
  
  return {
    name: items[Math.floor(Math.random() * items.length)],
    category: 'その他',
    estimated_price: Math.floor(Math.random() * 5000) + 100,
  };
}

/**
 * テストデータのクリーンアップ（Supabaseから削除）
 * 注意: 実際の実装では、テスト用のSupabaseプロジェクトを使用することを推奨
 */
export async function cleanupTestData(
  coupleId: string,
  userId: string
): Promise<void> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase環境変数が設定されていません。クリーンアップをスキップします。');
    return;
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // テストデータを削除
    // 注意: 本番環境では実行しないでください
    if (process.env.NODE_ENV === 'production') {
      console.warn('本番環境ではクリーンアップをスキップします。');
      return;
    }
    
    // テスト用のデータを削除（実際の実装では、テスト用のSupabaseプロジェクトを使用）
    console.log(`テストデータのクリーンアップが必要です（coupleId: ${coupleId}, userId: ${userId}）`);
  } catch (error) {
    console.error('クリーンアップエラー:', error);
  }
}
