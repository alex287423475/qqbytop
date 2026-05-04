import { promises as fs } from "fs";
import path from "path";
import { contact } from "@/lib/contact";
import { sanitizeUserContext } from "@/lib/diagnose-tools/sanitize";
import { serviceNames } from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import type { LeadSubmission, ServiceName } from "@/lib/diagnose-tools/types";

export class LeadStoreError extends Error {
  status = 502;

  constructor(message: string) {
    super(message);
    this.name = "LeadStoreError";
  }
}

function enumService(value: unknown): ServiceName {
  const text = sanitizeUserContext(value, 80);
  return serviceNames.includes(text as ServiceName) ? (text as ServiceName) : "文书深度优化";
}

export function buildLeadSubmission(body: Record<string, unknown>): LeadSubmission {
  return {
    diagnosticId: sanitizeUserContext(body.diagnosticId, 80),
    selectedService: enumService(body.selectedService),
    name: sanitizeUserContext(body.name, 80),
    contact: sanitizeUserContext(body.contact, 140),
    note: sanitizeUserContext(body.note, 500),
    authorizeEssayReview: body.authorizeEssayReview === true,
    applicationStage: sanitizeUserContext(body.applicationStage, 20) as LeadSubmission["applicationStage"],
    targetMajor: sanitizeUserContext(body.targetMajor, 120),
    documentType: sanitizeUserContext(body.documentType, 40) as LeadSubmission["documentType"],
  };
}

function buildEmailText(lead: LeadSubmission) {
  return [
    "【QQBY 留学文书诊断线索】",
    `诊断ID：${lead.diagnosticId || "未提供"}`,
    `选择服务：${lead.selectedService}`,
    `姓名：${lead.name}`,
    `联系方式：${lead.contact}`,
    `申请阶段：${lead.applicationStage || "未提供"}`,
    `目标专业：${lead.targetMajor || "未提供"}`,
    `文书类型：${lead.documentType || "未提供"}`,
    `授权顾问查看完整文书：${lead.authorizeEssayReview ? "是" : "否"}`,
    `需求说明：${lead.note || "无"}`,
    `提交时间：${new Date().toISOString()}`,
    `备用联系：${contact.phone} / ${contact.email}`,
    "",
    "隐私提示：第一版默认不保存完整文书正文。若用户未授权，请勿索取或传播正文内容。",
  ].join("\n");
}

async function sendResendLead(lead: LeadSubmission) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.RESEND_FROM || "";
  const to = process.env.STUDY_ABROAD_LEAD_NOTIFY_EMAIL || process.env.LEAD_NOTIFY_EMAIL || "info@qqbytop.com";
  if (!apiKey || !from || !to) {
    throw new LeadStoreError("留资通知暂未配置，请直接拨打 400-869-9562 或发送邮件到 info@qqbytop.com。");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `留学文书诊断线索 ${lead.selectedService}`,
      text: buildEmailText(lead),
    }),
  });

  if (!response.ok) throw new LeadStoreError("线索通知发送失败，请直接电话联系我们。");
}

async function writeLocalLead(lead: LeadSubmission) {
  const file = path.join(process.cwd(), "data", "study-abroad-essay-leads.jsonl");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, `${JSON.stringify({ ...lead, submittedAt: new Date().toISOString() })}\n`, "utf8");
}

export async function saveStudyAbroadEssayLead(lead: LeadSubmission) {
  if (!lead.name || !lead.contact) throw new LeadStoreError("请填写姓名和联系方式。");

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    await sendResendLead(lead);
    return;
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM && process.env.LEAD_NOTIFY_EMAIL) {
    await sendResendLead(lead);
    return;
  }

  await writeLocalLead(lead);
}
