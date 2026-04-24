import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { callLLM, getProviderLabel } from "./ai-provider.mjs";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";

const draftsDir = path.resolve("local-brain/drafts");
const rewrittenDir = path.resolve("local-brain/rewritten");
const reportsDir = path.resolve("local-brain/reports/review-agent");
const promptsDir = path.resolve("local-brain/prompts");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
}

function getArticleFiles(slug) {
  const candidates = [];
  for (const dir of [rewrittenDir, draftsDir]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((item) => item.endsWith(".md"))) {
      if (!slug || file === `${slug}.md`) {
        const fullPath = path.join(dir, file);
        if (!candidates.some((item) => item.slug === path.basename(file, ".md"))) {
          candidates.push({ slug: path.basename(file, ".md"), filePath: fullPath });
        }
      }
    }
  }
  return candidates;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Model did not return JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 70;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeReport(slug, data, fallback) {
  const scores = {
    format: clampScore(data?.scores?.format ?? fallback.scores.format),
    seo: clampScore(data?.scores?.seo ?? fallback.scores.seo),
    internalLinks: clampScore(data?.scores?.internalLinks ?? fallback.scores.internalLinks),
    duplication: clampScore(data?.scores?.duplication ?? fallback.scores.duplication),
    aiTone: clampScore(data?.scores?.aiTone ?? fallback.scores.aiTone),
    conversion: clampScore(data?.scores?.conversion ?? fallback.scores.conversion),
    compliance: clampScore(data?.scores?.compliance ?? fallback.scores.compliance),
  };
  const overallScore = clampScore(data?.overallScore ?? Object.values(scores).reduce((sum, item) => sum + item, 0) / Object.values(scores).length);
  const recommendation = ["pass", "revise", "rewrite"].includes(data?.recommendation) ? data.recommendation : overallScore >= 85 ? "pass" : overallScore >= 70 ? "revise" : "rewrite";

  return {
    slug,
    overallScore,
    recommendation,
    summary: String(data?.summary || fallback.summary || "已完成 AI 质检。"),
    scores,
    issues: Array.isArray(data?.issues) && data.issues.length > 0 ? data.issues : fallback.issues,
    nextAction: String(data?.nextAction || fallback.nextAction || "根据报告修改后重新质检。"),
    reviewedAt: new Date().toISOString(),
    provider: process.env.AI_PROVIDER || "mock",
    model: process.env.LLM_MODEL || "mock",
  };
}

