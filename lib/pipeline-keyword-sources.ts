import { getKeywordSourceConfig, getKeywordSourceSecrets, type KeywordResearchDepth } from "@/lib/pipeline-keyword-source-config";

export type KeywordSourceRequest = {
  platforms?: string[];
  depth?: KeywordResearchDepth;
  suggestLimitPerPlatform?: number;
  expandTopN?: number;
  longTailPageSize?: number;
  metricLimit?: number;
};

export type KeywordSourceItem = {
  keyword: string;
  source: string;
  platforms?: string[];
  stage: "suggest" | "longtail";
  searchVolume?: number;
  pcSearchVolume?: number;
  mobileSearchVolume?: number;
  index?: number;
  mobileIndex?: number;
  douyinIndex?: number;
  semPrice?: number | string;
  competition?: string;
  difficulty?: string;
  pageCount?: number;
  longKeywordCount?: number;
  bidwordCompanyCount?: number;
  features?: string;
};

export type KeywordSourceResult = {
  items: KeywordSourceItem[];
  logs: string[];
  errors: string[];
  stats: {
    suggestCalls: number;
    longTailCalls: number;
    metricKeywords: number;
    metricCompleted: boolean;
  };
};

const SOURCE_TIMEOUT_MS = 20000;

export async function collectKeywordSourceItems(seeds: string[], request: KeywordSourceRequest): Promise<KeywordSourceResult> {
  const config = getKeywordSourceConfig().source5118;
  const secrets = getKeywordSourceSecrets();
  const logs: string[] = [];
  const errors: string[] = [];
  const stats = { suggestCalls: 0, longTailCalls: 0, metricKeywords: 0, metricCompleted: false };

  if (!config.enabled) {
    return { items: [], logs, errors: ["5118 关键词数据源未启用。"], stats };
  }

  if (!secrets.source5118ApiKey) {
    return { items: [], logs, errors: ["5118 API Key 未配置。"], stats };
  }

  const depth = request.depth || config.defaultDepth;
  const platforms = normalizePlatforms(request.platforms || config.platforms);
  const suggestLimit = clampNumber(request.suggestLimitPerPlatform, 1, 100, config.suggestLimitPerPlatform);
  const expandTopN = clampNumber(request.expandTopN, 0, 50, config.expandTopN);
  const longTailPageSize = clampNumber(request.longTailPageSize, 1, 100, config.longTailPageSize);
  const metricLimit = clampNumber(request.metricLimit, 0, 200, config.metricLimit);
  const apiKey = secrets.source5118ApiKey;

  const suggestItems: KeywordSourceItem[] = [];
  for (const seed of seeds) {
    for (const platform of platforms) {
      try {
        const nextItems = await fetch5118Suggest(seed, {
          endpoint: config.suggestEndpoint,
          platform,
          apiKey,
          limit: suggestLimit,
        });
        stats.suggestCalls += 1;
        suggestItems.push(...nextItems);
        logs.push(`5118 下拉词：${seed} / ${platform} 返回 ${nextItems.length} 个候选词。`);
      } catch (error) {
        errors.push(`5118 下拉词：${seed} / ${platform} 请求失败，${formatError(error)}`);
      }
    }
  }

  let mergedItems = mergeSourceItems(suggestItems);

  if (depth === "longtail" || depth === "full") {
    const expansionSeeds = rankForExpansion(mergedItems).slice(0, expandTopN);
    const longTailItems: KeywordSourceItem[] = [];
    for (const item of expansionSeeds) {
      try {
        const nextItems = await fetch5118LongTail(item.keyword, {
          endpoint: config.longTailEndpoint,
          apiKey,
          pageSize: longTailPageSize,
        });
        stats.longTailCalls += 1;
        longTailItems.push(...nextItems);
        logs.push(`5118 长尾扩展：${item.keyword} 返回 ${nextItems.length} 个候选词。`);
      } catch (error) {
        errors.push(`5118 长尾扩展：${item.keyword} 请求失败，${formatError(error)}`);
      }
    }
    mergedItems = mergeSourceItems([...mergedItems, ...longTailItems]);
  }

  if (depth === "full" && metricLimit > 0 && mergedItems.length > 0) {
    const metricTargets = rankForMetrics(mergedItems).slice(0, metricLimit);
    try {
      const metrics = await fetch5118KeywordMetrics(
        metricTargets.map((item) => item.keyword),
        {
          endpoint: config.metricsEndpoint,
          apiKey,
          pollSeconds: config.metricPollSeconds,
        },
      );
      stats.metricKeywords = metricTargets.length;
      stats.metricCompleted = metrics.completed;
      mergedItems = mergeSourceItems(mergeMetrics(mergedItems, metrics.items));
      logs.push(metrics.completed ? `5118 指标补全：已补充 ${metrics.items.length} 个关键词指标。` : `5118 指标补全：任务仍在采集中，已返回 ${metrics.items.length} 条可用指标。`);
      if (!metrics.completed) {
        errors.push("5118 keywordparam/v2 指标任务仍在采集中，本次先返回下拉词和长尾词结果。");
      }
    } catch (error) {
      errors.push(`5118 指标补全失败，${formatError(error)}`);
    }
  }

  return { items: mergedItems, logs, errors, stats };
}

