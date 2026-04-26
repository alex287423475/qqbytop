import { NextRequest, NextResponse } from "next/server";
import { getAiEnvForChild, getAiRoleConfig } from "@/lib/pipeline-ai-config";
import { collectKeywordSourceItems, type KeywordSourceItem } from "@/lib/pipeline-keyword-sources";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

const MODEL_C_KEYWORD_TIMEOUT_MS = 30000;

type KeywordCandidate = {
  keyword: string;
  slug: string;
  locale: "zh";
  category: string;
  intent: string;
  priority: "P0" | "P1" | "P2";
  contentMode: "standard" | "fact-source";
  source: string;
  reason: string;
  score: number;
  duplicate: boolean;
  searchVolume?: string;
  competition?: string;
  difficulty?: string;
};

type DedupeResult = {
  rows: KeywordCandidate[];
  semanticGroups: number;
  semanticRemoved: number;
};

type AiKeywordCandidate = Partial<Omit<KeywordCandidate, "locale" | "duplicate">> & {
  keyword?: string;
};

const scenarioMap = [
  {
    match: ["证件", "出生", "户口", "学历", "签证", "驾照", "成绩单"],
    category: "证件翻译",
    modifiers: ["多少钱", "需要盖章吗", "去哪翻译", "注意事项", "多久能出", "模板", "公证认证"],
  },
  {
    match: ["合同", "协议", "法律", "诉讼", "律师", "仲裁"],
    category: "法律翻译",
    modifiers: ["价格", "注意事项", "怎么保证准确", "需要资质吗", "风险点", "交付标准"],
  },
  {
    match: ["说明书", "手册", "设备", "机械", "电气", "技术", "安装"],
    category: "技术翻译",
    modifiers: ["翻译标准", "术语怎么统一", "价格", "注意事项", "常见错误", "交付流程"],
  },
  {
    match: ["亚马逊", "listing", "POA", "申诉", "chargeback", "拒付", "跨境"],
    category: "跨境电商",
    modifiers: ["翻译注意事项", "证据怎么翻译", "申诉材料翻译", "常见失败原因", "合规标准", "案例"],
    factSource: true,
  },
  {
    match: ["专利", "知识产权", "说明书摘要", "权利要求"],
    category: "专利翻译",
    modifiers: ["为什么不能机翻", "注意事项", "术语一致性", "价格", "审校标准", "常见错误"],
  },
  {
    match: ["医学", "病历", "论文", "药品", "临床"],
    category: "医学翻译",
    modifiers: ["注意事项", "术语标准", "价格", "怎么审校", "隐私保密", "常见错误"],
  },
];

const universalModifiers = ["价格", "报价", "公司怎么选", "流程", "需要注意什么", "常见问题", "交付标准", "质量怎么判断"];

