import { proxyGaokaoAdminGet } from "@/lib/gaokao-essay/admin-server";

export async function GET() {
  return proxyGaokaoAdminGet("/funnel");
}
