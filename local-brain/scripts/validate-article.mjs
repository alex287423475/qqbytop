import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";
import { getArticleAssetPaths } from "./lib/visual-assets.mjs";

const draftsDir = path.resolve("local-brain/drafts");
const validatedDir = path.resolve("local-brain/validated");
const rejectedDir = path.resolve("local-brain/rejected");
const reportsDir = path.resolve("local-brain/reports");
const inputsDir = path.resolve("local-brain/inputs");
const articlesDir = path.resolve("content/articles");

function normalizeLocale(value) {
  const locale = String(value || "zh").trim().toLowerCase();
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("en")) return "en";
  if (locale.startsWith("ja")) return "ja";
  return "zh";
}

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
}

function getRedLines() {
  const filePath = path.join(inputsDir, "red-lines.csv");
  if (!fs.existsSync(filePath)) return [];

  return fs
    .readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(",")[0]?.trim())
    .filter(Boolean);
}

function getExistingSlugs() {
  const slugs = new Set();

  if (!fs.existsSync(articlesDir)) return slugs;

  for (const locale of fs.readdirSync(articlesDir)) {
    const localeDir = path.join(articlesDir, locale);
    if (!fs.statSync(localeDir).isDirectory()) continue;

    for (const entry of fs.readdirSync(localeDir, { withFileTypes: true })) {
      if (entry.isDirectory()) slugs.add(entry.name);
    }
  }

  return slugs;
}

function validateFile(filePath, redLines, existingSlugs) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const errors = [];
  const slug = data.slug || path.basename(filePath, ".md");
  const faqCount = Array.isArray(data.faq) ? data.faq.length : 0;
  const textOnly = content.replace(/[#>*`\-\[\]\(\)|]/g, "").replace(/\s+/g, "");
  const keyword = Array.isArray(data.keywords) && data.keywords.length > 0 ? data.keywords[0] : "";
  const keywordCount = keyword ? content.split(keyword).length - 1 : 0;
  const contentMode = String(data.contentMode || "").trim();
  const imageLinks = [...content.matchAll(/!\[[^\]]+\]\((\/article-assets\/[^)]+)\)/g)].map((match) => match[1]);

  if (!data.title) errors.push("Missing frontmatter: title");
  if (!data.slug) errors.push("Missing frontmatter: slug");
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push("Invalid slug: only lowercase letters, numbers, and hyphens are allowed");
  }
  if (data.slug && existingSlugs.has(data.slug)) {
    errors.push(`Slug already exists in content/articles: ${data.slug}`);
  }
  if (!data.description) errors.push("Missing frontmatter: description");
  if (typeof data.description === "string" && (data.description.length < 20 || data.description.length > 220)) {
    errors.push("Description length should stay between 20 and 220 characters");
  }
  if (!data.category) errors.push("Missing frontmatter: category");
  if (!data.date) errors.push("Missing frontmatter: date");
  if (!data.locale) errors.push("Missing frontmatter: locale");
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
    errors.push("Missing frontmatter: keywords");
  }

  if (!content.match(/^# /m)) errors.push("Missing H1");
  if ((content.match(/^## /gm) || []).length < 3) errors.push("Need at least 3 H2 sections");
  if (!/\|.+\|/.test(content)) errors.push("Missing Markdown table");
  if (faqCount < 4) errors.push("Need at least 4 FAQ items in frontmatter");
  if (!content.includes("/zh/quote") && !content.includes("/zh/services/") && !content.includes("/zh/industries/")) {
    errors.push("Missing internal CTA or service links");
  }

  if (normalizeLocale(data.locale) === "zh" && textOnly.length < 1200) {
    errors.push(`Chinese body is too short: ${textOnly.length} chars`);
  }
  if (normalizeLocale(data.locale) === "en" && content.split(/\s+/).filter(Boolean).length < 1000) {
    errors.push("English body is too short: need at least 1000 words");
  }
  if (keyword && keywordCount < 2) {
    errors.push(`Primary keyword appears too few times: ${keywordCount}`);
  }
  if (keyword && keywordCount > 25) {
    errors.push(`Primary keyword appears too many times: ${keywordCount}`);
  }

  if (contentMode === "fact-source") {
    if (imageLinks.length < 3) {
      errors.push("Fact-source articles need at least 3 explanatory image links");
    }

    const assetPaths = getArticleAssetPaths(normalizeLocale(data.locale || "zh"), slug);
    if (assetPaths.length < 3) {
      errors.push("Fact-source article image assets are missing from public/article-assets");
    }
  }

  const redHits = redLines.filter((word) => content.includes(word));
  if (redHits.length > 0) {
    errors.push(`Red-line words detected: ${redHits.join(", ")}`);
  }

  return { slug, data, errors };
}

async function main() {
  const { slug } = parseArgs();

  if (!fs.existsSync(draftsDir)) {
    console.log("Drafts directory does not exist.");
    return;
  }

  const files = fs
    .readdirSync(draftsDir)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !slug || file === `${slug}.md`);

  if (files.length === 0) {
    console.log("No drafts to validate.");
    return;
  }

  fs.mkdirSync(validatedDir, { recursive: true });
  fs.mkdirSync(rejectedDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });

  const redLines = getRedLines();
  const existingSlugs = getExistingSlugs();

  setRunning("validate");
  appendLog("validate", `Start validating ${files.length} draft(s)`);

  try {
    for (const file of files) {
      const filePath = path.join(draftsDir, file);
      const { slug: fileSlug, data, errors } = validateFile(filePath, redLines, existingSlugs);

      if (errors.length === 0) {
        fs.renameSync(filePath, path.join(validatedDir, file));
        updateArticleStage(fileSlug, "validated", {
          keyword: data.keywords?.[0] || fileSlug,
          locale: data.locale,
          validatedAt: new Date().toISOString(),
          errors: [],
        });
        appendLog("validate", `Validation passed: ${fileSlug}`, fileSlug);
      } else {
        updateArticleStage(fileSlug, "rejected", {
          locale: data.locale || "zh",
          errors,
        });
        appendLog("validate", `Validation failed: ${fileSlug}`, fileSlug);
        fs.writeFileSync(
          path.join(reportsDir, `${fileSlug}-validation.json`),
          JSON.stringify({ slug: fileSlug, errors, checkedAt: new Date().toISOString() }, null, 2),
        );
      }
    }
  } finally {
    setIdle();
    appendLog("validate", "Validate step completed");
  }
}

main().catch((error) => {
  appendLog("validate", `Validation crashed: ${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});
