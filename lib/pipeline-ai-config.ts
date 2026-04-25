import fs from "fs";
import path from "path";

export type AiProvider = "mock" | "openai" | "gemini" | "claude" | "deepseek";
export type AiRole = "modelA" | "modelB" | "modelC";

export type AiConfig = {
  role: AiRole;
  label: string;
  purpose: string;
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKeySet: boolean;
  apiKeyMasked: string;
};

export type AiConfigBundle = {
  modelA: AiConfig;
  modelB: AiConfig;
  modelC: AiConfig;
};

export type AiConfigInput = {
  role?: AiRole;
  provider?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
};

const envPath = path.join(process.cwd(), "local-brain", ".env");

const providerModelKeys: Record<AiProvider, string> = {
  mock: "LLM_MODEL",
  openai: "OPENAI_MODEL",
  gemini: "GEMINI_MODEL",
  claude: "CLAUDE_MODEL",
  deepseek: "DEEPSEEK_MODEL",
};

const defaultModels: Record<AiProvider, string> = {
  mock: "mock",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-pro",
  claude: "claude-sonnet-4-20250514",
  deepseek: "deepseek-chat",
};

const roleMeta: Record<AiRole, { label: string; purpose: string; prefix: string }> = {
  modelA: { label: "模型A", purpose: "生成文章", prefix: "MODEL_A" },
  modelB: { label: "模型B", purpose: "AI质检与AI重写", prefix: "MODEL_B" },
  modelC: { label: "模型C", purpose: "关键词挖掘与站内AI搜索回答", prefix: "MODEL_C" },
};

export function readLocalEnv() {
  if (!fs.existsSync(envPath)) return new Map<string, string>();

  const values = new Map<string, string>();
  const raw = fs.readFileSync(envPath, "utf-8");

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    values.set(line.slice(0, index).trim(), unquoteEnv(line.slice(index + 1).trim()));
  }

  return values;
}

export function getAiConfig(): AiConfigBundle {
  return {
    modelA: getAiRoleConfig("modelA"),
    modelB: getAiRoleConfig("modelB"),
    modelC: getAiRoleConfig("modelC"),
  };
}

export function getAiRoleConfig(role: AiRole): AiConfig {
  const env = readLocalEnv();
  const meta = roleMeta[role];
  const legacyProvider = env.get("AI_PROVIDER") || process.env.AI_PROVIDER || "mock";
  const provider = normalizeProvider(env.get(`${meta.prefix}_PROVIDER`) || process.env[`${meta.prefix}_PROVIDER`] || legacyProvider);
  const modelKey = providerModelKeys[provider];
  const legacyModel = env.get("LLM_MODEL") || process.env.LLM_MODEL || env.get(modelKey) || process.env[modelKey] || defaultModels[provider];
  const apiKey = env.get(`${meta.prefix}_API_KEY`) || process.env[`${meta.prefix}_API_KEY`] || env.get("LLM_API_KEY") || process.env.LLM_API_KEY || "";

  return {
    role,
    label: meta.label,
    purpose: meta.purpose,
    provider,
    baseUrl: env.get(`${meta.prefix}_BASE_URL`) || process.env[`${meta.prefix}_BASE_URL`] || env.get("LLM_BASE_URL") || process.env.LLM_BASE_URL || "",
    model: env.get(`${meta.prefix}_MODEL`) || process.env[`${meta.prefix}_MODEL`] || legacyModel,
    apiKeySet: apiKey.length > 0,
    apiKeyMasked: maskSecret(apiKey),
  };
}

