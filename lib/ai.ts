import { supabase } from '@/lib/supabase';

export type CategoryId =
    | 'food'
    | 'utilities'
    | 'rent'
    | 'entertainment'
    | 'daily'
    | 'transport'
    | 'medical'
    | 'other';

export async function suggestCategory(description: string): Promise<CategoryId> {
    const { data, error } = await supabase.functions.invoke<{ categoryId?: CategoryId; error?: string }>(
        'category-suggest',
        { body: { description: description.trim() } }
    );
    if (error) throw error;
    if (data?.error && !data?.categoryId) throw new Error(data.error);
    const id = data?.categoryId ?? 'other';
    return id as CategoryId;
}

export type ReceiptOcrResult = { amount: number; description: string; categoryId: CategoryId; date: string };

export async function scanReceipt(imageBase64: string): Promise<ReceiptOcrResult> {
    const { data, error } = await supabase.functions.invoke<ReceiptOcrResult & { error?: string }>(
        'receipt-ocr',
        { body: { imageBase64 } }
    );
    if (error) throw error;
    if (data?.error && !data?.amount) throw new Error(data.error);
    const today = new Date().toISOString().slice(0, 10);
    return {
        amount: data?.amount ?? 0,
        description: data?.description ?? 'レシート',
        categoryId: (data?.categoryId ?? 'other') as CategoryId,
        date: data?.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : today,
    };
}

export type ParseExpenseResult = {
    amount: number;
    description: string;
    categoryId: CategoryId;
    date: string;
};

export async function parseExpenseFromText(text: string): Promise<ParseExpenseResult> {
    const { data, error } = await supabase.functions.invoke<ParseExpenseResult & { error?: string }>(
        'parse-expense',
        { body: { text: text.trim() } }
    );
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.amount || !data?.date) throw new Error('解析できませんでした');
    return data as ParseExpenseResult;
}

export async function getReportSummary(payload: {
    month: string;
    totalExpenses: number;
    comparison: number;
    byCategory: { name: string; amount: number; percentage: number }[];
    byPerson: { you: { amount: number; percentage: number }; partner: { amount: number; percentage: number } };
}): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ summary?: string; error?: string }>(
        'report-summary',
        { body: payload }
    );
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.summary ?? '';
}

export async function getSpendingAdvice(payload: {
    monthlyTrend: { month: string; amount: number }[];
    byCategory: { name: string; amount: number }[];
}): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ advice?: string; error?: string }>(
        'spending-advice',
        { body: payload }
    );
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.advice ?? '';
}

export async function rephraseRule(text: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ rephrased?: string; error?: string }>(
        'rule-rephrase',
        { body: { text: text.trim() } }
    );
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.rephrased ?? text;
}

export async function getChoreAdvice(payload: {
    myCompleted: number;
    partnerCompleted: number;
    myChoreCount: number;
    partnerChoreCount: number;
    partnerName: string;
}): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ advice?: string; error?: string }>(
        'chore-advice',
        { body: payload }
    );
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.advice ?? '';
}
