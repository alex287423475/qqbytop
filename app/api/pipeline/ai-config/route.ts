import { NextRequest, NextResponse } from "next/server";
import { getAiConfig, saveAiConfig } from "@/lib/pipeline-ai-config";

export const runtime = "nodejs";

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "AI config is disabled in production." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  return NextResponse.json(getAiConfig());
}

export async function POST(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  try {
    const body = await request.json();
    return NextResponse.json({ success: true, config: saveAiConfig(body) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "保存 AI 配置失败。" }, { status: 400 });
  }
}
