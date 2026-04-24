import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { callLLM, getProviderLabel } from "./ai-provider.mjs";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";

const draftsDir = path.resolve("local-brain/drafts");
const rewrittenDir = path.resolve("local-brain/rewritten");
const reportsDir = path.resolve("local-brain/reports/review-agent");
const rewriteReportsDir = path.resolve("local-brain/reports/rewrite-agent");
const promptsDir = path.resolve("local-brain/prompts");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
}

function getDraftFiles(slug) {
  if (!fs.existsSync(draftsDir)) return [];
  return fs
    .readdirSync(draftsDir)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !slug || file === `${slug}.md`)
    .map((file) => ({ slug: path.basename(file, ".md"), filePath: path.join(draftsDir, file) }));
}

function getReviewReport(slug) {
  const reportPath = path.join(reportsDir, `${slug}.json`);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, "utf-8"));
}

function validateMarkdown(markdown, slug) {
  if (!markdown.includes("---")) return false;
  if (!markdown.match(/^# /m)) return false;
  if (!markdown.includes(slug)) return false;
  return true;
}

function normalizeSlug(markdown, slug) {
  const parsed = matter(markdown);
  parsed.data.slug = slug;
  return matter.stringify(stripInternalRevisionNotes(parsed.content).trim(), parsed.data).trim() + "\n";
}

function stripInternalRevisionNotes(content) {
  return content
    .replace(/\n##\s*AI质检后修订说明[\s\S]*?(?=\n##\s+|\s*$)/gu, "")
    .replace(/\n##\s*修订说明[\s\S]*?(?=\n##\s+|\s*$)/gu, "")
    .replace(/\n##\s*Rewrite Notes[\s\S]*?(?=\n##\s+|\s*$)/giu, "");
}

function fallbackRewrite(markdown, report, slug) {
  let output = markdown
    .replaceAll("QQBY", "北京全球博译翻译公司")
    .replaceAll("企业采购", "企业经办人和个人客户")
    .replaceAll("一站式", "从需求确认到交付复核")
    .replaceAll("赋能", "支持")
    .replaceAll("全方位", "按场景拆分");

  const parsed = matter(output);
  parsed.data.slug = slug;
  parsed.data.description = parsed.data.description || report?.summary || "围绕翻译服务需求，说明准备材料、交付标准、风险控制和询价要点。";
  parsed.data.keywords = Array.isArray(parsed.data.keywords)
    ? parsed.data.keywords.filter((item) => item !== "QQBY").concat(["北京全球博译翻译公司"]).slice(0, 5)
    : ["北京全球博译翻译公司", "翻译服务", "翻译报价"];

  return matter.stringify(stripInternalRevisionNotes(parsed.content).trim(), parsed.data).trim() + "\n";
}

async function main() {
  const { slug } = parseArgs();
  const files = getDraftFiles(slug);
  if (files.length === 0) {
    appendLog("rewrite", "没有找到可重写的草稿。");
    return;
  }

  fs.mkdirSync(rewrittenDir, { recursive: true });
  fs.mkdirSync(rewriteReportsDir, { recursive: true });
  const systemPrompt = fs.readFileSync(path.join(promptsDir, "rewrite-agent.md"), "utf-8");

  setRunning("rewrite");
  appendLog("rewrite", `开始 AI 重写 ${files.length} 篇文章，模型B：${getProviderLabel()}`);

  try {
    for (const file of files) {
      const raw = fs.readFileSync(file.filePath, "utf-8");
      const report = getReviewReport(file.slug);
      updateArticleStage(file.slug, "rewriting", { errors: [] });
      appendLog("rewrite", `开始重写：${file.slug}`, file.slug);

      let rewritten = "";
      try {
        rewritten = await callLLM(
          systemPrompt,
          `slug: ${file.slug}\n\nAI质检报告:\n${JSON.stringify(report || {}, null, 2)}\n\n原始 Markdown:\n${raw}`,
          {
            temperature: 0.45,
            maxTokens: 6500,
            fallback: () => fallbackRewrite(raw, report, file.slug),
          },
        );
      } catch (error) {
        rewritten = fallbackRewrite(raw, report, file.slug);
        appendLog("rewrite", `模型重写失败，已使用本地安全改写：${error.message}`, file.slug);
      }

      if (!validateMarkdown(rewritten, file.slug)) {
        rewritten = fallbackRewrite(raw, report, file.slug);
      }

      rewritten = normalizeSlug(rewritten, file.slug);
      fs.writeFileSync(path.join(rewrittenDir, `${file.slug}.md`), rewritten, "utf-8");
      fs.writeFileSync(path.join(draftsDir, `${file.slug}.md`), rewritten, "utf-8");
      fs.writeFileSync(
        path.join(rewriteReportsDir, `${file.slug}.json`),
        JSON.stringify(
          {
            slug: file.slug,
            sourceReport: report ? path.join(reportsDir, `${file.slug}.json`) : null,
            rewrittenAt: new Date().toISOString(),
            provider: process.env.AI_PROVIDER || "mock",
            model: process.env.LLM_MODEL || "mock",
          },
          null,
          2,
        ),
        "utf-8",
      );

      const parsed = matter(rewritten);
      updateArticleStage(file.slug, "rewritten", {
        keyword: parsed.data.keywords?.[0] || parsed.data.title || file.slug,
        locale: parsed.data.locale || "zh",
        rewrittenAt: new Date().toISOString(),
        errors: [],
      });
      appendLog("rewrite", `AI重写完成：${file.slug}，已写回草稿区`, file.slug);
    }
  } finally {
    setIdle();
    appendLog("rewrite", "AI重写步骤完成");
  }
}

main().catch((error) => {
  appendLog("rewrite", `AI重写失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});
