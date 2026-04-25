import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { assessQuoteLead } from "@/lib/quote-lead";

export const runtime = "nodejs";

type QuoteSubmission = {
  name: string;
  contact: string;
  service_type: string;
  language_pair: string;
  file_format: string;
  word_count: string;
  estimated_fee: string;
  source: string;
  category: string;
  notes: string;
  submitted_at: string;
};

function clean(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, maxLength);
}

function buildSubmission(body: Record<string, unknown>): QuoteSubmission {
  return {
    name: clean(body.name, 100),
    contact: clean(body.contact, 160),
    service_type: clean(body.service_type, 60),
    language_pair: clean(body.language_pair, 80),
    file_format: clean(body.file_format, 120),
    word_count: clean(body.word_count, 40),
    estimated_fee: clean(body.estimated_fee, 40),
    source: clean(body.source, 40),
    category: clean(body.category, 80),
    notes: clean(body.notes, 2000),
    submitted_at: new Date().toISOString(),
  };
}

function buildFeishuText(submission: QuoteSubmission) {
  const assessment = assessQuoteLead({
    source: submission.source,
    category: submission.category,
  });

  return [
    "【QQBY 官网询价】",
    `线索标签：${assessment.leadTag}`,
    `线索分层：${assessment.leadGroupBadge} ${assessment.leadGroup}`,
    `来源说明：${assessment.sourceLabel}`,
    `优先级建议：${assessment.priorityBadge} ${assessment.priorityLabel} / ${assessment.followUpSuggestion}`,
    `建议理由：${assessment.priorityReason}`,
    `姓名：${submission.name}`,
    `联系方式：${submission.contact}`,
    `服务级别：${submission.service_type || "未选择"}`,
    `翻译方向：${submission.language_pair || "未填写"}`,
    `文件格式：${submission.file_format || "未填写"}`,
    `预估字数：${submission.word_count || "未填写"}`,
    `预估费用：${submission.estimated_fee ? `约 ${submission.estimated_fee} 元` : "待计算"}`,
    `分类：${submission.category || "无"}`,
    `需求说明：${submission.notes || "无"}`,
    `提交时间：${submission.submitted_at}`,
  ].join("\n");
}

function signFeishuRequest(secret: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = createHmac("sha256", stringToSign).update("").digest("base64");

  return { timestamp, sign };
}

async function sendFeishuNotification(submission: QuoteSubmission) {
  const webhookUrl = process.env.QUOTE_FEISHU_WEBHOOK_URL;
  if (!webhookUrl) return true;

  const secret = process.env.QUOTE_FEISHU_SECRET;
  const signedFields = secret ? signFeishuRequest(secret) : {};
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...signedFields,
      msg_type: "text",
      content: {
        text: buildFeishuText(submission),
      },
    }),
  });

  if (!response.ok) {
    console.error("quote_feishu_failed", response.status, await response.text());
    return false;
  }

  const result = (await response.json().catch(() => null)) as
    | { code?: number; StatusCode?: number; msg?: string; StatusMessage?: string }
    | null;
  const statusCode = result?.code ?? result?.StatusCode;
  if (typeof statusCode === "number" && statusCode !== 0) {
    console.error("quote_feishu_failed", statusCode, result?.msg || result?.StatusMessage || "unknown error");
    return false;
  }

  return true;
}

async function sendGenericWebhook(submission: QuoteSubmission) {
  const webhookUrl = process.env.QUOTE_WEBHOOK_URL;
  if (!webhookUrl) return true;

  const assessment = assessQuoteLead({
    source: submission.source,
    category: submission.category,
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...submission,
      lead_tag: assessment.leadTag,
      source_label: assessment.sourceLabel,
      lead_group: assessment.leadGroup,
      lead_group_badge: assessment.leadGroupBadge,
      priority_label: assessment.priorityLabel,
      priority_badge: assessment.priorityBadge,
      follow_up_suggestion: assessment.followUpSuggestion,
      priority_reason: assessment.priorityReason,
    }),
  });

  if (!response.ok) {
    console.error("quote_webhook_failed", response.status, await response.text());
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求格式不正确。" }, { status: 400 });
  }

  const submission = buildSubmission(body);

  if (!submission.name || !submission.contact) {
    return NextResponse.json({ message: "请填写姓名和联系方式。" }, { status: 400 });
  }

  const feishuOk = await sendFeishuNotification(submission);
  const webhookOk = await sendGenericWebhook(submission);

  if (!process.env.QUOTE_FEISHU_WEBHOOK_URL && !process.env.QUOTE_WEBHOOK_URL) {
    const assessment = assessQuoteLead({
      source: submission.source,
      category: submission.category,
    });

    console.info(
      "quote_submission",
      JSON.stringify({
        ...submission,
        lead_tag: assessment.leadTag,
        source_label: assessment.sourceLabel,
        lead_group: assessment.leadGroup,
        lead_group_badge: assessment.leadGroupBadge,
        priority_label: assessment.priorityLabel,
        priority_badge: assessment.priorityBadge,
        follow_up_suggestion: assessment.followUpSuggestion,
        priority_reason: assessment.priorityReason,
      }),
    );
  }

  if (!feishuOk || !webhookOk) {
    return NextResponse.json(
      { message: "询价已收到，但通知系统暂时不可用，请电话联系我们。" },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: "需求已提交，我们会尽快联系您。" });
}