const slugTokens: Array<[RegExp, string]> = [
  [/北京全球博译翻译公司/g, "beijing-qqby-translation-company"],
  [/北京/g, "beijing"],
  [/全球博译/g, "qqby"],
  [/证件/g, "certificate"],
  [/出生证明/g, "birth-certificate"],
  [/户口本/g, "hukou"],
  [/学历/g, "degree"],
  [/签证/g, "visa"],
  [/驾照/g, "driver-license"],
  [/成绩单/g, "transcript"],
  [/合同/g, "contract"],
  [/协议/g, "agreement"],
  [/法律/g, "legal"],
  [/诉讼/g, "litigation"],
  [/律师/g, "lawyer"],
  [/仲裁/g, "arbitration"],
  [/说明书/g, "manual"],
  [/用户手册/g, "user-manual"],
  [/手册/g, "manual"],
  [/设备/g, "equipment"],
  [/机械/g, "machinery"],
  [/电气/g, "electrical"],
  [/技术/g, "technical"],
  [/安装/g, "installation"],
  [/亚马逊/g, "amazon"],
  [/申诉/g, "appeal"],
  [/拒付/g, "chargeback"],
  [/跨境电商/g, "cross-border-ecommerce"],
  [/跨境/g, "cross-border"],
  [/证据/g, "evidence"],
  [/材料/g, "documents"],
  [/专利/g, "patent"],
  [/知识产权/g, "ip"],
  [/权利要求/g, "claims"],
  [/医学/g, "medical"],
  [/病历/g, "medical-record"],
  [/论文/g, "paper"],
  [/药品/g, "drug"],
  [/临床/g, "clinical"],
  [/翻译公司/g, "translation-company"],
  [/翻译/g, "translation"],
  [/多少钱/g, "cost"],
  [/价格/g, "price"],
  [/报价/g, "quote"],
  [/费用/g, "cost"],
  [/收费/g, "fee"],
  [/去哪翻译/g, "where-to-translate"],
  [/翻译标准/g, "translation-standard"],
  [/需要盖章吗/g, "stamp-required"],
  [/注意事项/g, "tips"],
  [/需要注意什么/g, "tips"],
  [/多久能出/g, "turnaround-time"],
  [/模板/g, "template"],
  [/公证认证/g, "notarization-certification"],
  [/公证/g, "notarization"],
  [/认证/g, "certification"],
  [/怎么保证准确/g, "accuracy"],
  [/需要资质吗/g, "qualification"],
  [/风险点/g, "risks"],
  [/风险/g, "risks"],
  [/交付标准/g, "delivery-standard"],
  [/标准/g, "standard"],
  [/术语怎么统一/g, "terminology-consistency"],
  [/术语一致性/g, "terminology-consistency"],
  [/常见错误/g, "common-mistakes"],
  [/常见失败原因/g, "failure-reasons"],
  [/质量怎么判断/g, "quality-check"],
  [/怎么选/g, "how-to-choose"],
  [/流程/g, "process"],
  [/常见问题/g, "faq"],
  [/合规/g, "compliance"],
  [/案例/g, "case-study"],
  [/为什么不能机翻/g, "no-machine-translation"],
  [/机翻/g, "machine-translation"],
  [/审校/g, "review"],
  [/隐私保密/g, "confidentiality"],
];

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Keyword research is disabled in production." }, { status: 403 });
  }

  return null;
}

