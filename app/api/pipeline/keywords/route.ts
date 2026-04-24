import { NextRequest, NextResponse } from "next/server";
import { normalizeKeywordRow, readKeywordRows, writeKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Keyword manager is disabled in production." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  return NextResponse.json({ rows: readKeywordRows() });
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
    return NextResponse.json({ success: true, rows: readKeywordRows() });
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
  return NextResponse.json({ success: true, rows: readKeywordRows() });
}
