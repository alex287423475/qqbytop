import { NextRequest } from "next/server";
import { proxyGaokaoBackend } from "@/lib/gaokao-essay/server-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupBuyId: string }> }) {
  const { groupBuyId } = await params;
  return proxyGaokaoBackend(request, `/groups/${groupBuyId}/official-assist`);
}