export function getAiEnvForChild(role: AiRole = "modelA", providerOverride?: string) {
  const env = readLocalEnv();
  const meta = roleMeta[role];
  const config = getAiRoleConfig(role);
  const provider = normalizeProvider(providerOverride || config.provider);
  const modelKey = providerModelKeys[provider];
  const model = env.get(`${meta.prefix}_MODEL`) || process.env[`${meta.prefix}_MODEL`] || config.model || defaultModels[provider];
  const apiKey = env.get(`${meta.prefix}_API_KEY`) || process.env[`${meta.prefix}_API_KEY`] || env.get("LLM_API_KEY") || process.env.LLM_API_KEY || "";
  const baseUrl = env.get(`${meta.prefix}_BASE_URL`) || process.env[`${meta.prefix}_BASE_URL`] || env.get("LLM_BASE_URL") || process.env.LLM_BASE_URL || "";

  return {
    AI_PROVIDER: provider,
    AI_ROLE: role,
    LLM_BASE_URL: baseUrl,
    LLM_API_KEY: apiKey,
    LLM_MODEL: model,
    [modelKey]: model,
    OPENAI_API_KEY: provider === "openai" ? apiKey : env.get("OPENAI_API_KEY") || "",
    GEMINI_API_KEY: provider === "gemini" ? apiKey : env.get("GEMINI_API_KEY") || "",
    CLAUDE_API_KEY: provider === "claude" ? apiKey : env.get("CLAUDE_API_KEY") || "",
    DEEPSEEK_API_KEY: provider === "deepseek" ? apiKey : env.get("DEEPSEEK_API_KEY") || "",
  };
}

export function saveAiConfig(input: AiConfigInput): AiConfigBundle {
  const env = readLocalEnv();
  const role = normalizeRole(input.role || "modelA");
  const meta = roleMeta[role];
  const current = getAiRoleConfig(role);
  const provider = normalizeProvider(input.provider || current.provider);
  const model = String(input.model || "").trim() || defaultModels[provider];
  const baseUrl = String(input.baseUrl || "").trim();
  const apiKey = input.apiKey === undefined ? env.get(`${meta.prefix}_API_KEY`) || env.get("LLM_API_KEY") || "" : String(input.apiKey || "").trim();

  env.set(`${meta.prefix}_PROVIDER`, provider);
  env.set(`${meta.prefix}_BASE_URL`, baseUrl);
  env.set(`${meta.prefix}_MODEL`, model);
  env.set(`${meta.prefix}_API_KEY`, apiKey);

  if (role === "modelA") {
    env.set("AI_PROVIDER", provider);
    env.set("LLM_BASE_URL", baseUrl);
    env.set("LLM_MODEL", model);
    env.set("LLM_API_KEY", apiKey);
    env.set(providerModelKeys[provider], model);
  }

  writeLocalEnv(env);
  return getAiConfig();
}

export function normalizeRole(role: string): AiRole {
  if (role === "modelB") return "modelB";
  if (role === "modelC") return "modelC";
  return "modelA";
}

function normalizeProvider(provider: string): AiProvider {
  if (["mock", "openai", "gemini", "claude", "deepseek"].includes(provider)) return provider as AiProvider;
  return "mock";
}

function writeLocalEnv(env: Map<string, string>) {
  fs.mkdirSync(path.dirname(envPath), { recursive: true });

  const priorityKeys = [
    "MODEL_A_PROVIDER",
    "MODEL_A_BASE_URL",
    "MODEL_A_MODEL",
    "MODEL_A_API_KEY",
    "MODEL_B_PROVIDER",
    "MODEL_B_BASE_URL",
    "MODEL_B_MODEL",
    "MODEL_B_API_KEY",
    "MODEL_C_PROVIDER",
    "MODEL_C_BASE_URL",
    "MODEL_C_MODEL",
    "MODEL_C_API_KEY",
    "AI_PROVIDER",
    "LLM_BASE_URL",
    "LLM_MODEL",
    "LLM_API_KEY",
    "OPENAI_MODEL",
    "GEMINI_MODEL",
    "CLAUDE_MODEL",
    "DEEPSEEK_MODEL",
  ];
  const allKeys = [...priorityKeys, ...Array.from(env.keys()).filter((key) => !priorityKeys.includes(key)).sort()];
  const lines = allKeys.map((key) => `${key}=${quoteEnv(env.get(key) || "")}`);
  fs.writeFileSync(envPath, `${lines.join("\n")}\n`, "utf-8");
}

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function quoteEnv(value: string) {
  if (!value) return "";
  if (/[\s#"']/u.test(value)) return JSON.stringify(value);
  return value;
}

function unquoteEnv(value: string) {
  if (!value) return "";
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  return value;
}
