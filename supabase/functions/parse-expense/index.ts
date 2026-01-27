import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { chat } from "../_shared/openai.ts";

const CATEGORIES = "food:食費, utilities:光熱費, rent:家賃, entertainment:娯楽, daily:日用品, transport:交通費, medical:医療費, other:その他";

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
        return jsonResponse({ error: "OPENAI_API_KEY not set" }, 500);
    }
    let body: { text?: string };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
        return jsonResponse({ error: "text required" }, 400);
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
        const content = await chat(apiKey, [
            {
                role: "system",
                content: `あなたは家計アプリのアシスタントです。ユーザーが日本語で入力した支出の一文（例：「昨日コンビニで500円使った」「スーパーで3000円」）から、次のJSON形式で抽出してください。
{"amount": 金額の数値（円）、"description": 内容の短い説明（日本語）、"categoryId": カテゴリid、"date": "YYYY-MM-DD"}
カテゴリは次から1つ: food, utilities, rent, entertainment, daily, transport, medical, other
日付: 「昨日」「おととい」「先週」などは今日の日付から計算。今日は${today}。不明なら${today}。
金額が文中にない場合は0。`,
            },
            { role: "user", content: text },
        ], { max_tokens: 150 });
        const trimmed = content.replace(/```json?\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(trimmed) as { amount?: number; description?: string; categoryId?: string; date?: string };
        const amount = typeof parsed.amount === "number" ? parsed.amount : 0;
        const description = typeof parsed.description === "string" ? parsed.description.slice(0, 200) : text;
        const valid = ["food", "utilities", "rent", "entertainment", "daily", "transport", "medical", "other"];
        const categoryId = parsed.categoryId && valid.includes(parsed.categoryId) ? parsed.categoryId : "other";
        const date = typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : today;
        return jsonResponse({ amount, description, categoryId, date });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e) }, 500);
    }
});
