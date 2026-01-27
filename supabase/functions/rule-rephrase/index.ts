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
    let body: { text?: string };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
        return jsonResponse({ rephrased: text });
    }
    try {
        const rephrased = await chat(apiKey, [
            {
                role: "system",
                content: "あなたはカップル向けルールブックのアシスタントです。ユーザーが入力した短いルール文を、丁寧でポジティブな表現に言い換えて1文で返してください。責めない・命令形を避ける・相手を思いやるトーンにします。言い換えのみ返し、説明は不要です。",
            },
            { role: "user", content: text },
        ], { max_tokens: 100 });
        return jsonResponse({ rephrased: rephrased.trim() });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e) }, 500);
    }
});
