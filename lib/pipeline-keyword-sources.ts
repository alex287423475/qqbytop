import { getKeywordSourceConfig, getKeywordSourceSecrets } from "@/lib/pipeline-keyword-source-config";

export type KeywordSourceName = "5118" | "chinaz";

export type KeywordSourceRequest = {
  use5118?: boolean;
  useChinaz?: boolean;
};

export type KeywordSourceItem = {
  keyword: string;
  source: string;
  searchVolume?: number;
  pcSearchVolume?: number;
  mobileSearchVolume?: number;
  index?: number;
  semPrice?: number;
  competition?: string;
  difficulty?: string;
  pageCount?: number;
  features?: string;
};

export type KeywordSourceResult = {
  items: KeywordSourceItem[];
  logs: string[];
  errors: string[];
};

const SOURCE_TIMEOUT_MS = 20000;

export async function collectKeywordSourceItems(seeds: string[], request: KeywordSourceRequest): Promise<KeywordSourceResult> {
  const config = getKeywordSourceConfig();
  const secrets = getKeywordSourceSecrets();
  const logs: string[] = [];
  const errors: string[] = [];
  const items: KeywordSourceItem[] = [];

  const use5118 = request.use5118 ?? true;
  const useChinaz = request.useChinaz ?? true;

  if (use5118 && config.source5118.enabled) {
    if (!secrets.source5118ApiKey) {
      errors.push("5118 下拉词 API 未配置 API Key。");
    } else {
      for (const seed of seeds) {
        try {
          const nextItems = await fetch5118Suggest(seed, {
            endpoint: config.source5118.endpoint,
            platform: config.source5118.platform,
            apiKey: secrets.source5118ApiKey,
          });
          items.push(...nextItems);
          logs.push(`5118：${seed} 返回 ${nextItems.length} 个下拉词。`);
        } catch (error) {
          errors.push(`5118：${seed} 请求失败，${error instanceof Error ? error.message : "未知错误"}`);
        }
      }
    }
  }

  if (useChinaz && config.chinaz.enabled) {
    if (!secrets.chinazApiKey) {
      errors.push("站长工具百度长尾词 API 未配置 API Key。");
    } else {
      for (const seed of seeds) {
        try {
          const nextItems = await fetchChinazLongKeywords(seed, {
            endpoint: config.chinaz.endpoint,
            version: config.chinaz.version,
            apiKey: secrets.chinazApiKey,
          });
          items.push(...nextItems);
          logs.push(`站长工具：${seed} 返回 ${nextItems.length} 个长尾词。`);
        } catch (error) {
          errors.push(`站长工具：${seed} 请求失败，${error instanceof Error ? error.message : "未知错误"}`);
        }
      }
    }
  }

  return { items: mergeSourceItems(items), logs, errors };
}

async function fetch5118Suggest(seed: string, config: { endpoint: string; platform: string; apiKey: string }): Promise<KeywordSourceItem[]> {
  const body = new URLSearchParams({ word: seed, platform: config.platform || "baidu" });
  const response = await fetchWithTimeout(config.endpoint, {
    method: "POST",
    headers: {
      authorization: config.apiKey,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await readJsonOrText(response);
  if (!response.ok) throw new Error(`${response.status} ${formatResponse(payload)}`);
  if (String(payload?.errcode ?? "0") !== "0") throw new Error(payload?.errmsg || formatResponse(payload));

  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .map((row: any) => String(row?.promote_word || row?.keyword || row?.word || "").trim())
    .filter((keyword: string) => keyword && keyword !== seed)
    .map((keyword: string) => ({ keyword, source: "5118下拉词" }));
}

async function fetchChinazLongKeywords(seed: string, config: { endpoint: string; version: string; apiKey: string }): Promise<KeywordSourceItem[]> {
  const url = new URL(config.endpoint);
  url.searchParams.set("keyword", seed);
  url.searchParams.set("page", "1");
  url.searchParams.set("APIKey", config.apiKey);
  url.searchParams.set("ChinazVer", config.version || "1.0");

  const response = await fetchWithTimeout(url.toString(), { method: "GET" });
  const payload = await readJsonOrText(response);
  if (!response.ok) throw new Error(`${response.status} ${formatResponse(payload)}`);

  const stateCode = Number(payload?.StateCode ?? payload?.stateCode ?? payload?.Code ?? 1);
  if (stateCode !== 1) throw new Error(payload?.Reason || payload?.Message || formatResponse(payload));

  const rows = Array.isArray(payload?.Result?.List) ? payload.Result.List : Array.isArray(payload?.result?.list) ? payload.result.list : [];
  return rows
    .map((row: any) => {
      const keyword = String(row?.Keyword || row?.keyword || "").trim();
      if (!keyword) return null;
      const pc = toNumber(row?.PcSearchVolume);
      const mobile = toNumber(row?.MobileSearchVolume);
      return {
        keyword,
        source: "站长工具百度长尾词",
        searchVolume: pc + mobile || toNumber(row?.AllIndex),
        pcSearchVolume: pc || undefined,
        mobileSearchVolume: mobile || undefined,
        index: toNumber(row?.AllIndex) || undefined,
        semPrice: toNumber(row?.Sem) || undefined,
        competition: String(row?.Competitionstr || "").trim() || undefined,
        difficulty: inferDifficulty(row),
        pageCount: toNumber(row?.Pagenum) || undefined,
        features: String(row?.Features || "").trim() || undefined,
      } satisfies KeywordSourceItem;
    })
    .filter((row: KeywordSourceItem | null): row is KeywordSourceItem => row !== null);
}

function mergeSourceItems(items: KeywordSourceItem[]) {
  const byKeyword = new Map<string, KeywordSourceItem>();
  for (const item of items) {
    const key = normalizeKeywordKey(item.keyword);
    const current = byKeyword.get(key);
    if (!current) {
      byKeyword.set(key, item);
      continue;
    }

    byKeyword.set(key, {
      ...current,
      ...item,
      source: Array.from(new Set([...current.source.split("+"), ...item.source.split("+")])).join("+"),
      searchVolume: Math.max(current.searchVolume || 0, item.searchVolume || 0) || undefined,
      pcSearchVolume: Math.max(current.pcSearchVolume || 0, item.pcSearchVolume || 0) || undefined,
      mobileSearchVolume: Math.max(current.mobileSearchVolume || 0, item.mobileSearchVolume || 0) || undefined,
      index: Math.max(current.index || 0, item.index || 0) || undefined,
      semPrice: Math.max(current.semPrice || 0, item.semPrice || 0) || undefined,
    });
  }

  return Array.from(byKeyword.values());
}

function normalizeKeywordKey(keyword: string) {
  return keyword.toLowerCase().replace(/\s+/gu, "");
}

function inferDifficulty(row: any) {
  const competition = String(row?.Competitionstr || "").trim();
  if (competition) return competition;
  const bidCount = toNumber(row?.BidCount);
  const index = toNumber(row?.AllIndex);
  if (bidCount >= 20 || index >= 1000) return "高";
  if (bidCount >= 5 || index >= 200) return "中";
  if (bidCount > 0 || index > 0) return "低";
  return "";
}

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`请求超过 ${Math.round(SOURCE_TIMEOUT_MS / 1000)} 秒未响应`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatResponse(data: unknown) {
  if (typeof data === "string") return data.slice(0, 300);
  return JSON.stringify(data).slice(0, 300);
}
