import { NextRequest, NextResponse } from "next/server";
import { getKeywordSourceConfig, saveKeywordSourceConfig } from "@/lib/pipeline-keyword-source-config";

export const runtime = "nodejs";

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Keyword source config is disabled in production." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  return NextResponse.json(getKeywordSourceConfig());
}

export async function POST(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const body = await request.json().catch(() => ({}));
  return NextResponse.json(saveKeywordSourceConfig(body));
}
