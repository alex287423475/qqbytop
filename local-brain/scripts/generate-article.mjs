import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { callLLM, getProviderLabel } from "./ai-provider.mjs";
import { normalizeLocale } from "./lib/normalize-locale.mjs";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";
import { ensureArticleVisualAssets } from "./lib/visual-assets.mjs";

const draftsDir = path.resolve("local-brain/drafts");
const reportsDir = path.resolve("local-brain/reports");
const inputsDir = path.resolve("local-brain/inputs");
const promptsDir = path.resolve("local-brain/prompts");
const factSourcesDir = path.resolve("local-brain/inputs/fact-sources");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  const slugsIndex = process.argv.indexOf("--slugs");
  const slugs =
    slugsIndex >= 0
      ? String(process.argv[slugsIndex + 1] || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
    slugs,
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

function hasGeneratedArtifact(row) {
  const locale = normalizeLocale(row.locale);
  const candidates = [
    path.join(draftsDir, `${row.slug}.md`),
    path.resolve("local-brain/validated", `${row.slug}.md`),
    path.resolve("local-brain/approved", `${row.slug}.md`),
    path.resolve("content/articles", locale, row.slug, "index.md"),
  ];

  return candidates.some((filePath) => fs.existsSync(filePath));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeContentMode(row) {
  const mode = String(row.contentMode || row.mode || "standard").trim();
  return mode === "fact-source" ? "fact-source" : "standard";
}

function readPromptFile(fileName, fallback = "") {
  const filePath = path.join(promptsDir, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return fs.readFileSync(filePath, "utf-8");
}

function readFactSourcePack(slug) {
  const candidates = [path.join(factSourcesDir, `${slug}.md`), path.join(factSourcesDir, `${slug}.txt`)];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return { filePath: null, content: "" };

  return {
    filePath,
    content: fs.readFileSync(filePath, "utf-8").trim(),
  };
}

function buildFaq(keyword, category) {
  return [
    {
      q: `${keyword}通常按什么方式收费？`,
      a: `在 ${category} 场景中，常见做法是先按字数或文件难度评估，再根据语种、紧急程度、排版复杂度和审校要求给出正式报价。`,
    },
    {
      q: `为什么同样是 ${keyword}，不同供应商报价差异会很大？`,
      a: `差异通常来自译员背景、是否包含审校、是否保留版式、是否提供术语统一和是否支持加急交付。`,
    },
    {
      q: `办理或采购 ${keyword} 时最应该看什么？`,
      a: `最重要的是交付标准是否写清楚，包括文件格式、时间节点、术语要求、修改轮次和保密责任。`,
    },
    {
      q: `${keyword} 能不能直接用机翻？`,
      a: `如果文章对应的是商务、法务、专利或技术文件场景，通常不建议直接机翻后上线，因为风险主要不在语法，而在责任表达、术语边界和可执行性。`,
    },
  ];
}

function buildFallbackMarkdown(row, redLines) {
  const locale = normalizeLocale(row.locale);
  const faq = buildFaq(row.keyword, row.category);
  const faqFrontmatter = faq
    .map((item) => `  - q: "${item.q}"\n    a: "${item.a}"`)
    .join("\n");

  return `---
title: "${row.keyword}"
slug: "${row.slug}"
description: "围绕${row.keyword}，解答报价逻辑、交付标准、常见风险和询价要点。"
category: "${row.category}"
date: "${today()}"
locale: "${locale}"
keywords:
  - "${row.keyword}"
  - "${row.category}"
  - "北京全球博译翻译公司"
faq:
${faqFrontmatter}
---

# ${row.keyword}

很多个人或机构第一次搜索 **${row.keyword}**，并不是单纯想找一个最低价，而是要在时间、质量、保密和交付结果之间找到一个稳定方案。对个人申请人、企业经办人、法务、运营和项目经理来说，最麻烦的从来不是“有没有人能翻译”，而是“这次交付能不能被接收方顺利使用”。如果供应商只谈字数、不谈用途、不谈风险，后续往往会在术语、版本、排版和责任边界上反复返工。

北京全球博译翻译公司在处理 ${row.category} 项目时，通常先确认文件用途、目标语种、交付格式和时间要求，再决定是否需要审校、术语表和版式还原。这样做的原因很简单：同样一个关键词，可能对应官网内容、本地化文档、对外申诉材料，或者内部审批资料，它们的成稿标准完全不同。先做用途分级，比单纯报价更重要。

## 先判断需求，再判断价格

个人或机构在评估 ${row.keyword} 时，建议先把需求拆成四个维度：第一是文件用途，是为了个人申请、内部参考、对外提交还是直接上线；第二是交付格式，是普通 Word 文件、双语对照件、盖章件还是需要保留复杂版式；第三是时间要求，是标准交付还是加急；第四是是否需要术语统一、关键信息复核和审校环节。只有这四项被确认，报价才有真正意义。

如果需求没有拆开，最常见的问题就是前期报价看起来不高，后期却不断加项。比如原本只说“翻译一份文件”，但临近交付才要求保留图表格式、补术语表、追加审校意见或者支持二次修改。对于 ${row.keyword} 这类项目，建议在询价阶段就把交付件和验收标准写清楚。这样既能减少返工，也能判断不同供应商的真实服务边界。

| 评估维度 | 需要确认的问题 | 对报价和交付的影响 |
| --- | --- | --- |
| 文件用途 | 内部参考、外部提交、官网上线、平台申诉 | 决定语气、严谨度和是否需要审校 |
| 交付格式 | 纯文本、Word、PDF、双语对照、保留版式 | 决定是否涉及排版和格式处理 |
| 时间要求 | 标准周期还是 24 小时内加急 | 影响排期和加急费用 |
| 质量要求 | 是否需要审校、术语统一、修改轮次 | 决定项目流程和最终风险 |

## ${row.keyword} 中真正容易出问题的地方

很多客户以为 ${row.keyword} 的风险主要来自语法错误，其实真正的问题通常出在业务判断层面。第一类风险是术语边界不一致，前后两个版本用词不同，导致审批、审校或对外沟通时出现矛盾。第二类风险是责任表达不清，比如原文中的义务、限制、条件和免责条款没有被准确转写。第三类风险是交付格式不匹配，客户需要的是可直接提交、可直接上线或可直接回传系统的文件，但供应商只给了一个无法继续使用的“译文文本”。

在 ${row.category} 场景里，这类问题特别常见。因为很多项目并不只是语言转换，而是提交材料或业务材料的再组织。一个可靠的流程通常会在正式翻译前先确认关键信息和使用场景，在翻译中记录关键判断，在交付前完成自检和人工审校。相比“把字翻完”，能否稳定把这些环节交付出来，才决定了 ${row.keyword} 是否真正值得办理或采购。

## 选择翻译服务时应该怎么判断供应商

判断一家供应商是否适合 ${row.keyword}，最简单的办法不是问“你们做过多少项目”，而是看它能不能回答清楚三个问题。第一，你们如何拆分用途和交付级别；第二，术语与审校如何落地；第三，项目出现争议时用什么机制修正。能说清这些，通常说明对流程有经验；只会强调速度和价格，往往意味着后续执行靠临时补救。

从实践上看，个人和企业客户都适合让供应商在询价阶段就输出一个简短判断：项目类型、使用场景、推荐交付方式、是否建议双语对照、是否建议术语表或关键信息复核、是否建议预留审校时间。这个判断本身就是能力体现，也能让客户更快判断 ${row.keyword} 是否匹配自身需求。如果你正在比较多家服务商，建议把这些问题放在同一张比对表里，不要只看单价。

## 更稳的执行方式是什么

如果目标是降低风险而不是只求“先交付再说”，更稳的方式通常是：先提交样稿或样页评估，再确认术语和交付方式，然后安排正式翻译、审校和交付复核。对于需要对外使用的材料，还建议提前确认最终使用场景，例如是否用于平台审核、客户合同、产品资料或合规文件。这样一来，${row.keyword} 的难点就会从模糊询价，变成一个可以管理的项目流程。

在北京全球博译翻译公司的执行里，常见做法是把客户需求先落成清单，再进入翻译和审校环节。这样后续如果要补充文件、调整格式或者追加语言版本，项目仍然有统一基线，不会因为每轮修改都从头开始。对个人申请人和企业经办人来说，这比一份“看起来便宜”的报价更有意义，因为它决定了最终总成本和沟通成本。

## 办理建议与下一步

如果你正在评估 ${row.keyword}，最实用的做法不是立即比价，而是先整理三项信息：文件类型、用途、期望交付时间。把这三项发给供应商后，再看对方是否能给出结构化判断。能给出明确范围、明确风险、明确交付件的供应商，通常比一开始只强调“马上能做”的供应商更可靠。

你也可以先结合 [专业文档翻译](/zh/services/document-translation)、[法律合规翻译](/zh/services/legal-compliance) 或 [获取报价](/zh/quote) 页面整理需求。对于 ${row.keyword} 这类项目，越早把用途和交付标准写清楚，后续返工成本越低。

## FAQ

### ${faq[0].q}

${faq[0].a}

### ${faq[1].q}

${faq[1].a}

### ${faq[2].q}

${faq[2].a}

### ${faq[3].q}

${faq[3].a}

## 需要继续评估吗

如果你手上已经有文件，可以直接把用途、格式和时限整理好，再到 [获取报价](/zh/quote) 提交。北京全球博译翻译公司通常会先给出交付级别建议，再进入正式报价，避免因为信息不完整导致后续返工。
`;
}

function validateGeneratedMarkdown(markdown) {
  return markdown.includes("---") && markdown.match(/^# /m) && markdown.includes("## FAQ");
}

async function main() {
  const { slug, slugs } = parseArgs();
  const keywords = readCsv(path.join(inputsDir, "keywords.csv"));
  const redLines = readCsv(path.join(inputsDir, "red-lines.csv")).map((item) => item.word);
  const provider = process.env.AI_PROVIDER || "mock";
  const systemPrompt = readPromptFile("article-system.md");
  const standardUserPromptTemplate = readPromptFile("article-user.md");
  const factSourceUserPromptTemplate = readPromptFile("article-fact-source-user.md", standardUserPromptTemplate);
  const selectedSlugs = new Set(slugs.length > 0 ? slugs : slug ? [slug] : []);
  const rows = selectedSlugs.size > 0
    ? keywords.filter((item) => selectedSlugs.has(item.slug))
    : keywords.filter((item) => !hasGeneratedArtifact(item));

  if (rows.length === 0) {
    appendLog("generate", "没有待生成的关键词。若要重写已有文章，请在文章卡片上单独点击生成。");
    console.log("No pending keywords to generate.");
    return;
  }

  fs.mkdirSync(draftsDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });

  setRunning("generate");
  appendLog("generate", `开始生成 ${rows.length} 篇文章，提供商：${getProviderLabel()}`);

  try {
    for (const row of rows) {
      const locale = normalizeLocale(row.locale);
      const contentMode = normalizeContentMode(row);
      const factSourcePack = contentMode === "fact-source" ? readFactSourcePack(row.slug) : { filePath: null, content: "" };
      updateArticleStage(row.slug, "generating", {
        keyword: row.keyword,
        locale,
        category: row.category,
        contentMode,
        factSourcePath: factSourcePack.filePath,
        errors: [],
      });
      appendLog("generate", `开始生成：${row.keyword}`, row.slug);
      if (contentMode === "fact-source" && !factSourcePack.content) {
        appendLog("generate", `核心事实源缺少资料包，将只按深度模板生成：${row.slug}`, row.slug);
      }

      const fallback = () => buildFallbackMarkdown(row, redLines);
      const userPromptTemplate = contentMode === "fact-source" ? factSourceUserPromptTemplate : standardUserPromptTemplate;
      const factSourceContext = factSourcePack.content
        ? `\n\n事实源资料包（必须优先使用，但不要编造资料包没有提供的数据）：\n${factSourcePack.content}`
        : "";
      const userPrompt = `${userPromptTemplate}\n\n关键词：${row.keyword}\nslug：${row.slug}\n分类：${row.category}\n意图：${row.intent}\n内容模式：${contentMode === "fact-source" ? "核心事实源" : "普通文章"}\n红线词：${redLines.join("、")}${factSourceContext}`;
      let markdown;
      try {
        markdown = await callLLM(systemPrompt, userPrompt, {
          temperature: contentMode === "fact-source" ? 0.45 : 0.6,
          maxTokens: contentMode === "fact-source" ? 8000 : 5000,
          fallback,
        });
      } catch (error) {
        updateArticleStage(row.slug, "generate-failed", {
          keyword: row.keyword,
          locale,
          category: row.category,
          contentMode,
          errors: [error.message],
        });
        appendLog("generate", `生成失败，未写入模板文章：${row.slug} / ${error.message}`, row.slug);
        continue;
      }

      if (!validateGeneratedMarkdown(markdown)) {
        updateArticleStage(row.slug, "generate-failed", {
          keyword: row.keyword,
          locale,
          category: row.category,
          contentMode,
          errors: ["模型返回内容未通过基础 Markdown 结构检查，未写入模板文章。"],
        });
        appendLog("generate", `生成失败，模型返回结构不合格：${row.slug}`, row.slug);
        continue;
      }

      markdown = ensureArticleVisualAssets(markdown, { ...row, contentMode });
      fs.writeFileSync(path.join(draftsDir, `${row.slug}.md`), markdown, "utf-8");
      fs.writeFileSync(
        path.join(reportsDir, `${row.slug}-generate.json`),
        JSON.stringify(
          {
            slug: row.slug,
            keyword: row.keyword,
            locale,
            contentMode,
            factSourcePath: factSourcePack.filePath,
            visuals: contentMode === "fact-source" ? "public/article-assets" : null,
            provider,
            source: provider === "mock" ? "mock-fallback" : "model",
            generatedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );

      updateArticleStage(row.slug, "draft", {
        generatedAt: new Date().toISOString(),
        locale,
        contentMode,
        factSourcePath: factSourcePack.filePath,
        errors: [],
      });
      appendLog("generate", `草稿已生成：${row.slug}.md`, row.slug);
    }
  } finally {
    setIdle();
    appendLog("generate", "生成步骤完成");
  }
}

main().catch((error) => {
  appendLog("generate", `生成失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});
