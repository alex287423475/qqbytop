import { NextRequest } from "next/server";
import { proxyGaokaoBackend } from "@/lib/gaokao-essay/server-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  return proxyGaokaoBackend(request, `/drafts/${draftId}/confirm`);
}
