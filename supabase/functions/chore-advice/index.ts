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
        myCompleted?: number;
        partnerCompleted?: number;
        myChoreCount?: number;
        partnerChoreCount?: number;
        partnerName?: string;
    };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    try {
        const advice = await chat(apiKey, [
            {
                role: "system",
                content: "あなたは同棲カップルの家事分担アドバイザーです。今週の完了数と担当数のデータから、押しつけにならない一言アドバイスを1文で返してください。例：「今週はあなたの完了が多めです。次はパートナーに頼んでみてもよいかもしれません。」データが偏っていない場合は「いいペースで分担できています」など短く。",
            },
            {
                role: "user",
                content: JSON.stringify(body),
            },
        ], { max_tokens: 100 });
        return jsonResponse({ advice: advice.trim() });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e) }, 500);
    }
});
