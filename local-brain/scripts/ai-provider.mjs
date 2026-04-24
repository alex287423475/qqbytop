const providerLabels = {
  mock: "Mock",
  openai: "OpenAI",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
};

function getProvider() {
  return process.env.AI_PROVIDER || "mock";
}

function getProviderConfig(provider) {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  const apiKey = process.env.LLM_API_KEY || "";

  switch (provider) {
    case "openai":
      return {
        ...buildOpenAICompatibleConfig(baseUrl || "https://api.openai.com/v1/chat/completions", apiKey || process.env.OPENAI_API_KEY || ""),
        body: (systemPrompt, userPrompt, options, endpointType) =>
          buildOpenAICompatibleBody(endpointType, model || process.env.OPENAI_MODEL || "gpt-4o-mini", systemPrompt, userPrompt, options.temperature ?? 0.6, options.maxTokens ?? 4000),
        parse: extractModelText,
      };
    case "deepseek":
      return {
        ...buildOpenAICompatibleConfig(baseUrl || "https://api.deepseek.com/v1/chat/completions", apiKey || process.env.DEEPSEEK_API_KEY || ""),
        body: (systemPrompt, userPrompt, options, endpointType) =>
          buildOpenAICompatibleBody(endpointType, model || process.env.DEEPSEEK_MODEL || "deepseek-chat", systemPrompt, userPrompt, options.temperature ?? 0.6, options.maxTokens ?? 4000),
        parse: extractModelText,
      };
    case "gemini":
      return {
        url: resolveGeminiUrl(baseUrl, model || process.env.GEMINI_MODEL || "gemini-2.5-pro", apiKey || process.env.GEMINI_API_KEY || ""),
        headers: {
          "Content-Type": "application/json",
        },
        body: (systemPrompt, userPrompt) => ({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
        }),
        parse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      };
    case "claude":
      return {
        url: resolveClaudeUrl(baseUrl || "https://api.anthropic.com/v1/messages"),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey || process.env.CLAUDE_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: (systemPrompt, userPrompt, options) => ({
          model: model || process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
          max_tokens: options.maxTokens ?? 4000,
          temperature: options.temperature ?? 0.6,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        parse: (data) => data.content?.[0]?.text || "",
      };
    default:
      return null;
  }
}

function buildOpenAICompatibleConfig(url, apiKey) {
  const endpoint = resolveOpenAICompatibleEndpoint(url);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (endpoint.type === "messages") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  return { url: endpoint.url, endpointType: endpoint.type, headers };
}

function resolveOpenAICompatibleEndpoint(url) {
  const trimmed = url.replace(/\/+$/u, "");
  if (trimmed.endsWith("/chat/completions")) return { url: trimmed, type: "chat" };
  if (trimmed.endsWith("/messages")) return { url: trimmed, type: "messages" };
  if (trimmed.endsWith("/responses")) return { url: trimmed, type: "responses" };
  if (trimmed.endsWith("/v1")) return { url: `${trimmed}/chat/completions`, type: "chat" };
  return { url: `${trimmed}/v1/chat/completions`, type: "chat" };
}

function buildOpenAICompatibleBody(type, model, systemPrompt, userPrompt, temperature, maxTokens) {
  if (type === "messages") {
    return {
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    };
  }

  if (type === "responses") {
    return {
      model,
      input: `${systemPrompt}\n\n${userPrompt}`,
      max_output_tokens: maxTokens,
      temperature,
    };
  }

  return {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
}

function resolveGeminiUrl(baseUrl, model, apiKey) {
  if (baseUrl && baseUrl.includes(":generateContent")) return baseUrl.includes("?") ? baseUrl : `${baseUrl}?key=${encodeURIComponent(apiKey)}`;
  const root = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/u, "");
  return `${root}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function resolveClaudeUrl(url) {
  const trimmed = url.replace(/\/+$/u, "");
  if (trimmed.endsWith("/messages")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/messages`;
  return `${trimmed}/v1/messages`;
}

function extractModelText(data) {
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (data?.choices?.[0]?.text) return data.choices[0].text;
  if (data?.content?.[0]?.text) return data.content[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((item) => item?.content || [])
      .map((part) => part?.text || "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function getProviderLabel() {
  return providerLabels[getProvider()] || providerLabels.mock;
}

export async function callLLM(systemPrompt, userPrompt, options = {}) {
  const provider = getProvider();
  if (provider === "mock") {
    if (typeof options.fallback === "function") return options.fallback();
    return "";
  }

  const config = getProviderConfig(provider);
  if (!config) {
    if (typeof options.fallback === "function") return options.fallback();
    throw new Error(`Unsupported provider: ${provider}`);
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(config.body(systemPrompt, userPrompt, options, config.endpointType)),
    });

    if (!response.ok) {
      throw new Error(`${provider} request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const content = config.parse(data);
    if (!content) throw new Error(`${provider} returned empty content`);
    return content;
  } catch (error) {
    if (typeof options.fallback === "function") {
      return options.fallback(error);
    }

    throw error;
  }
}