function buildFallbackReview(slug, raw) {
  const { data, content } = matter(raw);
  const text = content.replace(/\s+/g, "");
  const h2Count = (content.match(/^## /gm) || []).length;
  const hasTable = /\|.+\|/.test(content);
  const faqCount = Array.isArray(data.faq) ? data.faq.length : (content.match(/^### .*[？?]/gm) || []).length;
  const internalLinks = (content.match(/\]\(\/zh\//g) || []).length;
  const aiPhrases = ["综上所述", "总之", "在当今", "一站式", "赋能", "全方位", "企业采购", "QQBY"];
  const aiHits = aiPhrases.filter((word) => raw.includes(word));
  const paragraphs = content.split(/\n{2,}/).map((item) => item.trim()).filter((item) => item.length > 80);
  const duplicateCount = paragraphs.length - new Set(paragraphs.map((item) => item.slice(0, 80))).size;
  const format = Math.min(100, 45 + h2Count * 10 + (hasTable ? 15 : 0) + faqCount * 5);
  const seo = data.title && data.description && Array.isArray(data.keywords) ? 82 : 58;
  const internalLinksScore = internalLinks >= 2 ? 88 : internalLinks === 1 ? 74 : 45;
  const duplication = duplicateCount === 0 ? 88 : Math.max(45, 88 - duplicateCount * 12);
  const aiTone = Math.max(40, 90 - aiHits.length * 9);
  const conversion = raw.includes("/zh/quote") ? 82 : 62;
  const compliance = /(保证通过|100%准确|全网最低价|第一品牌|全球领先)/.test(raw) ? 50 : 92;
  const issues = [];

  if (text.length < 1200) issues.push(issue("high", "format", "正文长度不足 1200 字。", "补充具体场景、流程、风险和 FAQ。"));
  if (internalLinks < 2) issues.push(issue("medium", "internalLinks", "内链数量偏少。", "增加服务页、报价页或行业页链接，锚文本保持自然。"));
  if (aiHits.length > 0) issues.push(issue("medium", "aiTone", `检测到可能不合适表达：${aiHits.join("、")}。`, "替换为具体、克制、面向客户场景的表达。"));
  if (duplicateCount > 0) issues.push(issue("medium", "duplication", "存在疑似重复段落。", "合并相似段落，补充新的判断标准或案例化说明。"));

  return {
    summary: issues.length > 0 ? "文章可继续优化，建议重写或人工修改后再发布。" : "文章基础结构可用，可进入后续校验。",
    scores: { format, seo, internalLinks: internalLinksScore, duplication, aiTone, conversion, compliance },
    issues,
    nextAction: issues.length > 0 ? "建议执行 AI重写，再重新质检。" : "可进入规则校验。",
  };
}

function issue(severity, dimension, message, suggestion) {
  return { severity, dimension, message, suggestion };
}

function toMarkdownReport(report) {
  const scoreRows = Object.entries(report.scores).map(([key, value]) => `| ${key} | ${value} |`).join("\n");
  const issueRows = report.issues.length
    ? report.issues.map((item) => `| ${item.severity} | ${item.dimension} | ${item.message} | ${item.suggestion} |`).join("\n")
    : "| - | - | 未发现明显问题 | - |";

  return `# AI质检报告：${report.slug}

- 总分：${report.overallScore}
- 建议：${report.recommendation}
- 摘要：${report.summary}
- 下一步：${report.nextAction}
- 模型：${report.provider} / ${report.model}

## 分项评分

| 维度 | 分数 |
| --- | --- |
${scoreRows}

## 问题与建议

| 严重级别 | 维度 | 问题 | 建议 |
| --- | --- | --- | --- |
${issueRows}
`;
}

async function main() {
  const { slug } = parseArgs();
  const files = getArticleFiles(slug);
  if (files.length === 0) {
    appendLog("review", "没有找到可质检的草稿。");
    return;
  }

  fs.mkdirSync(reportsDir, { recursive: true });
  const systemPrompt = fs.readFileSync(path.join(promptsDir, "review-agent.md"), "utf-8");

  setRunning("review");
  appendLog("review", `开始 AI 质检 ${files.length} 篇文章，模型B：${getProviderLabel()}`);

  try {
    for (const file of files) {
      const raw = fs.readFileSync(file.filePath, "utf-8");
      const fallback = buildFallbackReview(file.slug, raw);
      updateArticleStage(file.slug, "reviewing", { errors: [] });
      appendLog("review", `开始质检：${file.slug}`, file.slug);

      let parsed = null;
      try {
        const response = await callLLM(systemPrompt, `slug: ${file.slug}\n\nMarkdown:\n${raw}`, {
          temperature: 0.2,
          maxTokens: 3500,
          fallback: () => JSON.stringify(fallback),
        });
        parsed = extractJson(response);
      } catch (error) {
        parsed = fallback;
        appendLog("review", `模型质检失败，已使用本地规则报告：${error.message}`, file.slug);
      }

      const report = normalizeReport(file.slug, parsed, fallback);
      fs.writeFileSync(path.join(reportsDir, `${file.slug}.json`), JSON.stringify(report, null, 2), "utf-8");
      fs.writeFileSync(path.join(reportsDir, `${file.slug}.md`), toMarkdownReport(report), "utf-8");

      updateArticleStage(file.slug, "reviewed", {
        reviewScore: report.overallScore,
        reviewRecommendation: report.recommendation,
        reviewSummary: report.summary,
        reviewReportPath: path.join(reportsDir, `${file.slug}.md`),
        errors: report.recommendation === "pass" ? [] : report.issues.map((item) => item.message).slice(0, 5),
      });
      appendLog("review", `AI质检完成：${file.slug}（${report.overallScore} / ${report.recommendation}）`, file.slug);
    }
  } finally {
    setIdle();
    appendLog("review", "AI质检步骤完成");
  }
}

main().catch((error) => {
  appendLog("review", `AI质检失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});
