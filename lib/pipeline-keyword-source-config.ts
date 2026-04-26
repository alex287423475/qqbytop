import fs from "fs";
import path from "path";

export type KeywordSourceConfig = {
  source5118: {
    enabled: boolean;
    endpoint: string;
    platform: string;
    apiKeySet: boolean;
    apiKeyMasked: string;
  };
  chinaz: {
    enabled: boolean;
    endpoint: string;
    version: string;
    apiKeySet: boolean;
    apiKeyMasked: string;
  };
};

export type KeywordSourceConfigInput = {
  source5118?: {
    enabled?: boolean;
    endpoint?: string;
    platform?: string;
    apiKey?: string;
  };
  chinaz?: {
    enabled?: boolean;
    endpoint?: string;
    version?: string;
    apiKey?: string;
  };
};

const envPath = path.join(process.cwd(), "local-brain", ".env");

const defaults = {
  source5118Endpoint: "https://apis.5118.com/suggest/list",
  source5118Platform: "baidu",
  chinazEndpoint: "https://openapi.chinaz.net/v1/1001/longkeyword",
  chinazVersion: "1.0",
};

export function getKeywordSourceConfig(): KeywordSourceConfig {
  const env = readLocalEnv();
  const source5118Key = env.get("KEYWORD_5118_API_KEY") || process.env.KEYWORD_5118_API_KEY || "";
  const chinazKey = env.get("KEYWORD_CHINAZ_API_KEY") || process.env.KEYWORD_CHINAZ_API_KEY || "";

  return {
    source5118: {
      enabled: readBoolean(env.get("KEYWORD_5118_ENABLED") || process.env.KEYWORD_5118_ENABLED, true),
      endpoint: env.get("KEYWORD_5118_ENDPOINT") || process.env.KEYWORD_5118_ENDPOINT || defaults.source5118Endpoint,
      platform: env.get("KEYWORD_5118_PLATFORM") || process.env.KEYWORD_5118_PLATFORM || defaults.source5118Platform,
      apiKeySet: source5118Key.length > 0,
      apiKeyMasked: maskSecret(source5118Key),
    },
    chinaz: {
      enabled: readBoolean(env.get("KEYWORD_CHINAZ_ENABLED") || process.env.KEYWORD_CHINAZ_ENABLED, true),
      endpoint: env.get("KEYWORD_CHINAZ_ENDPOINT") || process.env.KEYWORD_CHINAZ_ENDPOINT || defaults.chinazEndpoint,
      version: env.get("KEYWORD_CHINAZ_VERSION") || process.env.KEYWORD_CHINAZ_VERSION || defaults.chinazVersion,
      apiKeySet: chinazKey.length > 0,
      apiKeyMasked: maskSecret(chinazKey),
    },
  };
}

export function getKeywordSourceSecrets() {
  const env = readLocalEnv();
  return {
    source5118ApiKey: env.get("KEYWORD_5118_API_KEY") || process.env.KEYWORD_5118_API_KEY || "",
    chinazApiKey: env.get("KEYWORD_CHINAZ_API_KEY") || process.env.KEYWORD_CHINAZ_API_KEY || "",
  };
}

export function saveKeywordSourceConfig(input: KeywordSourceConfigInput): KeywordSourceConfig {
  const env = readLocalEnv();
  const current = getKeywordSourceConfig();

  if (input.source5118) {
    env.set("KEYWORD_5118_ENABLED", String(input.source5118.enabled ?? current.source5118.enabled));
    env.set("KEYWORD_5118_ENDPOINT", String(input.source5118.endpoint || current.source5118.endpoint || defaults.source5118Endpoint).trim());
    env.set("KEYWORD_5118_PLATFORM", String(input.source5118.platform || current.source5118.platform || defaults.source5118Platform).trim());
    if (input.source5118.apiKey !== undefined) {
      env.set("KEYWORD_5118_API_KEY", String(input.source5118.apiKey || "").trim());
    }
  }

  if (input.chinaz) {
    env.set("KEYWORD_CHINAZ_ENABLED", String(input.chinaz.enabled ?? current.chinaz.enabled));
    env.set("KEYWORD_CHINAZ_ENDPOINT", String(input.chinaz.endpoint || current.chinaz.endpoint || defaults.chinazEndpoint).trim());
    env.set("KEYWORD_CHINAZ_VERSION", String(input.chinaz.version || current.chinaz.version || defaults.chinazVersion).trim());
    if (input.chinaz.apiKey !== undefined) {
      env.set("KEYWORD_CHINAZ_API_KEY", String(input.chinaz.apiKey || "").trim());
    }
  }

  writeLocalEnv(env);
  return getKeywordSourceConfig();
}

function readLocalEnv() {
  if (!fs.existsSync(envPath)) return new Map<string, string>();

  const values = new Map<string, string>();
  const raw = fs.readFileSync(envPath, "utf-8");

  for (const line of raw.split(/\r?\n/u)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    values.set(line.slice(0, index).trim(), unquoteEnv(line.slice(index + 1).trim()));
  }

  return values;
}

function writeLocalEnv(env: Map<string, string>) {
  fs.mkdirSync(path.dirname(envPath), { recursive: true });

  const priorityKeys = [
    "KEYWORD_5118_ENABLED",
    "KEYWORD_5118_ENDPOINT",
    "KEYWORD_5118_PLATFORM",
    "KEYWORD_5118_API_KEY",
    "KEYWORD_CHINAZ_ENABLED",
    "KEYWORD_CHINAZ_ENDPOINT",
    "KEYWORD_CHINAZ_VERSION",
    "KEYWORD_CHINAZ_API_KEY",
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

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
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
