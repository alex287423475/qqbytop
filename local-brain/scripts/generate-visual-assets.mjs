import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { parse } from "csv-parse/sync";
import { ensureArticleVisualAssets } from "./lib/visual-assets.mjs";
import { normalizeLocale } from "./lib/normalize-locale.mjs";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";

const inputsDir = path.resolve("local-brain/inputs");
const draftsDir = path.resolve("local-brain/drafts");
const rewrittenDir = path.resolve("local-brain/rewritten");
const validatedDir = path.resolve("local-brain/validated");
const approvedDir = path.resolve("local-brain/approved");
const contentDir = path.resolve("content/articles");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parse(fs.readFileSync(filePath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function normalizeContentMode(row, markdown = "") {
  const fromRow = String(row.contentMode || row.mode || "").trim();
  if (fromRow === "fact-source") return "fact-source";

  if (markdown) {
    try {
      const parsed = matter(markdown);
      return parsed.data.contentMode === "fact-source" ? "fact-source" : "standard";
    } catch {
      return "standard";
    }
  }

  return "standard";
}

function findArticleFile(row) {
  const locale = normalizeLocale(row.locale);
  const slug = row.slug;
  const candidates = [
    { stage: "draft", filePath: path.join(draftsDir, `${slug}.md`) },
    { stage: "rewritten", filePath: path.join(rewrittenDir, `${slug}.md`) },
    { stage: "validated", filePath: path.join(validatedDir, `${slug}.md`) },
    { stage: "approved", filePath: path.join(approvedDir, `${slug}.md`) },
    { stage: "published", filePath: path.join(contentDir, locale, slug, "index.md") },
  ];

  return candidates.find((candidate) => fs.existsSync(candidate.filePath)) || null;
}

function getVisuals(markdown) {
  const parsed = matter(markdown);
  return Array.isArray(parsed.data.visuals) ? parsed.data.visuals : [];
}

async function main() {
  const { slug } = parseArgs();
  const rows = readCsv(path.join(inputsDir, "keywords.csv")).filter((row) => row.slug && (!slug || row.slug === slug));

  setRunning("visuals");
  appendLog("visuals", slug ? `开始生成配图：${slug}` : "开始批量生成核心事实源配图");

  let generated = 0;

  try {
    for (const row of rows) {
      const article = findArticleFile(row);
      if (!article) {
        if (slug) appendLog("visuals", `没有找到可生成配图的文章文件：${row.slug}`, row.slug);
        continue;
      }

      const markdown = fs.readFileSync(article.filePath, "utf-8");
      const contentMode = normalizeContentMode(row, markdown);
      if (contentMode !== "fact-source") {
        if (slug) appendLog("visuals", `跳过普通文章：${row.slug}`, row.slug);
        continue;
      }

      const nextMarkdown = ensureArticleVisualAssets(markdown, { ...row, contentMode });
      fs.writeFileSync(article.filePath, nextMarkdown, "utf-8");
      const visuals = getVisuals(nextMarkdown);
      generated += 1;

      updateArticleStage(row.slug, article.stage, {
        keyword: row.keyword,
        locale: normalizeLocale(row.locale),
        category: row.category,
        contentMode,
        visualCount: visuals.length,
        visualAssets: visuals,
        visualUpdatedAt: new Date().toISOString(),
        errors: [],
      });
      appendLog("visuals", `配图已生成：${row.slug}（${visuals.length} 张）`, row.slug);
    }
  } finally {
    setIdle();
    appendLog("visuals", `配图步骤完成：${generated} 篇文章已刷新`);
  }
}

main().catch((error) => {
  appendLog("visuals", `配图生成失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});