async function fetch5118Suggest(
  seed: string,
  config: { endpoint: string; platform: string; apiKey: string; limit: number },
): Promise<KeywordSourceItem[]> {
  const body = new URLSearchParams({ word: seed, platform: config.platform });
  const response = await fetchWithTimeout(config.endpoint, {
    method: "POST",
    headers: buildHeaders(config.apiKey),
    body,
  });
  const payload = await readJsonOrText(response);
  assert5118Ok(response, payload);

  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .map((row: any) => ({
      keyword: String(row?.promote_word || row?.keyword || row?.word || "").trim(),
      source: "5118下拉词",
      platforms: [String(row?.platform || config.platform)],
      stage: "suggest" as const,
    }))
    .filter((row: KeywordSourceItem) => row.keyword && row.keyword !== seed)
    .slice(0, config.limit);
}

async function fetch5118LongTail(
  keyword: string,
  config: { endpoint: string; apiKey: string; pageSize: number },
): Promise<KeywordSourceItem[]> {
  const body = new URLSearchParams({
    keyword,
    page_index: "1",
    page_size: String(config.pageSize),
    sort_fields: "4",
    sort_type: "desc",
    filter: "1",
  });
  const response = await fetchWithTimeout(config.endpoint, {
    method: "POST",
    headers: buildHeaders(config.apiKey),
    body,
  });
  const payload = await readJsonOrText(response);
  assert5118Ok(response, payload);

  const rows = Array.isArray(payload?.data?.word) ? payload.data.word : [];
  return rows
    .map((row: any) => map5118MetricRow(row, "5118长尾词", "longtail"))
    .filter((row: KeywordSourceItem) => Boolean(row.keyword));
}

async function fetch5118KeywordMetrics(
  keywords: string[],
  config: { endpoint: string; apiKey: string; pollSeconds: number },
): Promise<{ completed: boolean; items: KeywordSourceItem[] }> {
  const chunks = chunk(keywords, 50);
  const allItems: KeywordSourceItem[] = [];
  let completed = true;

  for (const words of chunks) {
    const taskId = await submitKeywordMetricTask(words, config);
    const result = await pollKeywordMetricTask(taskId, config);
    completed = completed && result.completed;
    allItems.push(...result.items);
  }

  return { completed, items: allItems };
}

async function submitKeywordMetricTask(keywords: string[], config: { endpoint: string; apiKey: string }) {
  const response = await fetchWithTimeout(config.endpoint, {
    method: "POST",
    headers: buildHeaders(config.apiKey),
    body: new URLSearchParams({ keywords: keywords.join("|") }),
  });
  const payload = await readJsonOrText(response);
  assert5118Ok(response, payload);
  const taskId = payload?.data?.taskid || payload?.taskid;
  if (!taskId) throw new Error(`keywordparam/v2 未返回 taskid：${formatResponse(payload)}`);
  return String(taskId);
}

