import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getAllArticleSlugs } from "@/lib/articles";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

const statusPath = path.join(process.cwd(), "local-brain", "status", "pipeline.runtime.json");
const examplePath = path.join(process.cwd(), "local-brain", "status", "pipeline.example.json");

function readStatus() {
  if (fs.existsSync(statusPath)) {
    const status = readJsonFile(statusPath);
    if (status) return status;
  }

  if (fs.existsSync(examplePath)) {
    const status = readJsonFile(examplePath);
    if (status) return status;
  }

  return {
    updatedAt: null,
    isRunning: false,
    currentStep: null,
    lock: null,
    articles: {},
    log: [],
  };
}

function readJsonFile(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function countDirItems(dirPath: string) {
  if (!fs.existsSync(dirPath)) return 0;
  return fs.readdirSync(dirPath).filter((item) => item.endsWith(".md")).length;
}

function countJsonItems(dirPath: string) {
  if (!fs.existsSync(dirPath)) return 0;
  return fs.readdirSync(dirPath).filter((item) => item.endsWith(".json")).length;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Pipeline console is disabled in production." }, { status: 403 });
  }

  const status = readStatus();
  const contentArticles = getAllArticleSlugs();
  const keywordRows = readKeywordRows();
  const articles = status.articles || {};
  const items = Object.fromEntries(
    keywordRows.map((row) => {
      const current = articles[row.slug];
      const review = readReviewReport(row.slug);

      return [
        row.slug,
        {
          slug: row.slug,
          keyword: row.keyword,
          locale: row.locale,
          category: row.category,
          intent: row.intent,
          priority: row.priority,
          errors: [],
          ...review,
          ...current,
          stage: current?.stage || getKeywordArtifactStage(row.locale, row.slug),
        },
      ];
    }),
  );

  for (const [slug, article] of Object.entries(articles)) {
    if (!items[slug]) items[slug] = article;
  }

  return NextResponse.json({
    ...status,
    articles: items,
    items,
    counts: {
      keywords: keywordRows.length,
      drafts: countDirItems(path.join(process.cwd(), "local-brain", "drafts")),
      reviewed: countJsonItems(path.join(process.cwd(), "local-brain", "reports", "review-agent")),
      rewritten: countDirItems(path.join(process.cwd(), "local-brain", "rewritten")),
      validated: countDirItems(path.join(process.cwd(), "local-brain", "validated")),
      approved: countDirItems(path.join(process.cwd(), "local-brain", "approved")),
      published: contentArticles.length,
    },
  });
}

function getKeywordArtifactStage(locale: string, slug: string) {
  const candidates = [
    { stage: "published", filePath: path.join(process.cwd(), "content", "articles", locale, slug, "index.md") },
    { stage: "approved", filePath: path.join(process.cwd(), "local-brain", "approved", `${slug}.md`) },
    { stage: "validated", filePath: path.join(process.cwd(), "local-brain", "validated", `${slug}.md`) },
    { stage: "draft", filePath: path.join(process.cwd(), "local-brain", "drafts", `${slug}.md`) },
  ];

  return candidates.find((candidate) => fs.existsSync(candidate.filePath))?.stage || "keyword-only";
}

function readReviewReport(slug: string) {
  const reportPath = path.join(process.cwd(), "local-brain", "reports", "review-agent", `${slug}.json`);
  const report = readJsonFile(reportPath);
  if (!report) return {};

  return {
    reviewScore: report.overallScore,
    reviewRecommendation: report.recommendation,
    reviewSummary: report.summary,
    reviewReportPath: path.join(process.cwd(), "local-brain", "reports", "review-agent", `${slug}.md`),
  };
}
