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
    let body: { imageBase64?: string };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }
    const imageBase64 = body.imageBase64;
    if (!imageBase64 || typeof imageBase64 !== "string") {
        return jsonResponse({ error: "imageBase64 required" }, 400);
    }
    const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    try {
        const content = await chat(apiKey, [
            {
                role: "system",
                content: `あなたはレシート読み取りアシスタントです。画像は日本のレシートです。
以下をJSON形式でだけ答えてください。他は書かないでください。
{"amount": 合計金額の数値（円）、"description": 店名または簡潔な内容（日本語）、"categoryId": カテゴリid}
カテゴリは次から1つ選ぶ: food, utilities, rent, entertainment, daily, transport, medical, other
金額が読めない場合は0、店名が読めない場合は"レシート"、カテゴリは内容から推測して選んでください。`,
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "このレシート画像から金額・店名・カテゴリを抽出してJSONで返してください。" },
                    { type: "image_url", image_url: { url: imageUrl } },
                ],
            },
        ], { max_tokens: 200 });
        const trimmed = content.replace(/```json?\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(trimmed) as { amount?: number; description?: string; categoryId?: string };
        const amount = typeof parsed.amount === "number" ? parsed.amount : 0;
        const description = typeof parsed.description === "string" ? parsed.description.slice(0, 200) : "レシート";
        const valid = ["food", "utilities", "rent", "entertainment", "daily", "transport", "medical", "other"];
        const categoryId = parsed.categoryId && valid.includes(parsed.categoryId) ? parsed.categoryId : "other";
        return jsonResponse({ amount, description, categoryId });
    } catch (e) {
        console.error(e);
        return jsonResponse({ error: String(e) }, 500);
    }
});