function normalizeSeedText(value: string) {
  return value
    .split(/[\n,，、；;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferScenario(seed: string) {
  return (
    scenarioMap.find((scenario) => scenario.match.some((word) => seed.toLowerCase().includes(word.toLowerCase()))) || {
      category: "专业翻译",
      modifiers: universalModifiers,
    }
  );
}

function inferIntent(keyword: string) {
  if (/(多少钱|价格|报价|费用|收费)/u.test(keyword)) return "询价";
  if (/(怎么选|哪家好|对比|公司)/u.test(keyword)) return "比较";
  if (/(风险|错误|失败|不能|注意)/u.test(keyword)) return "风险";
  if (/(流程|办理|多久|去哪|怎么)/u.test(keyword)) return "办理";
  if (/(标准|质量|术语|审校|合规)/u.test(keyword)) return "合规";
  return "信息";
}

function inferPriority(keyword: string): "P0" | "P1" | "P2" {
  if (/(报价|价格|多少钱|费用|公司怎么选|去哪翻译)/u.test(keyword)) return "P0";
  if (/(注意事项|风险|标准|流程|失败原因|合规)/u.test(keyword)) return "P1";
  return "P2";
}

function inferContentMode(keyword: string, category: string): "standard" | "fact-source" {
  if (/(拒付|Chargeback|chargeback|申诉|证据链|合规|白皮书|标准|数据|案例|事实源)/u.test(keyword)) return "fact-source";
  if (category === "跨境电商" && /(证据|失败|规则|争议)/u.test(keyword)) return "fact-source";
  return "standard";
}

function scoreKeyword(keyword: string, duplicate: boolean, source = "local") {
  let score = source === "ai" ? 68 : 60;
  if (/(多少钱|价格|报价|费用|去哪翻译|公司怎么选)/u.test(keyword)) score += 20;
  if (/(注意事项|风险|失败原因|合规|标准|证据链|案例)/u.test(keyword)) score += 14;
  if (keyword.length >= 8 && keyword.length <= 28) score += 8;
  if (duplicate) score -= 50;
  return Math.max(0, Math.min(100, score));
}

function normalizeAiCandidate(
  row: AiKeywordCandidate,
  existingSlugs: Set<string>,
  existingKeywords: Set<string>,
): KeywordCandidate | null {
  const keyword = String(row.keyword || "").trim();
  if (!keyword || keyword.length < 3 || keyword.length > 40) return null;

  const category = normalizeCategory(String(row.category || inferScenario(keyword).category));
  const intent = normalizeIntent(String(row.intent || inferIntent(keyword)));
  const priority = normalizePriority(String(row.priority || inferPriority(keyword)));
  const contentMode = normalizeContentMode(String(row.contentMode || inferContentMode(keyword, category)));
  const slug = generateResearchSlug(String(row.slug || keyword));
  const duplicate = existingSlugs.has(slug) || existingKeywords.has(keyword);
  const score = Number.isFinite(Number(row.score)) ? Math.round(Number(row.score)) : scoreKeyword(keyword, duplicate, "ai");

  return {
    keyword,
    slug,
    locale: "zh",
    category,
    intent,
    priority,
    contentMode,
    source: "模型C语义挖掘",
    reason: String(row.reason || "模型C基于种子词、已有关键词和翻译业务场景生成。").slice(0, 160),
    score: Math.max(0, Math.min(100, duplicate ? Math.min(score, 45) : score)),
    duplicate,
    searchVolume: stringifyMetric((row as any).searchVolume),
    competition: String((row as any).competition || "").trim(),
    difficulty: String((row as any).difficulty || "").trim(),
  };
}

function stringifyMetric(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  return String(value).trim();
}

function enrichCandidateFromSource(row: KeywordCandidate, sourceItems: KeywordSourceItem[]) {
  const source = sourceItems.find((item) => normalizeKeywordForLookup(item.keyword) === normalizeKeywordForLookup(row.keyword));
  if (!source) return row;

  return {
    ...row,
    source: source.source,
    searchVolume: stringifyMetric(row.searchVolume || source.searchVolume || source.index || ""),
    competition: row.competition || source.competition || "",
    difficulty: row.difficulty || source.difficulty || "",
  };
}

function normalizeKeywordForLookup(value: string) {
  return value.toLowerCase().replace(/\s+/gu, "");
}

function normalizeCategory(value: string) {
  const allowed = ["翻译价格", "证件翻译", "法律翻译", "专业翻译", "跨境电商", "法律合规", "技术本地化", "翻译质量", "跨境合规", "技术翻译", "专利翻译", "医学翻译"];
  return allowed.includes(value) ? value : inferScenario(value).category;
}

function normalizeIntent(value: string) {
  const allowed = ["询价", "信息", "比较", "办理", "风险", "合规"];
  return allowed.includes(value) ? value : "信息";
}

function normalizePriority(value: string): "P0" | "P1" | "P2" {
  if (value === "P0" || value === "P1" || value === "P2") return value;
  return "P1";
}

function normalizeContentMode(value: string): "standard" | "fact-source" {
  return value === "fact-source" || value === "核心事实源" ? "fact-source" : "standard";
}

function generateResearchSlug(keyword: string) {
  let value = keyword.trim();
  value = value.replace(/去哪翻译/gu, " where-to-translate ").replace(/翻译标准/gu, " translation-standard ");
  for (const [pattern, replacement] of slugTokens) {
    value = value.replace(pattern, ` ${replacement} `);
  }

  const slug = value
    .toLowerCase()
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-")
    .slice(0, 90)
    .replace(/-+$/gu, "");

  return slug || `keyword-${Date.now().toString(36)}`;
}

async function createAiCandidates(
  seeds: string[],
  limit: number,
  existingRows: Array<{ keyword: string; slug: string }>,
  sourceItems: KeywordSourceItem[],
) {
  const config = getAiRoleConfig("modelC");
  if (config.provider === "mock") throw new Error("模型C当前为 Mock，请先在 AI 模型配置中设置可用模型C。");
  if (!config.apiKeySet) throw new Error("模型C未配置 API Key。");

  const env = getAiEnvForChild("modelC");
  const text = await callModelC(
    {
      provider: env.AI_PROVIDER,
      baseUrl: env.LLM_BASE_URL,
      model: env.LLM_MODEL,
      apiKey: env.LLM_API_KEY,
    },
    buildKeywordResearchSystemPrompt(),
    buildKeywordResearchUserPrompt(seeds, limit, existingRows, sourceItems),
  );

  const parsed = parseJsonPayload(text);
  const rawRows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  if (rawRows.length === 0) throw new Error("模型C没有返回任何候选关键词。");
  return rawRows as AiKeywordCandidate[];
}

function buildKeywordResearchSystemPrompt() {
  return [
    "你是北京全球博译翻译公司的 SEO 关键词策略师。",
    "你的任务是为翻译服务网站挖掘可转化、可写深度内容的中文关键词。",
    "优先考虑：询价词、比较词、风险词、办理流程词、合规标准词、核心事实源选题。",
    "同一搜索意图不要重复输出近义词，例如“价格/报价/费用/多少钱”只能保留一个最适合作为主关键词的表达。",
    "不要生成宽泛空洞词，不要把 QQBY 单独作为关键词。",
    "只返回 JSON，不要 Markdown，不要解释。",
  ].join("\n");
}

function buildKeywordResearchUserPrompt(
  seeds: string[],
  limit: number,
  existingRows: Array<{ keyword: string; slug: string }>,
  sourceItems: KeywordSourceItem[],
) {
  const existing = existingRows
    .slice(0, 160)
    .map((row) => `${row.keyword} (${row.slug})`)
    .join("\n");

  return JSON.stringify(
    {
      task: "根据种子词扩展 SEO 候选关键词",
      seeds,
      limit,
      rules: [
        "只允许从 sourceKeywords 中挑选和轻微整理，不要凭空生成新关键词。",
        "相同搜索意图只保留一个主关键词。",
        "优先保留有搜索量、竞价、竞争度或更强转化意图的关键词。",
        "source、searchVolume、competition、difficulty 字段要尽量沿用 sourceKeywords 的数据。",
      ],
      sourceKeywords: sourceItems.slice(0, 240),
      business: "北京全球博译翻译公司，服务企业客户与个人客户，重点业务包括证件翻译、法律翻译、技术文档翻译、跨境电商翻译、法律合规翻译。",
      existingKeywords: existing,
      outputSchema: {
        candidates: [
          {
            keyword: "中文关键词",
            slug: "英文小写短横线URL",
            category: "翻译价格|证件翻译|法律翻译|专业翻译|跨境电商|法律合规|技术本地化|翻译质量|跨境合规|技术翻译|专利翻译|医学翻译",
            intent: "询价|信息|比较|办理|风险|合规",
            priority: "P0|P1|P2",
            contentMode: "standard|fact-source",
            source: "5118下拉词|站长工具百度长尾词|5118下拉词+站长工具百度长尾词",
            searchVolume: "数字或空字符串",
            competition: "竞价竞争度或空字符串",
            difficulty: "高|中|低|空字符串",
            score: "0-100",
            reason: "为什么值得写，控制在60字内",
          },
        ],
      },
    },
    null,
    2,
  );
}

async function callModelC(
  config: { provider: string; baseUrl: string; model: string; apiKey: string },
  systemPrompt: string,
  userPrompt: string,
) {
  if (config.provider === "deepseek" && /api\.deepseek\.cc/iu.test(config.baseUrl || "")) {
    throw new Error("DeepSeek 官方接口地址是 https://api.deepseek.com/v1；当前配置的 api.deepseek.cc 无法稳定连接，请先修正模型C Base URL。");
  }

  if (config.provider === "openai" || config.provider === "deepseek") {
    const endpoint = resolveOpenAICompatibleEndpoint(config.baseUrl || defaultBaseUrl(config.provider));
    const body = buildOpenAICompatibleBody(endpoint.type, config.model, systemPrompt, userPrompt, 0.25, 3000);
    if (endpoint.type === "chat") {
      const streamText = await fetchTextWithTimeout(endpoint.url, {
        method: "POST",
        headers: buildOpenAICompatibleHeaders(config.apiKey, endpoint.type),
        body: JSON.stringify({ ...body, stream: true }),
      }, MODEL_C_KEYWORD_TIMEOUT_MS);
      const streamedContent = parseOpenAICompatibleStream(streamText);
      if (streamedContent) return streamedContent;
    }

    const response = await fetchWithTimeout(endpoint.url, {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(config.apiKey, endpoint.type),
      body: JSON.stringify(body),
    }, MODEL_C_KEYWORD_TIMEOUT_MS);
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`${config.provider} request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText(config.provider, data);
  }

  if (config.provider === "gemini") {
    const response = await fetchWithTimeout(resolveGeminiUrl(config.baseUrl, config.model, config.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 3000 },
      }),
    }, MODEL_C_KEYWORD_TIMEOUT_MS);
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`gemini request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText("gemini", data);
  }

  if (config.provider === "claude") {
    const response = await fetchWithTimeout(resolveClaudeUrl(config.baseUrl || "https://api.anthropic.com/v1/messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 3000,
        temperature: 0.25,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    }, MODEL_C_KEYWORD_TIMEOUT_MS);
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`claude request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText("claude", data);
  }

  throw new Error(`Unsupported modelC provider: ${config.provider}`);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`模型C请求超过 ${Math.round(timeoutMs / 1000)} 秒未响应`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`request failed: ${response.status} ${text.slice(0, 500)}`);
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`模型C请求超过 ${Math.round(timeoutMs / 1000)} 秒未响应`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
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

function buildOpenAICompatibleBody(type: "chat" | "messages" | "responses", model: string, system: string, user: string, temperature: number, maxTokens: number) {
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
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}

function defaultBaseUrl(provider: string) {
  if (provider === "deepseek") return "https://api.deepseek.com/v1/chat/completions";
  return "https://api.openai.com/v1/chat/completions";
}

function resolveGeminiUrl(baseUrl: string, model: string, apiKey: string) {
  if (baseUrl && baseUrl.includes(":generateContent")) return baseUrl.includes("?") ? baseUrl : `${baseUrl}?key=${encodeURIComponent(apiKey)}`;
  const root = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/u, "");
  return `${root}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function resolveClaudeUrl(url: string) {
  const trimmed = url.replace(/\/+$/u, "");
  if (trimmed.endsWith("/messages")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/messages`;
  return `${trimmed}/v1/messages`;
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
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text;
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
  throw new Error(`${provider} returned empty content. ${formatResponse(data)}`);
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

  const contentChunks: string[] = [];
  const fallbackChunks: string[] = [];
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const data = JSON.parse(payload);
      const choice = data.choices?.[0];
      const textPart = extractTextPart(choice?.delta?.content) || extractTextPart(choice?.message?.content) || extractTextPart(choice?.text);
      const reasoningPart = extractTextPart(choice?.delta?.reasoning_content);
      if (textPart) contentChunks.push(textPart);
      if (reasoningPart) fallbackChunks.push(reasoningPart);
    } catch {
      // Compatible gateways can emit non-JSON keep-alive lines.
    }
  }

  return contentChunks.join("").trim() || fallbackChunks.join("").trim();
}

function parseJsonPayload(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/iu, "")
    .replace(/```$/u, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/u);
    if (!match) throw new Error("模型C返回内容不是可解析的 JSON。");
    return JSON.parse(match[1]);
  }
}

function formatResponse(data: unknown) {
  if (typeof data === "string") return data.slice(0, 500);
  return JSON.stringify(data).slice(0, 500);
}

function dedupeSemanticCandidates(rows: KeywordCandidate[], limit: number): DedupeResult {
  const groups = new Map<string, KeywordCandidate[]>();

  for (const row of rows) {
    const key = createSemanticKey(row);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }

  const kept: KeywordCandidate[] = [];
  let semanticRemoved = 0;
  let semanticGroups = 0;

  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => {
      if (a.duplicate !== b.duplicate) return Number(a.duplicate) - Number(b.duplicate);
      return b.score - a.score || a.keyword.length - b.keyword.length;
    });
    const winner = sorted[0];
    const removed = sorted.slice(1);
    if (removed.length > 0) {
      semanticGroups += 1;
      semanticRemoved += removed.length;
      kept.push({
        ...winner,
        reason: `${winner.reason}；已归并相似词：${removed.map((item) => item.keyword).slice(0, 4).join("、")}`,
      });
    } else {
      kept.push(winner);
    }
  }

  return {
    rows: kept
      .sort((a, b) => Number(a.duplicate) - Number(b.duplicate) || b.score - a.score || a.keyword.localeCompare(b.keyword, "zh-Hans-CN"))
      .slice(0, limit),
    semanticGroups,
    semanticRemoved,
  };
}

function createSemanticKey(row: KeywordCandidate) {
  return [row.category, row.intent, normalizeKeywordTopic(row.keyword)].join("|");
}

function normalizeKeywordTopic(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[，,。.!！?？\s]/gu, "")
    .replace(/北京全球博译翻译公司/gu, "翻译公司")
    .replace(/一般|大概|通常|如何|怎么|怎样|需要|什么/gu, "")
    .replace(/多少钱|多少费用|价格|报价|费用|收费|价钱|一页多少钱|每页多少钱/gu, "{price}")
    .replace(/公司怎么选|哪家好|哪家靠谱|怎么选择|如何选择|推荐|对比/gu, "{choose}")
    .replace(/注意事项|要注意|避坑|风险点|风险|常见错误|错误|问题/gu, "{risk}")
    .replace(/流程|办理流程|怎么办理|多久能出|周期|交付时间/gu, "{process}")
    .replace(/标准|交付标准|质量标准|合规标准|规范|要求/gu, "{standard}")
    .replace(/常见问题|faq|问答/gu, "{faq}")
    .replace(/公证认证|认证公证/gu, "{notarization}")
    .replace(/盖章|翻译章|公司章/gu, "{stamp}")
    .replace(/机器翻译|机翻|自动翻译/gu, "{mt}")
    .replace(/翻译服务|专业翻译服务/gu, "翻译")
    .replace(/(.)\1{2,}/gu, "$1$1");
}

function uniquifyCandidateSlugs(rows: KeywordCandidate[], existingSlugs: Set<string>, existingKeywords: Set<string>) {
  const used = new Set(existingSlugs);

  return rows.map((row) => {
    const keywordExists = existingKeywords.has(row.keyword);
    if (keywordExists) return { ...row, duplicate: true, score: Math.min(row.score, 45) };

    const baseSlug = row.slug || generateResearchSlug(row.keyword);
    let slug = baseSlug;
    let index = 2;
    while (used.has(slug)) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }
    used.add(slug);

    return {
      ...row,
      slug,
      duplicate: false,
      reason: slug === row.slug ? row.reason : `${row.reason}；slug 已自动避让重复：${slug}`,
    };
  });
}

