import { NextRequest } from "next/server";
import { proxyGaokaoAdminPost } from "@/lib/gaokao-essay/admin-server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return proxyGaokaoAdminPost(`/reports/${encodeURIComponent(reportId)}/full-report-preview`);
}
