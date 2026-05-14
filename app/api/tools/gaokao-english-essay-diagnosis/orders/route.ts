import { NextRequest } from "next/server";
import { proxyGaokaoBackend } from "@/lib/gaokao-essay/server-proxy";

export async function POST(request: NextRequest) {
  return proxyGaokaoBackend(request, "/orders");
}
