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
    let body: { description?: string };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
        return jsonResponse({ categoryId: "other" });
    }
    try {
        const content = await chat(apiKey, [
            {
                role: "system",
                content: `あなたは家計アプリのアシスタントです。ユーザーが入力した支出の内容（説明文）から、最も適したカテゴリを1つだけ選んでください。
カテゴリは次のいずれかです（id:名前）。${CATEGORIES}
回答は必ず上記のidだけを1つ返してください。例: food または other`,
            },
            { role: "user", content: description },
        ], { max_tokens: 20 });
        const categoryId = content.replace(/[\s.]/g, "").toLowerCase();
        const valid = ["food", "utilities", "rent", "entertainment", "daily", "transport", "medical", "other"];
        const result = valid.includes(categoryId) ? categoryId : "other";
        return jsonResponse({ categoryId: result });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e), categoryId: "other" }, 500);
    }
});
