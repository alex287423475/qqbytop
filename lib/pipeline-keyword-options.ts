import fs from "fs";
import path from "path";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export type KeywordOptionType = "category" | "intent";

export type KeywordOptions = {
  category: string[];
  intent: string[];
};

type StoredKeywordOptions = Partial<KeywordOptions> & {
  deletedCategory?: string[];
  deletedIntent?: string[];
};

export const defaultKeywordOptions: KeywordOptions = {
  category: [
    "证件翻译",
    "翻译价格",
    "法律翻译",
    "跨境电商",
    "专利翻译",
    "专业翻译",
    "翻译服务",
    "本地化",
    "商务翻译",
    "技术翻译",
    "医学翻译",
    "游戏本地化",
    "合规翻译",
  ],
  intent: ["信息", "询价", "比较", "风险", "办理", "指南", "案例", "合规", "转化"],
};

export const keywordOptionsPath = path.join(process.cwd(), "local-brain", "inputs", "keyword-options.json");

function normalizeList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function splitMultiValue(value: string) {
  return value
    .split(/[、,，;；|]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readKeywordOptions(): KeywordOptions {
  let saved: StoredKeywordOptions = {};

  if (fs.existsSync(keywordOptionsPath)) {
    try {
      saved = JSON.parse(fs.readFileSync(keywordOptionsPath, "utf-8")) as StoredKeywordOptions;
    } catch {
      saved = {};
    }
  }

  const rows = readKeywordRows();
  const deletedCategory = new Set(normalizeList(saved.deletedCategory));
  const deletedIntent = new Set(normalizeList(saved.deletedIntent));
  return {
    category: normalizeList([
      ...defaultKeywordOptions.category.filter((option) => !deletedCategory.has(option)),
      ...normalizeList(saved.category),
      ...rows.flatMap((row) => splitMultiValue(row.category || "")),
    ]),
    intent: normalizeList([
      ...defaultKeywordOptions.intent.filter((option) => !deletedIntent.has(option)),
      ...normalizeList(saved.intent),
      ...rows.flatMap((row) => splitMultiValue(row.intent || "")),
    ]),
  };
}

function readStoredKeywordOptions(): StoredKeywordOptions {
  if (!fs.existsSync(keywordOptionsPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(keywordOptionsPath, "utf-8")) as StoredKeywordOptions;
  } catch {
    return {};
  }
}

export function writeKeywordOptions(options: StoredKeywordOptions) {
  fs.mkdirSync(path.dirname(keywordOptionsPath), { recursive: true });
  fs.writeFileSync(
    keywordOptionsPath,
    JSON.stringify(
      {
        category: normalizeList(options.category),
        intent: normalizeList(options.intent),
        deletedCategory: normalizeList(options.deletedCategory),
        deletedIntent: normalizeList(options.deletedIntent),
      },
      null,
      2,
    ),
    "utf-8",
  );
}

export function addKeywordOption(type: KeywordOptionType, value: string) {
  const clean = value.trim();
  if (!clean) throw new Error("选项不能为空。");

  const stored = readStoredKeywordOptions();
  const deletedKey = type === "category" ? "deletedCategory" : "deletedIntent";
  writeKeywordOptions({
    ...stored,
    [type]: normalizeList([...(stored[type] || []), clean]),
    [deletedKey]: normalizeList(stored[deletedKey]).filter((item) => item !== clean),
  });

  return readKeywordOptions();
}

export function deleteKeywordOption(type: KeywordOptionType, value: string) {
  const clean = value.trim();
  if (!clean) throw new Error("选项不能为空。");

  const stored = readStoredKeywordOptions();
  const deletedKey = type === "category" ? "deletedCategory" : "deletedIntent";
  writeKeywordOptions({
    ...stored,
    [type]: normalizeList(stored[type]).filter((item) => item !== clean),
    [deletedKey]: normalizeList([...(stored[deletedKey] || []), clean]),
  });

  return readKeywordOptions();
}
