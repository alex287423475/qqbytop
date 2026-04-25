import { NextRequest, NextResponse } from "next/server";
import { getAiEnvForChild, getAiRoleConfig } from "@/lib/pipeline-ai-config";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

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

function makeCandidate(seed: string, modifier: string, existingSlugs: Set<string>, existingKeywords: Set<string>): KeywordCandidate {
  const scenario = inferScenario(seed);
  const normalizedModifier = seed.endsWith("翻译") && modifier.startsWith("翻译") ? modifier.slice("翻译".length) : modifier;
  const keyword = normalizedModifier ? `${seed}${normalizedModifier.startsWith(seed) ? normalizedModifier.slice(seed.length) : normalizedModifier}` : seed;
  const slug = generateResearchSlug(keyword);
  const duplicate = existingSlugs.has(slug) || existingKeywords.has(keyword);
  const intent = inferIntent(keyword);
  const priority = inferPriority(keyword);
  const contentMode = inferContentMode(keyword, scenario.category);

  return {
    keyword,
    slug,
    locale: "zh",
    category: scenario.category,
    intent,
    priority,
    contentMode,
    source: "本地规则扩展",
    reason: duplicate ? "关键词文件中已存在或 slug 重复" : `围绕“${seed}”扩展${intent}型长尾词`,
    score: scoreKeyword(keyword, duplicate),
    duplicate,
  };
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
  };
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

function createLocalCandidates(seeds: string[], existingSlugs: Set<string>, existingKeywords: Set<string>) {
  const candidates = new Map<string, KeywordCandidate>();

  for (const seed of seeds) {
    const scenario = inferScenario(seed);
    const modifiers = Array.from(new Set([...scenario.modifiers, ...universalModifiers]));
    for (const modifier of modifiers) {
      const candidate = makeCandidate(seed, modifier, existingSlugs, existingKeywords);
      candidates.set(candidate.slug, candidate);
    }
  }

  return Array.from(candidates.values());
}

async function createAiCandidates(seeds: string[], limit: number, existingRows: Array<{ keyword: string; slug: string }>) {
  const config = getAiRoleConfig("modelC");
  if (config.provider === "mock") return { rows: [], warning: "模型C当前为 Mock，本次使用本地规则兜底。" };
  if (!config.apiKeySet) return { rows: [], warning: "模型C未配置 API Key，本次使用本地规则兜底。" };

  const env = getAiEnvForChild("modelC");
  const text = await callModelC(
    {
      provider: env.AI_PROVIDER,
      baseUrl: env.LLM_BASE_URL,
      model: env.LLM_MODEL,
      apiKey: env.LLM_API_KEY,
    },
    buildKeywordResearchSystemPrompt(),
    buildKeywordResearchUserPrompt(seeds, limit, existingRows),
  );

  const parsed = parseJsonPayload(text);
  const rawRows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  return { rows: rawRows as AiKeywordCandidate[], warning: "" };
}

function buildKeywordResearchSystemPrompt() {
  return [
    "你是北京全球博译翻译公司的 SEO 关键词策略师。",
    "你的任务是为翻译服务网站挖掘可转化、可写深度内容的中文关键词。",
    "优先考虑：询价词、比较词、风险词、办理流程词、合规标准词、核心事实源选题。",
    "不要生成宽泛空洞词，不要把 QQBY 单独作为关键词。",
    "只返回 JSON，不要 Markdown，不要解释。",
  ].join("\n");
}

function buildKeywordResearchUserPrompt(seeds: string[], limit: number, existingRows: Array<{ keyword: string; slug: string }>) {
  const existing = existingRows
    .slice(0, 160)
    .map((row) => `${row.keyword} (${row.slug})`)
    .join("\n");

  return JSON.stringify(
    {
      task: "根据种子词扩展 SEO 候选关键词",
      seeds,
      limit,
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
  if (config.provider === "openai" || config.provider === "deepseek") {
    const endpoint = resolveOpenAICompatibleEndpoint(config.baseUrl || defaultBaseUrl(config.provider));
    const body = buildOpenAICompatibleBody(endpoint.type, config.model, systemPrompt, userPrompt, 0.25, 3000);
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(config.apiKey, endpoint.type),
      body: JSON.stringify(body),
    });
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`${config.provider} request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText(config.provider, data);
  }

  if (config.provider === "gemini") {
    const response = await fetch(resolveGeminiUrl(config.baseUrl, config.model, config.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 3000 },
      }),
    });
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`gemini request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText("gemini", data);
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
        max_tokens: 3000,
        temperature: 0.25,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await readJsonOrText(response);
    if (!response.ok) throw new Error(`claude request failed: ${response.status} ${formatResponse(data)}`);
    return requireModelText("claude", data);
  }

  throw new Error(`Unsupported modelC provider: ${config.provider}`);
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

function mergeCandidates(aiRows: KeywordCandidate[], localRows: KeywordCandidate[], limit: number) {
  const merged = new Map<string, KeywordCandidate>();
  for (const row of [...aiRows, ...localRows]) {
    const previous = merged.get(row.slug);
    if (!previous || row.score > previous.score || (previous.source !== "模型C语义挖掘" && row.source === "模型C语义挖掘")) {
      merged.set(row.slug, row);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => Number(a.duplicate) - Number(b.duplicate) || b.score - a.score || a.keyword.localeCompare(b.keyword, "zh-Hans-CN"))
    .slice(0, limit);
}

export async function POST(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as { seeds?: string; limit?: number };
  const seeds = normalizeSeedText(body.seeds || "");
  if (seeds.length === 0) {
    return NextResponse.json({ message: "请至少输入一个种子词。" }, { status: 400 });
  }

  const existingRows = readKeywordRows();
  const existingSlugs = new Set(existingRows.map((row) => row.slug));
  const existingKeywords = new Set(existingRows.map((row) => row.keyword));
  const limit = Math.max(1, Math.min(100, Number(body.limit) || 40));
  const localCandidates = createLocalCandidates(seeds, existingSlugs, existingKeywords);

  let aiCandidates: KeywordCandidate[] = [];
  let warning = "";
  let engine: "modelC" | "local-rules" | "modelC+local-rules" = "local-rules";

  try {
    const ai = await createAiCandidates(seeds, limit, existingRows);
    warning = ai.warning;
    aiCandidates = ai.rows.map((row) => normalizeAiCandidate(row, existingSlugs, existingKeywords)).filter((row): row is KeywordCandidate => row !== null);
    if (aiCandidates.length > 0) engine = "modelC+local-rules";
  } catch (error) {
    warning = `模型C调用失败，已使用本地规则兜底：${error instanceof Error ? error.message : "未知错误"}`;
  }

  const rows = mergeCandidates(aiCandidates, localCandidates, limit);

  return NextResponse.json({
    seeds,
    engine,
    warning,
    candidates: rows,
    summary: {
      total: rows.length,
      available: rows.filter((row) => !row.duplicate).length,
      duplicates: rows.filter((row) => row.duplicate).length,
      ai: rows.filter((row) => row.source === "模型C语义挖掘").length,
      local: rows.filter((row) => row.source === "本地规则扩展").length,
    },
  });
}
