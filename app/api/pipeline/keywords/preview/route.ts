import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextRequest, NextResponse } from "next/server";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

const stagePaths = [
  { stage: "published", resolve: (locale: string, slug: string) => path.join(process.cwd(), "content", "articles", locale, slug, "index.md") },
  { stage: "draft", resolve: (_locale: string, slug: string) => path.join(process.cwd(), "local-brain", "drafts", `${slug}.md`) },
  { stage: "validated", resolve: (_locale: string, slug: string) => path.join(process.cwd(), "local-brain", "validated", `${slug}.md`) },
  { stage: "approved", resolve: (_locale: string, slug: string) => path.join(process.cwd(), "local-brain", "approved", `${slug}.md`) },
];

function extractVisualAssets(markdown: string, locale: string, slug: string) {
  const parsed = matter(markdown);
  const fromFrontmatter = Array.isArray(parsed.data.visuals) ? parsed.data.visuals : [];
  const fromMarkdown = Array.from(markdown.matchAll(/!\[([^\]]*)]\((\/article-assets\/[^)]+\.svg)\)/g)).map((match) => ({
    alt: match[1],
    src: match[2],
  }));

  const unique = new Map<string, { type: string; title: string; alt: string; src: string; exists: boolean }>();
  for (const asset of [...fromFrontmatter, ...fromMarkdown]) {
    const src = typeof asset.src === "string" ? asset.src : "";
    if (!src.startsWith("/article-assets/")) continue;
    unique.set(src, {
      type: typeof asset.type === "string" ? asset.type : path.basename(src, ".svg"),
      title: typeof asset.title === "string" ? asset.title : "",
      alt: typeof asset.alt === "string" ? asset.alt : "",
      src,
      exists: fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, ""))),
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

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Keyword preview is disabled in production." }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ message: "slug 不能为空。" }, { status: 400 });

  const row = readKeywordRows().find((item) => item.slug === slug);
  if (!row) return NextResponse.json({ message: `没有找到 slug：${slug}` }, { status: 404 });

  const source = stagePaths
    .map((item) => {
      const filePath = item.resolve(row.locale, row.slug);
      return fs.existsSync(filePath) ? { stage: item.stage, filePath, markdown: fs.readFileSync(filePath, "utf-8") } : null;
    })
    .find(Boolean);

  return NextResponse.json({
    row,
    articleUrl: source?.stage === "published" ? `/${row.locale}/blog/${row.slug}` : null,
    stage: source?.stage || "keyword-only",
    editable: source?.stage === "draft" || source?.stage === "validated" || source?.stage === "approved",
    filePath: source?.filePath || null,
    markdown: source?.markdown || null,
    visualAssets: source?.markdown ? extractVisualAssets(source.markdown, row.locale, row.slug) : [],
  });
}
