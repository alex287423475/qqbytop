import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function clean(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求格式不正确。" }, { status: 400 });
  }

  const submission = {
    name: clean(body.name, 100),
    contact: clean(body.contact, 160),
    service_type: clean(body.service_type, 60),
    language_pair: clean(body.language_pair, 80),
    file_format: clean(body.file_format, 120),
    word_count: clean(body.word_count, 40),
    estimated_fee: clean(body.estimated_fee, 40),
    notes: clean(body.notes, 2000),
    submitted_at: new Date().toISOString(),
  };

  if (!submission.name || !submission.contact) {
    return NextResponse.json({ message: "请填写姓名和联系方式。" }, { status: 400 });
  }

  const webhookUrl = process.env.QUOTE_WEBHOOK_URL;

  if (webhookUrl) {
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    if (!webhookResponse.ok) {
      return NextResponse.json({ message: "询价已收到，但通知系统暂时不可用，请电话联系我们。" }, { status: 502 });
    }
  } else {
    console.info("quote_submission", JSON.stringify(submission));
  }

  return NextResponse.json({ message: "需求已提交，我们会尽快联系您。" });
}
