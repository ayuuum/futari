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
    let body: { monthlyTrend?: { month: string; amount: number }[]; byCategory?: { name: string; amount: number }[] };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    try {
        const advice = await chat(apiKey, [
            {
                role: "system",
                content: "あなたは家計のアドバイザーです。与えられた支出データから、説教にならない一言アドバイスを1文で返してください。例：「食費が増えているので、外食を減らすと節約しやすいです」。データが少ない場合は「今月の支出を記録していくと、傾向が把握しやすくなります」など短い文にしてください。",
            },
            {
                role: "user",
                content: JSON.stringify(body),
            },
        ], { max_tokens: 120 });
        return jsonResponse({ advice: advice.trim() });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e) }, 500);
    }
});
