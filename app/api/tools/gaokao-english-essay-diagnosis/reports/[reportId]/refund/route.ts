import { NextResponse } from "next/server";
import type { RefundRequestResponse } from "@/lib/gaokao-essay/types";

export async function POST() {
  const payload: RefundRequestResponse = {
    refund_status: "REQUESTED",
    message: "请改用 /orders/{orderId}/refund-request。退款必须绑定订单和商户号，不能只根据 report_id 发起。",
  };
  return NextResponse.json(payload, { status: 409 });
}
