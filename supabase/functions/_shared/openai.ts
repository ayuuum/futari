const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function chat(
    apiKey: string,
    messages: { role: string; content: string | Array<{ type: string; image_url?: { url: string }; text?: string }> }[],
    options?: { max_tokens?: number }
) {
    const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: options?.max_tokens ?? 500,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI: ${res.status} ${err}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content == null) throw new Error("OpenAI: no content");
    return content;
}
