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
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(apiKey, endpoint.type),
      body: JSON.stringify(buildOpenAICompatibleBody(endpoint.type, model, "You are a connection test endpoint. Reply with OK.", "ping", 8)),
    });

    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`${provider} request failed: ${response.status} ${formatResponse(data)}`);
    return extractModelText(data) || "Connection test passed.";
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
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Connection test passed.";
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
    return data?.content?.[0]?.text || "Connection test passed.";
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
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (data?.choices?.[0]?.text) return data.choices[0].text;
  if (data?.content?.[0]?.text) return data.content[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((item: any) => item?.content || [])
      .map((part: any) => part?.text || "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function formatResponse(data: unknown) {
  if (typeof data === "string") return data.slice(0, 500);
  return JSON.stringify(data).slice(0, 500);
}
