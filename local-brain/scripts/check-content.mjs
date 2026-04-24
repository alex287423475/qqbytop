import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { normalizeLocale } from "./lib/normalize-locale.mjs";

const articlesDir = path.resolve("content/articles");
const publicDir = path.resolve("public");
const supportedLocales = new Set(["zh", "en", "ja"]);

function validateArticle(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const errors = [];
  const normalizedLocale = normalizeLocale(data.locale);
  const faqCount = Array.isArray(data.faq) ? data.faq.length : 0;
  const textOnly = content.replace(/[#>*`\-\[\]\(\)|]/g, "").replace(/\s+/g, "");
  const imageLinks = [...content.matchAll(/!\[[^\]]+\]\((\/article-assets\/[^)]+)\)/g)].map((match) => match[1]);

  if (!data.title) errors.push("title 为空");
  if (!data.slug) errors.push("slug 为空");
  if (!data.description) errors.push("description 为空");
  if (!data.category) errors.push("category 为空");
  if (!data.date) errors.push("date 为空");
  if (!data.locale) errors.push("locale 为空");
  if (data.locale && data.locale !== normalizedLocale) errors.push(`locale 必须归一化为站点语言代码（当前 ${data.locale}，建议 ${normalizedLocale}）`);
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) errors.push("keywords 为空");
  if (!content.match(/^# /m)) errors.push("缺少 H1");
  if ((content.match(/^## /gm) || []).length < 3) errors.push("H2 少于 3 个");
  if (!/\|.+\|/.test(content)) errors.push("缺少 Markdown 表格");
  if (faqCount < 4) errors.push("FAQ 少于 4 条");
  if (!content.includes("/quote") && !content.includes("/services/") && !content.includes("/industries/")) {
    errors.push("缺少站内 CTA 或内链");
  }
  if (normalizedLocale === "zh" && textOnly.length < 1200) errors.push(`中文正文不足 1200 字（当前约 ${textOnly.length}）`);
  if (normalizedLocale === "en" && content.split(/\s+/).filter(Boolean).length < 1000) errors.push("英文正文不足 1000 words");

  if (data.contentMode === "fact-source") {
    if (imageLinks.length < 3) errors.push("fact-source article needs at least 3 image links");
    for (const imageLink of imageLinks) {
      const assetPath = path.join(publicDir, imageLink.replace(/^\//u, ""));
      if (!fs.existsSync(assetPath)) errors.push(`missing image asset: ${imageLink}`);
    }
  }

  return errors;
}

function main() {
  const problems = [];

  if (!fs.existsSync(articlesDir)) {
    throw new Error("content/articles 目录不存在");
  }

  for (const locale of fs.readdirSync(articlesDir)) {
    const localeDir = path.join(articlesDir, locale);
    if (!fs.statSync(localeDir).isDirectory()) continue;
    if (!supportedLocales.has(locale)) {
      problems.push(`${locale}: 不属于站点支持的语言目录，应迁移到 zh/en/ja`);
      continue;
    }

    for (const entry of fs.readdirSync(localeDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const filePath = path.join(localeDir, entry.name, "index.md");
      if (!fs.existsSync(filePath)) {
        problems.push(`${locale}/${entry.name}: 缺少 index.md`);
        continue;
      }

      const errors = validateArticle(filePath);
      for (const error of errors) {
        problems.push(`${locale}/${entry.name}: ${error}`);
      }
    }
  }

  if (problems.length > 0) {
    console.error("Content validation failed:");
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Content validation passed.");
}

main();
