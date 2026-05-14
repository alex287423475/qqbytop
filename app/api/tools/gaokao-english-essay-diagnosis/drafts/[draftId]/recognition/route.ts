import { NextRequest } from "next/server";
import { proxyGaokaoBackend } from "@/lib/gaokao-essay/server-proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  return proxyGaokaoBackend(request, `/drafts/${draftId}/recognition`);
}
