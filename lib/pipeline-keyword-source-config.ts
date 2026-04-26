import fs from "fs";
import path from "path";

export type KeywordResearchDepth = "suggest" | "longtail" | "full";

export type KeywordSourceConfig = {
  source5118: {
    enabled: boolean;
    suggestEndpoint: string;
    longTailEndpoint: string;
    metricsEndpoint: string;
    platforms: string[];
    defaultDepth: KeywordResearchDepth;
    suggestLimitPerPlatform: number;
    expandTopN: number;
    longTailPageSize: number;
    metricLimit: number;
    metricPollSeconds: number;
    apiKeySet: boolean;
    apiKeyMasked: string;
  };
};

export type KeywordSourceConfigInput = {
  source5118?: Partial<Omit<KeywordSourceConfig["source5118"], "apiKeySet" | "apiKeyMasked">> & {
    apiKey?: string;
  };
};

const envPath = path.join(process.cwd(), "local-brain", ".env");

const defaults = {
  suggestEndpoint: "https://apis.5118.com/suggest/list",
  longTailEndpoint: "https://apis.5118.com/keyword/word/v2",
  metricsEndpoint: "https://apis.5118.com/keywordparam/v2",
  platforms: ["baidu", "baidumobile", "xiaohongshu", "douyin"],
  defaultDepth: "full" as KeywordResearchDepth,
  suggestLimitPerPlatform: 30,
  expandTopN: 8,
  longTailPageSize: 30,
  metricLimit: 80,
  metricPollSeconds: 90,
};

export function getKeywordSourceConfig(): KeywordSourceConfig {
  const env = readLocalEnv();
  const source5118Key = env.get("KEYWORD_5118_API_KEY") || process.env.KEYWORD_5118_API_KEY || "";

  return {
    source5118: {
      enabled: readBoolean(env.get("KEYWORD_5118_ENABLED") || process.env.KEYWORD_5118_ENABLED, true),
      suggestEndpoint: env.get("KEYWORD_5118_SUGGEST_ENDPOINT") || process.env.KEYWORD_5118_SUGGEST_ENDPOINT || defaults.suggestEndpoint,
      longTailEndpoint: env.get("KEYWORD_5118_LONGTAIL_ENDPOINT") || process.env.KEYWORD_5118_LONGTAIL_ENDPOINT || defaults.longTailEndpoint,
      metricsEndpoint: env.get("KEYWORD_5118_METRICS_ENDPOINT") || process.env.KEYWORD_5118_METRICS_ENDPOINT || defaults.metricsEndpoint,
      platforms: readList(env.get("KEYWORD_5118_PLATFORMS") || process.env.KEYWORD_5118_PLATFORMS, defaults.platforms),
      defaultDepth: normalizeDepth(env.get("KEYWORD_5118_DEFAULT_DEPTH") || process.env.KEYWORD_5118_DEFAULT_DEPTH || defaults.defaultDepth),
      suggestLimitPerPlatform: readNumber(env.get("KEYWORD_5118_SUGGEST_LIMIT") || process.env.KEYWORD_5118_SUGGEST_LIMIT, defaults.suggestLimitPerPlatform),
      expandTopN: readNumber(env.get("KEYWORD_5118_EXPAND_TOP_N") || process.env.KEYWORD_5118_EXPAND_TOP_N, defaults.expandTopN),
      longTailPageSize: readNumber(env.get("KEYWORD_5118_LONGTAIL_PAGE_SIZE") || process.env.KEYWORD_5118_LONGTAIL_PAGE_SIZE, defaults.longTailPageSize),
      metricLimit: readNumber(env.get("KEYWORD_5118_METRIC_LIMIT") || process.env.KEYWORD_5118_METRIC_LIMIT, defaults.metricLimit),
      metricPollSeconds: readNumber(env.get("KEYWORD_5118_METRIC_POLL_SECONDS") || process.env.KEYWORD_5118_METRIC_POLL_SECONDS, defaults.metricPollSeconds),
      apiKeySet: source5118Key.length > 0,
      apiKeyMasked: maskSecret(source5118Key),
    },
  };
}