async function pollKeywordMetricTask(
  taskId: string,
  config: { endpoint: string; apiKey: string; pollSeconds: number },
): Promise<{ completed: boolean; items: KeywordSourceItem[] }> {
  const started = Date.now();
  const maxMs = Math.max(10, config.pollSeconds) * 1000;
  let lastPayload: any = null;

  while (Date.now() - started <= maxMs) {
    const response = await fetchWithTimeout(config.endpoint, {
      method: "POST",
      headers: buildHeaders(config.apiKey),
      body: new URLSearchParams({ taskid: taskId }),
    });
    const payload = await readJsonOrText(response);
    lastPayload = payload;

    if (String(payload?.errcode ?? "0") === "200104") {
      await sleep(5000);
      continue;
    }

    assert5118Ok(response, payload);
    const rows = Array.isArray(payload?.data?.keyword_param) ? payload.data.keyword_param : [];
    return {
      completed: true,
      items: rows.map((row: any) => map5118MetricRow(row, "5118指标补全", "longtail")).filter((row: KeywordSourceItem) => Boolean(row.keyword)),
    };
  }

  const rows = Array.isArray(lastPayload?.data?.keyword_param) ? lastPayload.data.keyword_param : [];
  return {
    completed: false,
    items: rows.map((row: any) => map5118MetricRow(row, "5118指标补全", "longtail")).filter((row: KeywordSourceItem) => Boolean(row.keyword)),
  };
}

function map5118MetricRow(row: any, source: string, stage: "suggest" | "longtail"): KeywordSourceItem {
  const pcSearchVolume = toNumber(row?.bidword_pcpv);
  const mobileSearchVolume = toNumber(row?.bidword_wisepv);
  const index = toNumber(row?.index);
  const mobileIndex = toNumber(row?.mobile_index);
  const douyinIndex = toNumber(row?.douyin_index);
  return {
    keyword: String(row?.keyword || "").trim(),
    source,
    stage,
    searchVolume: pcSearchVolume + mobileSearchVolume || index || mobileIndex || douyinIndex || undefined,
    pcSearchVolume: pcSearchVolume || undefined,
    mobileSearchVolume: mobileSearchVolume || undefined,
    index: index || undefined,
    mobileIndex: mobileIndex || undefined,
    douyinIndex: douyinIndex || undefined,
    semPrice: row?.sem_price || row?.bidword_price || row?.bidword_recommendprice_max || undefined,
    competition: normalizeCompetition(row?.bidword_kwc),
    difficulty: normalizeCompetition(row?.bidword_kwc),
    longKeywordCount: toNumber(row?.long_keyword_count) || undefined,
    bidwordCompanyCount: toNumber(row?.bidword_company_count) || undefined,
    features: String(row?.sem_reason || row?.bidword_showreasons || "").trim() || undefined,
  };
}

function mergeMetrics(items: KeywordSourceItem[], metrics: KeywordSourceItem[]) {
  const metricMap = new Map(metrics.map((item) => [normalizeKeywordKey(item.keyword), item]));
  return items.map((item) => {
    const metric = metricMap.get(normalizeKeywordKey(item.keyword));
    if (!metric) return item;
    return {
      ...item,
      ...metric,
      source: mergeSourceLabel(item.source, metric.source),
      platforms: item.platforms,
      stage: item.stage,
    };
  });
}

