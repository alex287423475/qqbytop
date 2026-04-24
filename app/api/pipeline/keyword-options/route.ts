import { NextRequest, NextResponse } from "next/server";
import { addKeywordOption, deleteKeywordOption, readKeywordOptions, type KeywordOptionType } from "@/lib/pipeline-keyword-options";

export const runtime = "nodejs";

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Keyword option manager is disabled in production." }, { status: 403 });
  }

  return null;
}

function normalizeType(value: unknown): KeywordOptionType {
  if (value === "category" || value === "intent") return value;
  throw new Error("type 必须是 category 或 intent。");
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  return NextResponse.json({ options: readKeywordOptions() });
}

export async function POST(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  try {
    const body = (await request.json().catch(() => ({}))) as { type?: string; value?: string };
    const options = addKeywordOption(normalizeType(body.type), String(body.value || ""));
    return NextResponse.json({ success: true, options });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "添加选项失败。" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  try {
    const body = (await request.json().catch(() => ({}))) as { type?: string; value?: string };
    const options = deleteKeywordOption(normalizeType(body.type), String(body.value || ""));
    return NextResponse.json({ success: true, options });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "删除选项失败。" }, { status: 400 });
  }
}