export function getKeywordSourceSecrets() {
  const env = readLocalEnv();
  return {
    source5118ApiKey: env.get("KEYWORD_5118_API_KEY") || process.env.KEYWORD_5118_API_KEY || "",
  };
}

export function saveKeywordSourceConfig(input: KeywordSourceConfigInput): KeywordSourceConfig {
  const env = readLocalEnv();
  const current = getKeywordSourceConfig();
  const next = input.source5118 || {};

  env.set("KEYWORD_5118_ENABLED", String(next.enabled ?? current.source5118.enabled));
  env.set("KEYWORD_5118_SUGGEST_ENDPOINT", String(next.suggestEndpoint || current.source5118.suggestEndpoint || defaults.suggestEndpoint).trim());
  env.set("KEYWORD_5118_LONGTAIL_ENDPOINT", String(next.longTailEndpoint || current.source5118.longTailEndpoint || defaults.longTailEndpoint).trim());
  env.set("KEYWORD_5118_METRICS_ENDPOINT", String(next.metricsEndpoint || current.source5118.metricsEndpoint || defaults.metricsEndpoint).trim());
  env.set("KEYWORD_5118_PLATFORMS", normalizePlatforms(next.platforms || current.source5118.platforms).join(","));
  env.set("KEYWORD_5118_DEFAULT_DEPTH", normalizeDepth(next.defaultDepth || current.source5118.defaultDepth));
  env.set("KEYWORD_5118_SUGGEST_LIMIT", String(clampNumber(next.suggestLimitPerPlatform, 1, 100, current.source5118.suggestLimitPerPlatform)));
  env.set("KEYWORD_5118_EXPAND_TOP_N", String(clampNumber(next.expandTopN, 0, 50, current.source5118.expandTopN)));
  env.set("KEYWORD_5118_LONGTAIL_PAGE_SIZE", String(clampNumber(next.longTailPageSize, 1, 100, current.source5118.longTailPageSize)));
  env.set("KEYWORD_5118_METRIC_LIMIT", String(clampNumber(next.metricLimit, 0, 200, current.source5118.metricLimit)));
  env.set("KEYWORD_5118_METRIC_POLL_SECONDS", String(clampNumber(next.metricPollSeconds, 10, 300, current.source5118.metricPollSeconds)));

  if (next.apiKey !== undefined) {
    env.set("KEYWORD_5118_API_KEY", String(next.apiKey || "").trim());
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
    "KEYWORD_5118_SUGGEST_ENDPOINT",
    "KEYWORD_5118_LONGTAIL_ENDPOINT",
    "KEYWORD_5118_METRICS_ENDPOINT",
    "KEYWORD_5118_PLATFORMS",
    "KEYWORD_5118_DEFAULT_DEPTH",
    "KEYWORD_5118_SUGGEST_LIMIT",
    "KEYWORD_5118_EXPAND_TOP_N",
    "KEYWORD_5118_LONGTAIL_PAGE_SIZE",
    "KEYWORD_5118_METRIC_LIMIT",
    "KEYWORD_5118_METRIC_POLL_SECONDS",
    "KEYWORD_5118_API_KEY",
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

function readNumber(value: string | undefined, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function readList(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  return normalizePlatforms(value.split(","));
}

function normalizePlatforms(value: unknown) {
  const allowed = new Set(["baidu", "baidumobile", "xiaohongshu", "douyin"]);
  const list = Array.isArray(value) ? value : [];
  const platforms = list.map((item) => String(item).trim()).filter((item) => allowed.has(item));
  return platforms.length > 0 ? Array.from(new Set(platforms)) : defaults.platforms;
}

function normalizeDepth(value: unknown): KeywordResearchDepth {
  if (value === "suggest" || value === "longtail" || value === "full") return value;
  return defaults.defaultDepth;
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
