import { NextRequest } from "next/server";
import { proxyGaokaoBackend } from "@/lib/gaokao-essay/server-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return proxyGaokaoBackend(request, `/orders/${orderId}/refund-request`);
}
