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
};

const headers: Array<keyof KeywordRow> = ["keyword", "slug", "locale", "category", "intent", "priority"];

export const keywordsPath = path.join(process.cwd(), "local-brain", "inputs", "keywords.csv");

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
  const row = {
    keyword: String(input.keyword || "").trim(),
    slug: String(input.slug || "").trim(),
    locale: String(input.locale || "zh").trim(),
    category: String(input.category || "").trim(),
    intent: String(input.intent || "信息").trim(),
    priority: String(input.priority || "P1").trim(),
  };

  if (!row.keyword) throw new Error("关键词不能为空。");
  if (!row.slug) throw new Error("slug 不能为空。");
  if (!/^[a-z0-9-]+$/.test(row.slug)) throw new Error("slug 只能包含小写字母、数字和连字符。");
  if (!["zh", "en", "ja"].includes(row.locale)) throw new Error("locale 必须是 zh、en 或 ja。");
  if (!row.category) throw new Error("分类不能为空。");
  if (!row.priority) throw new Error("优先级不能为空。");

  return row;
}

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
