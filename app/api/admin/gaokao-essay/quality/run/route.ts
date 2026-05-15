import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionError } from "@/lib/gaokao-essay/admin-auth";
import { QualityConsoleError, startQualityRun, type QualityTaskType } from "@/lib/gaokao-essay/quality-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await getAdminSessionError();
  if (authError) return authError;

  try {
    const body = (await request.json()) as { taskType?: QualityTaskType };
    const record = await startQualityRun(String(body.taskType || "") as QualityTaskType);
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof QualityConsoleError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "质量任务启动失败。" }, { status: 500 });
  }
}