function mergeSourceItems(items: KeywordSourceItem[]) {
  const byKeyword = new Map<string, KeywordSourceItem>();
  for (const item of items) {
    const key = normalizeKeywordKey(item.keyword);
    if (!key) continue;
    const current = byKeyword.get(key);
    if (!current) {
      byKeyword.set(key, item);
      continue;
    }

    byKeyword.set(key, {
      ...current,
      ...item,
      source: mergeSourceLabel(current.source, item.source),
      platforms: Array.from(new Set([...(current.platforms || []), ...(item.platforms || [])])),
      searchVolume: Math.max(current.searchVolume || 0, item.searchVolume || 0) || undefined,
      pcSearchVolume: Math.max(current.pcSearchVolume || 0, item.pcSearchVolume || 0) || undefined,
      mobileSearchVolume: Math.max(current.mobileSearchVolume || 0, item.mobileSearchVolume || 0) || undefined,
      index: Math.max(current.index || 0, item.index || 0) || undefined,
      mobileIndex: Math.max(current.mobileIndex || 0, item.mobileIndex || 0) || undefined,
      douyinIndex: Math.max(current.douyinIndex || 0, item.douyinIndex || 0) || undefined,
      longKeywordCount: Math.max(current.longKeywordCount || 0, item.longKeywordCount || 0) || undefined,
      bidwordCompanyCount: Math.max(current.bidwordCompanyCount || 0, item.bidwordCompanyCount || 0) || undefined,
      competition: item.competition || current.competition,
      difficulty: item.difficulty || current.difficulty,
      features: item.features || current.features,
    });
  }

  return Array.from(byKeyword.values()).sort((a, b) => sourceScore(b) - sourceScore(a) || a.keyword.localeCompare(b.keyword, "zh-Hans-CN"));
}

function rankForExpansion(items: KeywordSourceItem[]) {
  return [...items].sort((a, b) => businessIntentScore(b.keyword) - businessIntentScore(a.keyword) || a.keyword.length - b.keyword.length);
}

function rankForMetrics(items: KeywordSourceItem[]) {
  return [...items].sort((a, b) => sourceScore(b) - sourceScore(a) || businessIntentScore(b.keyword) - businessIntentScore(a.keyword));
}

function sourceScore(item: KeywordSourceItem) {
  return (item.searchVolume || 0) + (item.index || 0) + (item.mobileIndex || 0) + (item.douyinIndex || 0) + businessIntentScore(item.keyword) * 10;
}

function businessIntentScore(keyword: string) {
  let score = 0;
  if (/(价格|报价|费用|多少钱|收费)/u.test(keyword)) score += 9;
  if (/(公司|哪里|哪家|推荐|怎么选)/u.test(keyword)) score += 7;
  if (/(注意事项|风险|错误|失败|标准|合规|盖章|公证|认证)/u.test(keyword)) score += 6;
  if (/(流程|办理|多久|材料|模板)/u.test(keyword)) score += 4;
  return score;
}

function buildHeaders(apiKey: string) {
  return {
    authorization: apiKey,
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  };
}

function assert5118Ok(response: Response, payload: any) {
  if (!response.ok) throw new Error(`${response.status} ${formatResponse(payload)}`);
  const errcode = String(payload?.errcode ?? "0");
  if (errcode !== "0") throw new Error(payload?.errmsg || formatResponse(payload));
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

function normalizeCompetition(value: unknown) {
  const text = String(value || "").trim();
  if (text === "1") return "高";
  if (text === "2") return "中";
  if (text === "3") return "低";
  if (["高", "中", "低"].includes(text)) return text;
  return "";
}

function normalizeKeywordKey(keyword: string) {
  return keyword.toLowerCase().replace(/\s+/gu, "");
}

function normalizePlatforms(value: unknown) {
  const allowed = new Set(["baidu", "baidumobile", "xiaohongshu", "douyin"]);
  const list = Array.isArray(value) ? value : [];
  const platforms = list.map((item) => String(item).trim()).filter((item) => allowed.has(item));
  return platforms.length > 0 ? Array.from(new Set(platforms)) : ["baidu", "baidumobile", "xiaohongshu", "douyin"];
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function toNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeSourceLabel(left: string, right: string) {
  return Array.from(new Set([...left.split("+"), ...right.split("+")].filter(Boolean))).join("+");
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "未知错误";
}

function formatResponse(data: unknown) {
  if (typeof data === "string") return data.slice(0, 300);
  return JSON.stringify(data).slice(0, 300);
}
