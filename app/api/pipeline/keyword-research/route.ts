import { NextRequest, NextResponse } from "next/server";
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
    .split(/[\n,，、;；]+/u)
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

function scoreKeyword(keyword: string, duplicate: boolean) {
  let score = 60;
  if (/(多少钱|价格|报价|费用|去哪翻译|公司怎么选)/u.test(keyword)) score += 20;
  if (/(注意事项|风险|失败原因|合规|标准)/u.test(keyword)) score += 14;
  if (keyword.length >= 8 && keyword.length <= 24) score += 8;
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
  const contentMode = "factSource" in scenario && scenario.factSource && /(证据|失败|合规|案例|标准|申诉)/u.test(keyword) ? "fact-source" : "standard";

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
  const candidates = new Map<string, KeywordCandidate>();

  for (const seed of seeds) {
    const scenario = inferScenario(seed);
    const modifiers = Array.from(new Set([...scenario.modifiers, ...universalModifiers]));
    for (const modifier of modifiers) {
      const candidate = makeCandidate(seed, modifier, existingSlugs, existingKeywords);
      candidates.set(candidate.slug, candidate);
    }
  }

  const limit = Math.max(1, Math.min(100, Number(body.limit) || 40));
  const rows = Array.from(candidates.values())
    .sort((a, b) => Number(a.duplicate) - Number(b.duplicate) || b.score - a.score || a.keyword.localeCompare(b.keyword, "zh-Hans-CN"))
    .slice(0, limit);

  return NextResponse.json({
    seeds,
    candidates: rows,
    summary: {
      total: rows.length,
      available: rows.filter((row) => !row.duplicate).length,
      duplicates: rows.filter((row) => row.duplicate).length,
    },
  });
}
