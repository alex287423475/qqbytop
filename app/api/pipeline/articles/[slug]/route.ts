import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const editableStages = ["draft", "validated", "approved"] as const;

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Article editor is disabled in production." }, { status: 403 });
  }

  return null;
}

function getArticleCandidates(locale: string, slug: string) {
  return [
    { stage: "draft", filePath: path.join(process.cwd(), "local-brain", "drafts", `${slug}.md`) },
    { stage: "validated", filePath: path.join(process.cwd(), "local-brain", "validated", `${slug}.md`) },
    { stage: "approved", filePath: path.join(process.cwd(), "local-brain", "approved", `${slug}.md`) },
    { stage: "published", filePath: path.join(process.cwd(), "content", "articles", locale, slug, "index.md") },
  ];
}

function findArticleFile(locale: string, slug: string) {
  return getArticleCandidates(locale, slug).find((candidate) => fs.existsSync(candidate.filePath)) || null;
}

function getLocale(slug: string) {
  return readKeywordRows().find((row) => row.slug === slug)?.locale || "zh";
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const { slug } = await context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ message: "Invalid slug." }, { status: 400 });

  const locale = getLocale(slug);
  const article = findArticleFile(locale, slug);
  if (!article) return NextResponse.json({ message: `没有找到文章文件：${slug}` }, { status: 404 });

  return NextResponse.json({
    slug,
    locale,
    stage: article.stage,
    editable: editableStages.includes(article.stage as (typeof editableStages)[number]),
    filePath: article.filePath,
    markdown: fs.readFileSync(article.filePath, "utf-8"),
    articleUrl: article.stage === "published" ? `/${locale}/blog/${slug}` : null,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const { slug } = await context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ message: "Invalid slug." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { markdown?: string };
  const markdown = typeof body.markdown === "string" ? body.markdown : "";
  if (!markdown.trim()) return NextResponse.json({ message: "文章内容不能为空。" }, { status: 400 });
  if (looksLikeMojibake(markdown)) {
    return NextResponse.json({ message: "检测到疑似乱码内容，已拒绝保存。请刷新后重新编辑。" }, { status: 400 });
  }

  const locale = getLocale(slug);
  const article = findArticleFile(locale, slug);
  if (!article) return NextResponse.json({ message: `没有找到文章文件：${slug}` }, { status: 404 });
  if (!editableStages.includes(article.stage as (typeof editableStages)[number])) {
    return NextResponse.json({ message: "已发布文章不能在本地面板直接编辑，请新建修订稿后重新发布。" }, { status: 400 });
  }

  const draftPath = path.join(process.cwd(), "local-brain", "drafts", `${slug}.md`);
  fs.mkdirSync(path.dirname(draftPath), { recursive: true });
  fs.writeFileSync(draftPath, markdown, "utf-8");

  if (article.filePath !== draftPath && fs.existsSync(article.filePath)) {
    fs.unlinkSync(article.filePath);
  }

  updateRuntimeStatus(slug, locale);

  return NextResponse.json({
    success: true,
    slug,
    locale,
    stage: "draft",
    filePath: draftPath,
    markdown,
    message: "已保存为草稿，请重新执行校验草稿。",
  });
}

function looksLikeMojibake(markdown: string) {
  const sample = markdown.slice(0, 4000);
  const suspicious = sample.match(/[ÃÂ][\u0080-\u00ff]|å[\u0080-\u00ff]|ç[\u0080-\u00ff]|è[\u0080-\u00ff]|é[\u0080-\u00ff]/gu) || [];
  const replacementRuns = sample.match(/\?{6,}|�{3,}/gu) || [];
  return suspicious.length >= 8 || replacementRuns.length > 0;
}

function updateRuntimeStatus(slug: string, locale: string) {
  const statusPath = path.join(process.cwd(), "local-brain", "status", "pipeline.runtime.json");
  if (!fs.existsSync(statusPath)) return;

  const status = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
  status.updatedAt = new Date().toISOString();
  status.articles = status.articles || {};
  status.articles[slug] = {
    ...(status.articles[slug] || {}),
    slug,
    locale,
    stage: "draft",
    editedAt: new Date().toISOString(),
    errors: [],
  };
  status.log = (status.log || []).slice(-199);
  status.log.push({
    time: new Date().toISOString(),
    step: "edit",
    slug,
    message: `已手动编辑并退回草稿：${slug}`,
  });
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf-8");
}
