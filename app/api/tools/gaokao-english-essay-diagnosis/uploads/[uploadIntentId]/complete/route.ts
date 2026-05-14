import { NextRequest } from "next/server";
import { proxyGaokaoBackend } from "@/lib/gaokao-essay/server-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ uploadIntentId: string }> }) {
  const { uploadIntentId } = await params;
  return proxyGaokaoBackend(request, `/uploads/${uploadIntentId}/complete`);
}
