import { studyAbroadEssayJsonSchema } from "@/lib/diagnose-tools/schemas/study-abroad-essay";

type JsonRequest = {
  systemPrompt: string;
  userPrompt: string;
};

export class AiUnavailableError extends Error {
  fallback = true;

  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

const openaiBaseUrl = () => String(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const aiTimeoutMs = () => Number(process.env.AI_TIMEOUT_MS || 45000);
const retryAttempts = () => Number(process.env.AI_RETRY_ATTEMPTS || 2);
const retryBaseDelayMs = () => Number(process.env.AI_RETRY_BASE_DELAY_MS || 800);

function getModel() {
  return process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_TEXT_MODEL || "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonText(text: string) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
}

function extractSseDataLines(chunk: string) {
  return chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
}

function extractResponsesText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;
  const content = data?.output?.flatMap((item: any) => item?.content || []) || [];
  return content.map((item: any) => item?.text || "").filter(Boolean).join("\n");
}

function shouldFallbackImmediately(status: number, data: any) {
  const raw = JSON.stringify(data || "").toLowerCase();
  return status === 400 && (raw.includes("model_not_found") || raw.includes("invalid_model") || raw.includes("model"));
}

function shouldRetry(error: unknown) {
  if (error instanceof SyntaxError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|abort|network|http 429|http 5\d\d|json/i.test(message);
}

async function responsesJson({ systemPrompt, userPrompt }: JsonRequest) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = getModel();
  if (!apiKey || !model) throw new AiUnavailableError("OPENAI_API_KEY or model is not configured");

  const response = await fetchWithTimeout(
    `${openaiBaseUrl()}/responses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: {
            type: "json_schema",
            ...studyAbroadEssayJsonSchema,
          },
        },
      }),
    },
    aiTimeoutMs(),
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (shouldFallbackImmediately(response.status, data)) throw new AiUnavailableError("Configured model is unavailable");
    throw new Error(`AI HTTP ${response.status}`);
  }
  return parseJsonText(extractResponsesText(data));
}

async function chatCompletionsJson({ systemPrompt, userPrompt }: JsonRequest) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = getModel();
  if (!apiKey || !model) throw new AiUnavailableError("OPENAI_API_KEY or model is not configured");

  const response = await fetchWithTimeout(
    `${openaiBaseUrl()}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2200,
        stream: process.env.OPENAI_COMPAT_STREAM === "1",
      }),
    },
    aiTimeoutMs(),
  );

  if (process.env.OPENAI_COMPAT_STREAM === "1") {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (shouldFallbackImmediately(response.status, data)) throw new AiUnavailableError("Configured model is unavailable");
      throw new Error(`AI HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("AI stream body is empty");

    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";

      for (const event of events) {
        for (const line of extractSseDataLines(event)) {
          if (line === "[DONE]") continue;
          const data = JSON.parse(line);
          content += data?.choices?.[0]?.delta?.content || "";
        }
      }
    }

    for (const line of extractSseDataLines(buffer)) {
      if (line !== "[DONE]") {
        const data = JSON.parse(line);
        content += data?.choices?.[0]?.delta?.content || "";
      }
    }

    return parseJsonText(content);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (shouldFallbackImmediately(response.status, data)) throw new AiUnavailableError("Configured model is unavailable");
    throw new Error(`AI HTTP ${response.status}`);
  }
  return parseJsonText(data?.choices?.[0]?.message?.content || "{}");
}

export async function callOpenAiJson(request: JsonRequest) {
  let lastError: unknown;
  const attempts = Math.max(1, retryAttempts() + 1);

  for (let index = 0; index < attempts; index += 1) {
    try {
      try {
        return { data: await responsesJson(request), source: "openai" as const };
      } catch (error) {
        if (error instanceof AiUnavailableError) throw error;
        if (!/AI HTTP 404|AI HTTP 400/i.test(error instanceof Error ? error.message : String(error))) throw error;
        return { data: await chatCompletionsJson(request), source: "compatible" as const };
      }
    } catch (error) {
      lastError = error;
      if (error instanceof AiUnavailableError) throw error;
      if (!shouldRetry(error) || index === attempts - 1) break;
      await sleep(retryBaseDelayMs() * 2 ** index);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI JSON call failed");
}
