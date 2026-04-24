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
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) return extractTextParts(messageContent);
  if (data?.choices?.[0]?.text) return data.choices[0].text;
  if (data?.content?.[0]?.text) return data.content[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((item) => item?.content || [])
      .map((part) => extractTextPart(part))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function extractTextParts(parts) {
  return parts.map((part) => extractTextPart(part)).filter(Boolean).join("\n");
}

function extractTextPart(part) {
  if (Array.isArray(part)) return extractTextParts(part);
  if (typeof part === "string") return part;
  if (typeof part?.text === "string") return part.text;
  if (typeof part?.content === "string") return part.content;
  if (part?.type === "text" && typeof part?.value === "string") return part.value;
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
    const body = config.body(systemPrompt, userPrompt, options, config.endpointType);

    if (config.endpointType === "chat") {
      const streamResponse = await fetch(config.url, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify({ ...body, stream: true }),
      });

      if (!streamResponse.ok) {
        throw new Error(`${provider} request failed: ${streamResponse.status} ${await streamResponse.text()}`);
      }

      const streamText = await streamResponse.text();
      const streamedContent = parseOpenAICompatibleStream(streamText);
      if (streamedContent) return streamedContent;
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`${provider} request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const content = config.parse(data);
    if (!content) throw new Error(`${provider} returned empty content. ${summarizeModelResponse(data)}`);
    return content;
  } catch (error) {
    if (provider === "mock" && typeof options.fallback === "function") {
      return options.fallback(error);
    }

    throw error;
  }
}

function summarizeModelResponse(data) {
  if (!data || typeof data !== "object") return `response=${formatResponse(data)}`;

  const choice = data.choices?.[0];
  const message = choice?.message;
  const content = message && "content" in message ? message.content : data.content;
  const output = Array.isArray(data.output) ? `array(${data.output.length})` : typeof data.output;
  const candidates = Array.isArray(data.candidates) ? `array(${data.candidates.length})` : typeof data.candidates;
  const usage = data.usage ? JSON.stringify(data.usage).slice(0, 220) : "none";

  return [
    `object=${String(data.object ?? "unknown")}`,
    `finish=${String(choice?.finish_reason ?? data.stop_reason ?? data.status ?? "unknown")}`,
    `content=${content === null ? "null" : typeof content}`,
    `output=${output}`,
    `candidates=${candidates}`,
    `usage=${usage}`,
  ].join(", ");
}

function formatResponse(data) {
  if (typeof data === "string") return data.slice(0, 500);
  return JSON.stringify(data).slice(0, 500);
}

function parseOpenAICompatibleStream(text) {
  if (!text.trim()) return "";

  if (text.trimStart().startsWith("{")) {
    try {
      return extractModelText(JSON.parse(text));
    } catch {
      return "";
    }
  }

  const chunks = [];
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const data = JSON.parse(payload);
      const choice = data.choices?.[0];
      const deltaContent = choice?.delta?.content;
      const messageContent = choice?.message?.content;
      const textPart = extractTextPart(deltaContent) || extractTextPart(messageContent) || extractTextPart(choice?.text);
      if (textPart) chunks.push(textPart);
    } catch {
      // Ignore malformed stream keep-alive lines from compatible gateways.
    }
  }

  return chunks.join("").trim();
}