export async function POST(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as { seeds?: string; limit?: number; use5118?: boolean; useChinaz?: boolean };
  const seeds = normalizeSeedText(body.seeds || "");
  if (seeds.length === 0) {
    return NextResponse.json({ message: "请至少输入一个种子词。" }, { status: 400 });
  }

  const existingRows = readKeywordRows();
  const existingSlugs = new Set(existingRows.map((row) => row.slug));
  const existingKeywords = new Set(existingRows.map((row) => row.keyword));
  const limit = Math.max(1, Math.min(100, Number(body.limit) || 40));
  const sourceResult = await collectKeywordSourceItems(seeds, { use5118: body.use5118, useChinaz: body.useChinaz });

  if (sourceResult.items.length === 0) {
    return NextResponse.json(
      {
        message: sourceResult.errors.length > 0 ? sourceResult.errors.join("\n") : "5118 和站长工具都没有返回可用候选词，请检查 API 配置或更换种子词。",
        seeds,
        logs: sourceResult.logs,
        errors: sourceResult.errors,
      },
      { status: 400 },
    );
  }

  let rows: KeywordCandidate[] = [];
  let semanticGroups = 0;
  let semanticRemoved = 0;
  try {
    const aiRows = await createAiCandidates(seeds, limit, existingRows, sourceResult.items);
    const normalizedRows = aiRows
      .map((row) => normalizeAiCandidate(row, existingSlugs, existingKeywords))
      .filter((row): row is KeywordCandidate => row !== null)
      .map((row) => enrichCandidateFromSource(row, sourceResult.items))
      .sort((a, b) => Number(a.duplicate) - Number(b.duplicate) || b.score - a.score || a.keyword.localeCompare(b.keyword, "zh-Hans-CN"));
    const deduped = dedupeSemanticCandidates(normalizedRows, limit);
    rows = uniquifyCandidateSlugs(deduped.rows, existingSlugs, existingKeywords);
    semanticGroups = deduped.semanticGroups;
    semanticRemoved = deduped.semanticRemoved;
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    const status = message.includes("超过") || message.toLowerCase().includes("timeout") ? 504 : 400;
    return NextResponse.json({ message: `模型C调用失败：${message}`, seeds }, { status });
  }

  if (rows.length === 0) {
    return NextResponse.json({ message: "模型C返回内容无法转换为有效候选关键词。", seeds }, { status: 400 });
  }

  return NextResponse.json({
    seeds,
    engine: "modelC",
    warning: "",
    logs: sourceResult.logs,
    errors: sourceResult.errors,
    candidates: rows,
    summary: {
      total: rows.length,
      available: rows.filter((row) => !row.duplicate).length,
      duplicates: rows.filter((row) => row.duplicate).length,
      ai: rows.filter((row) => row.source === "模型C语义挖掘").length,
      sourceItems: sourceResult.items.length,
      source5118: sourceResult.items.filter((row) => row.source.includes("5118")).length,
      sourceChinaz: sourceResult.items.filter((row) => row.source.includes("站长工具")).length,
      local: 0,
      semanticGroups,
      semanticRemoved,
    },
  });
}
