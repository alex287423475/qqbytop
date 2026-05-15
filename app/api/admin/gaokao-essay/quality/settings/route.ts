import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionError } from "@/lib/gaokao-essay/admin-auth";
import {
  getEditableQualitySettings,
  QualityConsoleError,
  saveEditableQualitySettings,
  type SaveQualitySettingsInput,
} from "@/lib/gaokao-essay/quality-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await getAdminSessionError();
  if (authError) return authError;
  return NextResponse.json(await getEditableQualitySettings());
}

export async function POST(request: NextRequest) {
  const authError = await getAdminSessionError();
  if (authError) return authError;

  try {
    const body = (await request.json()) as SaveQualitySettingsInput;
    return NextResponse.json(await saveEditableQualitySettings(body));
  } catch (error) {
    if (error instanceof QualityConsoleError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "质量设置保存失败。" }, { status: 500 });
  }
}
