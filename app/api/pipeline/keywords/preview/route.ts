import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

const stagePaths = [
  { stage: "published", resolve: (locale: string, slug: string) => path.join(process.cwd(), "content", "articles", locale, slug, "index.md") },
  { stage: "draft", resolve: (_locale: string, slug: string) => path.join(process.cwd(), "local-brain", "drafts", `${slug}.md`) },
  { stage: "validated", resolve: (_locale: string, slug: string) => path.join(process.cwd(), "local-brain", "validated", `${slug}.md`) },
  { stage: "approved", resolve: (_locale: string, slug: string) => path.join(process.cwd(), "local-brain", "approved", `${slug}.md`) },
];

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
    filePath: source?.filePath || null,
    markdown: source?.markdown || null,
  });
}
