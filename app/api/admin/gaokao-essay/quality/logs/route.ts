import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionError } from "@/lib/gaokao-essay/admin-auth";
import { getQualityLogs, QualityConsoleError } from "@/lib/gaokao-essay/quality-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await getAdminSessionError();
  if (authError) return authError;

  try {
    const runId = request.nextUrl.searchParams.get("runId") || "";
    return NextResponse.json(await getQualityLogs(runId));
  } catch (error) {
    if (error instanceof QualityConsoleError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "日志读取失败。" }, { status: 500 });
  }
}
