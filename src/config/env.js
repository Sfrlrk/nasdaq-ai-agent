export const AI_CONFIG_STORAGE_KEY = "ai_cfg_v1";

const env = import.meta.env;

export const config = {
    apiKeys: {
        anthropic: env.VITE_ANTHROPIC_API_KEY || "",
    },
    api: {
        anthropicProxy: env.VITE_ANTHROPIC_PROXY || "https://corsproxy.io/?url=",
    },
    envNames: {
        anthropicApiKey: "VITE_ANTHROPIC_API_KEY",
    },
};

export function getRuntimeConfig() {
    if (typeof window === "undefined") return config;

    try {
        const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
        if (!raw) return config;
        const parsed = JSON.parse(raw);

        return {
            ...config,
            apiKeys: {
                ...config.apiKeys,
                anthropic: parsed?.anthropicApiKey || config.apiKeys.anthropic,
            },
            api: {
                ...config.api,
                anthropicProxy: parsed?.anthropicProxy || config.api.anthropicProxy,
            },
        };
    } catch {
        return config;
    }
}

export function hasAnthropicApiKey() {
    return Boolean(getRuntimeConfig().apiKeys.anthropic);
}
