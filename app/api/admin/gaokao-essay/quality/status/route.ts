import { NextResponse } from "next/server";
import { getAdminSessionError } from "@/lib/gaokao-essay/admin-auth";
import { getQualityStatus } from "@/lib/gaokao-essay/quality-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await getAdminSessionError();
  if (authError) return authError;
  return NextResponse.json(await getQualityStatus());
}
