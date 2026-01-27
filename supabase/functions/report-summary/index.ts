import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { chat } from "../_shared/openai.ts";

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
        return jsonResponse({ error: "OPENAI_API_KEY not set" }, 500);
    }
    let body: {
        month?: string;
        totalExpenses?: number;
        comparison?: number;
        byCategory?: { name: string; amount: number; percentage: number }[];
        byPerson?: { you: { amount: number; percentage: number }; partner: { amount: number; percentage: number } };
    };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    try {
        const summary = await chat(apiKey, [
            {
                role: "system",
                content: "あなたは家計レポートの要約アシスタントです。与えられた数値データをもとに、2〜3文の短い日本語サマリーを書いてください。説教や長文は避け、事実を簡潔に伝えます。",
            },
            {
                role: "user",
                content: JSON.stringify({
                    month: body.month,
                    totalExpenses: body.totalExpenses,
                    comparison: body.comparison,
                    byCategory: body.byCategory,
                    byPerson: body.byPerson,
                }),
            },
        ], { max_tokens: 200 });
        return jsonResponse({ summary: summary.trim() });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e) }, 500);
    }
});
