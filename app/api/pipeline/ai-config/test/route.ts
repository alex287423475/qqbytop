import { NextRequest, NextResponse } from "next/server";
import { getAiRoleConfig, normalizeRole, readLocalEnv } from "@/lib/pipeline-ai-config";

export const runtime = "nodejs";

type TestInput = {
  role?: "modelA" | "modelB";
  provider?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "AI connection test is disabled in production." }, { status: 403 });
  }

  const startedAt = Date.now();
  const body = (await request.json().catch(() => ({}))) as TestInput;
  const role = normalizeRole(body.role || "modelA");
  const saved = getAiRoleConfig(role);
  const env = readLocalEnv();
  const provider = normalizeProvider(body.provider || saved.provider);
  const baseUrl = String(body.baseUrl ?? saved.baseUrl ?? "").trim();
  const model = String(body.model || saved.model || defaultModel(provider)).trim();
  const apiKey = String(body.apiKey || env.get(`${role === "modelB" ? "MODEL_B" : "MODEL_A"}_API_KEY`) || env.get("LLM_API_KEY") || "").trim();

  if (provider === "mock") {
    return NextResponse.json({
      success: true,
      role,
      provider,
      model,
      latencyMs: Date.now() - startedAt,
      message: "Mock provider is available. It will use the local fallback template and will not call a remote model.",
    });
  }

  if (!apiKey) {
    return NextResponse.json({ success: false, provider, model, message: "API Key is required for this provider." }, { status: 400 });
  }

  try {
    const result = await testProvider({ provider, baseUrl, model, apiKey });
    return NextResponse.json({
      success: true,
      role,
      provider,
      model,
      latencyMs: Date.now() - startedAt,
      message: result || "Connection test passed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        role,
        provider,
        model,
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : "Connection test failed.",
      },
      { status: 400 },
    );
  }
}

async function testProvider({ provider, baseUrl, model, apiKey }: { provider: string; baseUrl: string; model: string; apiKey: string }) {
  if (provider === "openai" || provider === "deepseek") {
    const endpoint = resolveOpenAICompatibleEndpoint(baseUrl || defaultBaseUrl(provider));
    const body = buildOpenAICompatibleBody(endpoint.type, model, "You are a connection test endpoint. Reply with OK.", "ping", 80);

    if (endpoint.type === "chat") {
      const streamResponse = await fetch(endpoint.url, {
        method: "POST",
        headers: buildOpenAICompatibleHeaders(apiKey, endpoint.type),
        body: JSON.stringify({ ...body, stream: true }),
      });

      const streamData = await streamResponse.text();
      if (!streamResponse.ok) throw new Error(`${provider} request failed: ${streamResponse.status} ${streamData.slice(0, 500)}`);
      const streamedText = parseOpenAICompatibleStream(streamData);
      if (streamedText) return streamedText;
    }

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(apiKey, endpoint.type),
      body: JSON.stringify(body),
    });

    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`${provider} request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText(provider, data);
  }

  if (provider === "gemini") {
    const response = await fetch(resolveGeminiUrl(baseUrl, model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with OK." }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 8 },
      }),
    });

    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`gemini request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText("gemini", data);
  }

  if (provider === "claude") {
    const response = await fetch(resolveClaudeUrl(baseUrl || "https://api.anthropic.com/v1/messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8,
        temperature: 0,
        messages: [{ role: "user", content: "Reply with OK." }],
      }),
    });

    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`claude request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText("claude", data);
  }

  throw new Error(`Unsupported provider: ${provider}`);
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

function buildOpenAICompatibleBody(type: "chat" | "messages" | "responses", model: string, system: string, user: string, maxTokens: number) {
  if (type === "messages") {
    return {
      model,
      max_tokens: maxTokens,
      temperature: 0,
      system,
      messages: [{ role: "user", content: user }],
    };
  }

  if (type === "responses") {
    return {
      model,
      input: `${system}\n\n${user}`,
      max_output_tokens: maxTokens,
      temperature: 0,
    };
  }

  return {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0,
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

function normalizeProvider(provider: string) {
  if (["mock", "openai", "gemini", "claude", "deepseek"].includes(provider)) return provider;
  return "mock";
}

function defaultBaseUrl(provider: string) {
  if (provider === "deepseek") return "https://api.deepseek.com/v1/chat/completions";
  return "https://api.openai.com/v1/chat/completions";
}

function defaultModel(provider: string) {
  if (provider === "deepseek") return "deepseek-chat";
  if (provider === "gemini") return "gemini-2.5-pro";
  if (provider === "claude") return "claude-sonnet-4-20250514";
  if (provider === "openai") return "gpt-4o-mini";
  return "mock";
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractModelText(data: any) {
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) return extractTextParts(messageContent);
  if (data?.choices?.[0]?.text) return data.choices[0].text;
  if (data?.content?.[0]?.text) return data.content[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((item: any) => item?.content || [])
      .map((part: any) => extractTextPart(part))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function extractTextParts(parts: any[]): string {
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
  throw new Error(`${provider} returned empty content. ${summarizeModelResponse(data)}`);
}

function summarizeModelResponse(data: unknown) {
  if (!data || typeof data !== "object") return `response=${formatResponse(data)}`;

  const value = data as any;
  const choice = value.choices?.[0];
  const message = choice?.message;
  const content = message && "content" in message ? message.content : value.content;
  const output = Array.isArray(value.output) ? `array(${value.output.length})` : typeof value.output;
  const candidates = Array.isArray(value.candidates) ? `array(${value.candidates.length})` : typeof value.candidates;
  const usage = value.usage ? JSON.stringify(value.usage).slice(0, 220) : "none";

  return [
    `object=${String(value.object ?? "unknown")}`,
    `finish=${String(choice?.finish_reason ?? value.stop_reason ?? value.status ?? "unknown")}`,
    `content=${content === null ? "null" : typeof content}`,
    `output=${output}`,
    `candidates=${candidates}`,
    `usage=${usage}`,
  ].join(", ");
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
