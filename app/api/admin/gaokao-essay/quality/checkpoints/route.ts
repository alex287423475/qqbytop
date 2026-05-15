import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionError } from "@/lib/gaokao-essay/admin-auth";
import {
  listQualityCheckpoints,
  previewQualityCheckpointRestore,
  QualityConsoleError,
  restoreQualityCheckpoint,
} from "@/lib/gaokao-essay/quality-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await getAdminSessionError();
  if (authError) return authError;
  return NextResponse.json(await listQualityCheckpoints());
}

export async function POST(request: NextRequest) {
  const authError = await getAdminSessionError();
  if (authError) return authError;

  try {
    const body = (await request.json()) as { action?: "preview" | "restore"; ref?: string };
    if (!body.ref || !body.action) {
      return NextResponse.json({ message: "缺少 checkpoint 操作参数。" }, { status: 400 });
    }
    if (body.action === "preview") {
      return NextResponse.json(await previewQualityCheckpointRestore(body.ref));
    }
    if (body.action === "restore") {
      return NextResponse.json(await restoreQualityCheckpoint(body.ref));
    }
    return NextResponse.json({ message: "不支持的 checkpoint 操作。" }, { status: 400 });
  } catch (error) {
    if (error instanceof QualityConsoleError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "checkpoint 操作失败。" }, { status: 500 });
  }
}
