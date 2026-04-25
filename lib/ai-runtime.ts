import { getAiEnvForChild, type AiRole } from "@/lib/pipeline-ai-config";

type AiRuntimeConfig = {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type AiRuntimeResult = {
  provider: string;
  model: string;
  content: string;
};

export function getAiRuntimeConfig(role: AiRole = "modelA"): AiRuntimeConfig {
  const env = getAiEnvForChild(role);

  return {
    provider: env.AI_PROVIDER || "mock",
    baseUrl: env.LLM_BASE_URL || "",
    model: env.LLM_MODEL || "mock",
    apiKey: env.LLM_API_KEY || "",
  };
}

export async function callConfiguredModel(
  role: AiRole,
  system: string,
  user: string,
  options: { temperature?: number; maxTokens?: number; fallback?: () => string } = {},
): Promise<AiRuntimeResult> {
  const config = getAiRuntimeConfig(role);

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: config.model,
      content: options.fallback?.() || "",
    };
  }

  if (!config.apiKey) {
    if (options.fallback) {
      return { provider: config.provider, model: config.model, content: options.fallback() };
    }
    throw new Error("AI API Key is not configured.");
  }

  if (config.provider === "openai" || config.provider === "deepseek") {
    const endpoint = resolveOpenAICompatibleEndpoint(config.baseUrl || defaultBaseUrl(config.provider));
    const body = buildOpenAICompatibleBody(endpoint.type, config.model, system, user, options.temperature ?? 0.2, options.maxTokens ?? 700);
    const headers = buildOpenAICompatibleHeaders(config.apiKey, endpoint.type);

    if (endpoint.type === "chat") {
      const streamResponse = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...body, stream: true }),
      });

      const streamText = await streamResponse.text();
      if (!streamResponse.ok) throw new Error(`${config.provider} request failed: ${streamResponse.status} ${streamText.slice(0, 500)}`);
      const streamed = parseOpenAICompatibleStream(streamText);
      if (streamed) return { provider: config.provider, model: config.model, content: streamed };
    }

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`${config.provider} request failed: ${response.status} ${formatResponse(data)}`);
    return { provider: config.provider, model: config.model, content: requireModelText(config.provider, data) };
  }

  if (config.provider === "gemini") {
    const response = await fetch(resolveGeminiUrl(config.baseUrl, config.model, config.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: options.temperature ?? 0.2, maxOutputTokens: options.maxTokens ?? 700 },
      }),
    });
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`gemini request failed: ${response.status} ${formatResponse(data)}`);
    return { provider: config.provider, model: config.model, content: requireModelText(config.provider, data) };
  }

  if (config.provider === "claude") {
    const response = await fetch(resolveClaudeUrl(config.baseUrl || "https://api.anthropic.com/v1/messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: options.maxTokens ?? 700,
        temperature: options.temperature ?? 0.2,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`claude request failed: ${response.status} ${formatResponse(data)}`);
    return { provider: config.provider, model: config.model, content: requireModelText(config.provider, data) };
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`);
}

function resolveOpenAICompatibleEndpoint(url: string) {
  const trimmed = url.replace(/\/+$/u, "");
  if (trimmed.endsWith("/chat/completions")) return { url: trimmed, type: "chat" as const };
  if (trimmed.endsWith("/messages")) return { url: trimmed, type: "messages" as const };
  if (trimmed.endsWith("/responses")) return { url: trimmed, type: "responses" as const };
  if (trimmed.endsWith("/v1")) return { url: `${trimmed}/chat/completions`, type: "chat" as const };
  return { url: `${trimmed}/v1/chat/completions`, type: "chat" as const };
}

function buildOpenAICompatibleHeaders(apiKey: string, type: "chat" | "messages" | "responses") {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (type === "messages") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  return headers;
}

function buildOpenAICompatibleBody(
  type: "chat" | "messages" | "responses",
  model: string,
  system: string,
  user: string,
  temperature: number,
  maxTokens: number,
) {
  if (type === "messages") {
    return {
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    };
  }

  if (type === "responses") {
    return {
      model,
      input: `${system}\n\n${user}`,
      max_output_tokens: maxTokens,
      temperature,
    };
  }

  return {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  };
}

function resolveGeminiUrl(baseUrl: string, model: string, apiKey: string) {
  if (baseUrl.includes(":generateContent")) return baseUrl.includes("?") ? baseUrl : `${baseUrl}?key=${encodeURIComponent(apiKey)}`;
  const root = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/u, "");
  return `${root}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function resolveClaudeUrl(url: string) {
  const trimmed = url.replace(/\/+$/u, "");
  if (trimmed.endsWith("/messages")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/messages`;
  return `${trimmed}/v1/messages`;
}

function defaultBaseUrl(provider: string) {
  if (provider === "deepseek") return "https://api.deepseek.com/v1/chat/completions";
  return "https://api.openai.com/v1/chat/completions";
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractModelText(data: any): string {
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) return extractTextParts(messageContent);
  if (typeof data?.choices?.[0]?.text === "string") return data.choices[0].text;
  if (typeof data?.content?.[0]?.text === "string") return data.content[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((item: any) => item?.content || [])
      .map((part: any) => extractTextPart(part))
      .filter(Boolean)
      .join("\n");
  }
  if (Array.isArray(data?.candidates?.[0]?.content?.parts)) return extractTextParts(data.candidates[0].content.parts);
  return "";
}

function extractTextParts(parts: any[]) {
  return parts.map((part) => extractTextPart(part)).filter(Boolean).join("\n");
}

function extractTextPart(part: any): string {
  if (Array.isArray(part)) return extractTextParts(part);
  if (typeof part === "string") return part;
  if (typeof part?.text === "string") return part.text;
  if (typeof part?.content === "string") return part.content;
  if (part?.type === "text" && typeof part?.value === "string") return part.value;
  return "";
}

function requireModelText(provider: string, data: unknown) {
  const text = extractModelText(data);
  if (text.trim()) return text.trim();
  throw new Error(`${provider} returned empty content.`);
}

function formatResponse(data: unknown) {
  if (typeof data === "string") return data.slice(0, 500);
  return JSON.stringify(data).slice(0, 500);
}

function parseOpenAICompatibleStream(text: string) {
  if (!text.trim()) return "";
  if (text.trimStart().startsWith("{")) {
    try {
      return extractModelText(JSON.parse(text));
    } catch {
      return "";
    }
  }

  const chunks: string[] = [];
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const data = JSON.parse(payload);
      const choice = data.choices?.[0];
      const textPart =
        extractTextPart(choice?.delta?.content) || extractTextPart(choice?.message?.content) || extractTextPart(choice?.text);
      if (textPart) chunks.push(textPart);
    } catch {
      // Compatible gateways can emit non-JSON keep-alive lines.
    }
  }

  return chunks.join("").trim();
}
