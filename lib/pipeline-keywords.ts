import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export type KeywordRow = {
  keyword: string;
  slug: string;
  locale: string;
  category: string;
  intent: string;
  priority: string;
  contentMode?: string;
  source?: string;
  searchVolume?: string;
  competition?: string;
  difficulty?: string;
};

const headers: Array<keyof KeywordRow> = [
  "keyword",
  "slug",
  "locale",
  "category",
  "intent",
  "priority",
  "contentMode",
  "source",
  "searchVolume",
  "competition",
  "difficulty",
];

export const keywordsPath = path.join(process.cwd(), "local-brain", "inputs", "keywords.csv");

const slugTokenMap: Array<[RegExp, string]> = [
  [/北京/g, "beijing"],
  [/全球博译/g, "qqby"],
  [/翻译公司/g, "translation-company"],
  [/跨境电商/g, "cross-border-ecommerce"],
  [/亚马逊/g, "amazon"],
  [/Listing/gi, "listing"],
  [/独立站/g, "independent-site"],
  [/证件/g, "certificate"],
  [/合同/g, "contract"],
  [/法律/g, "legal"],
  [/专利/g, "patent"],
  [/医学/g, "medical"],
  [/技术/g, "technical"],
  [/商务/g, "business"],
  [/金融/g, "finance"],
  [/本地化/g, "localization"],
  [/翻译/g, "translation"],
  [/报价/g, "price"],
  [/价格/g, "price"],
  [/多少钱/g, "cost"],
  [/费用/g, "cost"],
  [/需要注意什么/g, "tips"],
  [/注意事项/g, "tips"],
  [/怎么选/g, "how-to-choose"],
  [/怎么做/g, "how-to"],
  [/为什么/g, "why"],
  [/不能/g, "cannot"],
  [/机翻/g, "machine-translation"],
  [/风险/g, "risks"],
  [/指南/g, "guide"],
  [/流程/g, "process"],
  [/办理/g, "process"],
  [/公证/g, "notarization"],
  [/认证/g, "certification"],
  [/申诉/g, "appeal"],
  [/拒付/g, "chargeback"],
  [/证据/g, "evidence"],
  [/材料/g, "documents"],
];

export function readKeywordRows(): KeywordRow[] {
  if (!fs.existsSync(keywordsPath)) return [];

  return parse(fs.readFileSync(keywordsPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as KeywordRow[];
}

export function writeKeywordRows(rows: KeywordRow[]) {
  fs.mkdirSync(path.dirname(keywordsPath), { recursive: true });
  const lines = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header] || "")).join(","))];
  fs.writeFileSync(keywordsPath, `${lines.join("\n")}\n`, "utf-8");
}

export function normalizeKeywordRow(input: Partial<KeywordRow>): KeywordRow {
  const keyword = String(input.keyword || "").trim();
  const row = {
    keyword,
    slug: normalizeSlug(String(input.slug || "").trim() || generateSlug(keyword)),
    locale: String(input.locale || "zh").trim(),
    category: String(input.category || "").trim(),
    intent: String(input.intent || "信息").trim(),
    priority: String(input.priority || "P1").trim(),
    contentMode: String(input.contentMode || "standard").trim(),
    source: String(input.source || "").trim(),
    searchVolume: String(input.searchVolume || "").trim(),
    competition: String(input.competition || "").trim(),
    difficulty: String(input.difficulty || "").trim(),
  };

  if (!row.keyword) throw new Error("关键词不能为空。");
  if (!row.slug) throw new Error("slug 不能为空。");
  if (!/^[a-z0-9-]+$/.test(row.slug)) throw new Error("slug 只能包含小写字母、数字和连字符。");
  if (!["zh", "en", "ja"].includes(row.locale)) throw new Error("locale 必须是 zh、en 或 ja。");
  if (!row.category) throw new Error("分类不能为空。");
  if (!row.priority) throw new Error("优先级不能为空。");
  if (!["standard", "fact-source"].includes(row.contentMode)) throw new Error("contentMode 必须是 standard 或 fact-source。");

  return row;
}

export function generateSlug(keyword: string) {
  let value = keyword.trim();
  for (const [pattern, replacement] of slugTokenMap) {
    value = value.replace(pattern, ` ${replacement} `);
  }

  const slug = normalizeSlug(value);
  if (slug) return slug;

  const fallback = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `article-${fallback}`;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
