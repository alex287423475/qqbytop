import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { normalizeKeywordRow, readKeywordRows, writeKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Keyword manager is disabled in production." }, { status: 403 });
  }

  return null;
}

function readRuntimeStage(slug: string) {
  const statusPath = path.join(process.cwd(), "local-brain", "status", "pipeline.runtime.json");
  if (!fs.existsSync(statusPath)) return null;

  try {
    const status = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
    return status?.articles?.[slug]?.stage || status?.items?.[slug]?.stage || null;
  } catch {
    return null;
  }
}

function getKeywordArticleStatus(row: { slug: string; locale?: string }) {
  const locale = row.locale || "zh";
  const checks = [
    { status: "published", label: "已发布", path: path.join(process.cwd(), "content", "articles", locale, row.slug, "index.md") },
    { status: "approved", label: "已审核", path: path.join(process.cwd(), "local-brain", "approved", `${row.slug}.md`) },
    { status: "validated", label: "已校验", path: path.join(process.cwd(), "local-brain", "validated", `${row.slug}.md`) },
    { status: "rewritten", label: "已重写", path: path.join(process.cwd(), "local-brain", "rewritten", `${row.slug}.md`) },
    { status: "draft", label: "已有草稿", path: path.join(process.cwd(), "local-brain", "drafts", `${row.slug}.md`) },
  ];
  const found = checks.find((item) => fs.existsSync(item.path));
  const runtimeStage = readRuntimeStage(row.slug);
  const status = found?.status || runtimeStage || "not-generated";

  return {
    articleStatus: status,
    articleStatusLabel: found?.label || (runtimeStage ? String(runtimeStage) : "未生成"),
    articleUrl: found?.status === "published" ? `/${locale}/blog/${row.slug}` : null,
    generated: Boolean(found),
  };
}

function getKeywordRowsWithArticleStatus() {
  return readKeywordRows().map((row) => ({
    ...row,
    ...getKeywordArticleStatus(row),
  }));
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  return NextResponse.json({ rows: getKeywordRowsWithArticleStatus() });
}

export async function POST(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  try {
    const row = normalizeKeywordRow(await request.json());
    const rows = readKeywordRows();

    if (rows.some((item) => item.slug === row.slug)) {
      return NextResponse.json({ message: `slug 已存在：${row.slug}` }, { status: 409 });
    }

    writeKeywordRows([...rows, row]);
    return NextResponse.json({ success: true, rows: getKeywordRowsWithArticleStatus() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "添加关键词失败。" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as { slug?: string };
  const slug = String(body.slug || "").trim();
  if (!slug) return NextResponse.json({ message: "slug 不能为空。" }, { status: 400 });

  const rows = readKeywordRows();
  const nextRows = rows.filter((row) => row.slug !== slug);

  if (nextRows.length === rows.length) {
    return NextResponse.json({ message: `没有找到 slug：${slug}` }, { status: 404 });
  }

  writeKeywordRows(nextRows);
  return NextResponse.json({ success: true, rows: getKeywordRowsWithArticleStatus() });
}
