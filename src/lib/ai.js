const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_PROXY = "https://corsproxy.io/?url=";

function getApiKey() {
    return import.meta.env.VITE_ANTHROPIC_API_KEY || "";
}

function buildEndpoint() {
    const base = import.meta.env.VITE_ANTHROPIC_PROXY || DEFAULT_PROXY;
    return `${base}${encodeURIComponent(ANTHROPIC_URL)}`;
}

export async function askClaude(prompt, maxTokens = 1000) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("missing_api_key");
    }

    const r = await fetch(buildEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!r.ok) {
        const errorText = await r.text();
        throw new Error(`anthropic_${r.status}:${errorText}`);
    }

    const d = await r.json();
    return d.content?.map?.(b => b.text || "").join("") || "Yanıt oluşturulamadı.";
}

