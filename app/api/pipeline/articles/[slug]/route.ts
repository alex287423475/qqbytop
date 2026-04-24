import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextRequest, NextResponse } from "next/server";
import { canEditArticleStage, getArticleEditMessages, shouldDeleteOriginalAfterSave } from "@/lib/pipeline-article-editor";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

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

function findReviewReport(slug: string) {
  const reportPath = path.join(process.cwd(), "local-brain", "reports", "review-agent", `${slug}.md`);
  return fs.existsSync(reportPath) ? reportPath : null;
}

function getLocale(slug: string) {
  return readKeywordRows().find((row) => row.slug === slug)?.locale || "zh";
}

function extractVisualAssets(markdown: string, locale: string, slug: string) {
  const parsed = matter(markdown);
  const fromFrontmatter = Array.isArray(parsed.data.visuals) ? parsed.data.visuals : [];
  const coverImage = typeof parsed.data.coverImage === "string" ? [{ type: "cover", title: "Cover image", alt: parsed.data.coverAlt || "", src: parsed.data.coverImage }] : [];
  const fromMarkdown = Array.from(markdown.matchAll(/!\[([^\]]*)]\((\/article-assets\/[^)]+\.svg)\)/g)).map((match) => ({
    alt: match[1],
    src: match[2],
  }));

  const unique = new Map<string, { type: string; title: string; alt: string; src: string; exists: boolean }>();
  for (const asset of [...coverImage, ...fromFrontmatter, ...fromMarkdown]) {
    const src = typeof asset.src === "string" ? asset.src : "";
    if (!src.startsWith("/article-assets/")) continue;

    const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    unique.set(src, {
      type: typeof asset.type === "string" ? asset.type : path.basename(src, ".svg"),
      title: typeof asset.title === "string" ? asset.title : "",
      alt: typeof asset.alt === "string" ? asset.alt : "",
      src,
      exists: fs.existsSync(filePath),
    });
  }

  const assetDir = path.join(process.cwd(), "public", "article-assets", locale, slug);
  if (fs.existsSync(assetDir)) {
    for (const file of fs.readdirSync(assetDir).filter((item) => item.endsWith(".svg"))) {
      const src = `/article-assets/${locale}/${slug}/${file}`;
      if (!unique.has(src)) {
        unique.set(src, {
          type: path.basename(file, ".svg"),
          title: "",
          alt: `${slug} ${path.basename(file, ".svg")}`,
          src,
          exists: true,
        });
      }
    }
  }

  return Array.from(unique.values());
}

export async function GET(request: NextRequest, context: RouteContext) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const { slug } = await context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ message: "Invalid slug." }, { status: 400 });

  const locale = getLocale(slug);
  if (request.nextUrl.searchParams.get("view") === "review") {
    const reportPath = findReviewReport(slug);
    if (!reportPath) return NextResponse.json({ message: `没有找到质检报告：${slug}` }, { status: 404 });

    return NextResponse.json({
      slug,
      locale,
      stage: "review-report",
      editable: false,
      filePath: reportPath,
      markdown: fs.readFileSync(reportPath, "utf-8"),
      articleUrl: null,
    });
  }

  const article = findArticleFile(locale, slug);
  if (!article) return NextResponse.json({ message: `没有找到文章文件：${slug}` }, { status: 404 });

  const markdown = fs.readFileSync(article.filePath, "utf-8");

  return NextResponse.json({
    slug,
    locale,
    stage: article.stage,
    editable: canEditArticleStage(article.stage),
    filePath: article.filePath,
    markdown,
    visualAssets: extractVisualAssets(markdown, locale, slug),
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
  if (!canEditArticleStage(article.stage)) {
    return NextResponse.json({ message: "已发布文章不能在本地面板直接编辑，请新建修订稿后重新发布。" }, { status: 400 });
  }

  const draftPath = path.join(process.cwd(), "local-brain", "drafts", `${slug}.md`);
  fs.mkdirSync(path.dirname(draftPath), { recursive: true });
  fs.writeFileSync(draftPath, markdown, "utf-8");

  if (shouldDeleteOriginalAfterSave(article.stage, article.filePath, draftPath) && fs.existsSync(article.filePath)) {
    fs.unlinkSync(article.filePath);
  }

  const messages = getArticleEditMessages(article.stage, slug);
  updateRuntimeStatus(slug, locale, messages.logMessage);

  return NextResponse.json({
    success: true,
    slug,
    locale,
    stage: "draft",
    filePath: draftPath,
    markdown,
    visualAssets: extractVisualAssets(markdown, locale, slug),
    message: messages.responseMessage,
  });
}

function looksLikeMojibake(markdown: string) {
  const sample = markdown.slice(0, 4000);
  const suspicious = sample.match(/[ÃÂ][\u0080-\u00ff]|å[\u0080-\u00ff]|ç[\u0080-\u00ff]|è[\u0080-\u00ff]|é[\u0080-\u00ff]/gu) || [];
  const replacementRuns = sample.match(/\?{6,}|�{3,}/gu) || [];
  return suspicious.length >= 8 || replacementRuns.length > 0;
}

function updateRuntimeStatus(slug: string, locale: string, logMessage: string) {
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
    message: logMessage,
  });
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf-8");
}
