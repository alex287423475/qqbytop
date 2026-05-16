"use client";

import {
  confirmMockDraftText,
  createMockDraftAndReport,
  createMockImageDraft,
  createMockReportFromDraft,
  getMockDraft,
  getMockReport,
  listMockReports,
  unlockMockReport,
} from "./mock-store";
import { GAOKAO_ESSAY_BFF_ENDPOINTS, GAOKAO_ESSAY_PRODUCT_TYPES, GAOKAO_ESSAY_TOOL_BASE_PATH, GAOKAO_ESSAY_USE_BACKEND } from "./constants";
import type {
  CompleteUploadResponse,
  ConfirmTextResponse,
  CreateDraftResponse,
  CreateOrderResponse,
  CreateReportRequest,
  CreateReportResponse,
  CreateUploadIntentResponse,
  Draft,
  GaokaoEssayReport,
  MarketingAttribution,
  OcrResult,
  ProductType,
  SmartAppealResponse,
  SupportChatResponse,
  UnlockWithCreditResponse,
} from "./types";

const DRAFT_TOKEN_PREFIX = "gaokao_essay_draft_token_";

function saveDraftToken(draftId: string, token: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(`${DRAFT_TOKEN_PREFIX}${draftId}`, token);
}

function getDraftToken(draftId: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(`${DRAFT_TOKEN_PREFIX}${draftId}`);
}

function draftAuthHeaders(draftId: string) {
  const token = getDraftToken(draftId);
  return token ? { authorization: `Bearer ${token}` } : undefined;
}

async function postJson<TResponse>(url: string, body: unknown, extraHeaders?: Record<string, string>): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(payload.message || payload.detail || response.statusText);
  }
  return (await response.json()) as TResponse;
}

export function createLocalTextReport(input: {
  text: string;
  taskPrompt?: string | null;
  strategy?: CreateReportRequest["mock_strategy"];
  attribution?: MarketingAttribution | null;
}) {
  return createMockDraftAndReport(input.text, { strategy: input.strategy, attribution: input.attribution, taskPrompt: input.taskPrompt });
}

export async function createTextReport(input: {
  text: string;
  taskPrompt?: string | null;
  strategy?: CreateReportRequest["mock_strategy"];
  attribution?: MarketingAttribution | null;
}) {
  if (!GAOKAO_ESSAY_USE_BACKEND) {
    return createLocalTextReport(input);
  }

  const draft = await postJson<CreateDraftResponse>(GAOKAO_ESSAY_BFF_ENDPOINTS.drafts, {
    source_type: "text",
    raw_input_text: input.text,
    task_prompt: input.taskPrompt?.trim() || undefined,
    task_type: input.taskPrompt?.trim() ? "application_writing" : undefined,
    expected_word_count: input.taskPrompt?.trim() ? "80-120 words" : undefined,
    attribution_id: input.attribution?.attribution_id,
  });
  saveDraftToken(draft.draft_id, draft.draft_token);
  const report = await postJson<CreateReportResponse>(
    GAOKAO_ESSAY_BFF_ENDPOINTS.reports,
    {
      draft_id: draft.draft_id,
      mock_strategy: input.strategy || "instant",
    },
    draftAuthHeaders(draft.draft_id),
  );
  return {
    draft,
    report,
    reportHref: `${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${report.report_id}`,
  };
}

export async function createImageDraft(input: { file: File; attribution?: MarketingAttribution | null }) {
  if (!GAOKAO_ESSAY_USE_BACKEND) {
    return createMockImageDraft(input.file.name);
  }

  const draft = await postJson<CreateDraftResponse>(GAOKAO_ESSAY_BFF_ENDPOINTS.drafts, {
    source_type: "image",
    attribution_id: input.attribution?.attribution_id,
  });
  saveDraftToken(draft.draft_id, draft.draft_token);

  const intent = await postJson<CreateUploadIntentResponse>(
    GAOKAO_ESSAY_BFF_ENDPOINTS.uploadIntents,
    {
      draft_id: draft.draft_id,
      file_name: input.file.name,
      mime_type: input.file.type || "image/jpeg",
      size_bytes: input.file.size,
    },
    draftAuthHeaders(draft.draft_id),
  );

  // Mock COS URLs are intentionally not reachable. Production URLs must be direct PUTs to COS/OSS.
  if (!intent.upload_url.includes("mock-cos.local")) {
    const uploadResponse = await fetch(intent.upload_url, {
      method: "PUT",
      headers: { "content-type": input.file.type || "application/octet-stream" },
      body: input.file,
    });
    if (!uploadResponse.ok) throw new Error("图片直传云存储失败，请稍后重试。");
  }

  await postJson<CompleteUploadResponse>(
    GAOKAO_ESSAY_BFF_ENDPOINTS.completeUpload(intent.upload_intent_id),
    {
      bucket: intent.bucket,
      object_key: intent.object_key,
      mime_type: input.file.type || "image/jpeg",
      size_bytes: input.file.size,
    },
    draftAuthHeaders(draft.draft_id),
  );

  return {
    draft: { id: draft.draft_id } as Draft,
    reviewHref: `${GAOKAO_ESSAY_TOOL_BASE_PATH}/review/${draft.draft_id}`,
  };
}

export function getLocalDraft(draftId: string) {
  return getMockDraft(draftId);
}

export async function getRecognition(draftId: string): Promise<OcrResult | null> {
  const local = getLocalDraft(draftId);
  if (local?.ocr_result) return local.ocr_result;
  if (!GAOKAO_ESSAY_USE_BACKEND) return null;
  const response = await fetch(GAOKAO_ESSAY_BFF_ENDPOINTS.recognition(draftId), {
    cache: "no-store",
    headers: draftAuthHeaders(draftId),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { ocr_result?: OcrResult | null };
  return payload.ocr_result || null;
}

export async function confirmDraftAndCreateReport(input: { draftId: string; text: string; strategy?: CreateReportRequest["mock_strategy"] }) {
  if (!GAOKAO_ESSAY_USE_BACKEND) {
    const draft = confirmMockDraftText(input.draftId, input.text);
    if (!draft) throw new Error("草稿不存在，请重新上传图片。");
    const result = createMockReportFromDraft(input.draftId, input.strategy || "instant");
    if (!result) throw new Error("草稿尚未完成校对。");
    return result;
  }

  await postJson<ConfirmTextResponse>(
    GAOKAO_ESSAY_BFF_ENDPOINTS.confirmDraft(input.draftId),
    {
      confirmed_text: input.text,
    },
    draftAuthHeaders(input.draftId),
  );
  const report = await postJson<CreateReportResponse>(
    GAOKAO_ESSAY_BFF_ENDPOINTS.reports,
    {
      draft_id: input.draftId,
      mock_strategy: input.strategy || "instant",
    },
    draftAuthHeaders(input.draftId),
  );
  return {
    report,
    reportHref: `${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${report.report_id}`,
  };
}

export function getLocalReport(reportId: string) {
  return getMockReport(reportId);
}

export async function getReport(reportId: string) {
  const local = getLocalReport(reportId);
  if (local) return local;
  if (!GAOKAO_ESSAY_USE_BACKEND) return null;
  const response = await fetch(GAOKAO_ESSAY_BFF_ENDPOINTS.report(reportId), { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as GaokaoEssayReport;
}

export function unlockLocalReport(reportId: string) {
  return unlockMockReport(reportId);
}

export async function unlockReport(reportId: string, productType: ProductType = GAOKAO_ESSAY_PRODUCT_TYPES.singlePack, payerContact?: string) {
  if (!payerContact?.trim()) throw new Error("支付前需要先绑定手机号或邮箱。");
  if (!GAOKAO_ESSAY_USE_BACKEND) return unlockLocalReport(reportId);

  const order = await postJson<CreateOrderResponse>(GAOKAO_ESSAY_BFF_ENDPOINTS.orders, {
    report_id: reportId,
    product_type: productType,
    payer_contact: payerContact,
  });
  await postJson(GAOKAO_ESSAY_BFF_ENDPOINTS.orderSync(order.order_id), {});
  return getReport(reportId);
}

export async function unlockReportWithCredit(reportId: string, payerContact?: string) {
  if (!payerContact?.trim()) throw new Error("支付前需要先绑定手机号或邮箱。");
  if (!GAOKAO_ESSAY_USE_BACKEND) return unlockLocalReport(reportId);

  await postJson<UnlockWithCreditResponse>(GAOKAO_ESSAY_BFF_ENDPOINTS.unlockWithCredit(reportId), {
    payer_contact: payerContact,
  });
  return getReport(reportId);
}

export async function sendSupportChat(input: { reportId?: string; orderId?: string; message: string }) {
  if (!GAOKAO_ESSAY_USE_BACKEND) {
    return {
      message: "您好，我是系统护航助手。可以说明 99 元/53 元 20 篇额度包、免费摘要与完整报告区别、微信提取文字流程、智能申诉与重试、退款或补发权益规则。订单处理以系统状态机和审计记录为准。",
      suggested_actions: ["show_pricing_rules", "show_refund_policy"],
      escalation_allowed: false,
    } satisfies SupportChatResponse;
  }

  return postJson<SupportChatResponse>(GAOKAO_ESSAY_BFF_ENDPOINTS.supportChat, {
    report_id: input.reportId,
    order_id: input.orderId,
    message: input.message,
  });
}

export async function triggerSmartAppeal(reportId: string) {
  if (!GAOKAO_ESSAY_USE_BACKEND) {
    return {
      status_synced: true,
      retry_triggered: false,
      refund_triggered: false,
      current_report_status: "COMPLETED",
      message: "本地演示环境已收到智能申诉请求。真实环境会同步订单与报告状态，并在可恢复时自动重试。",
    } satisfies SmartAppealResponse;
  }

  return postJson<SmartAppealResponse>(GAOKAO_ESSAY_BFF_ENDPOINTS.smartAppeal(reportId), {
    reason: "report_not_generated",
  });
}

export function listLocalReports() {
  return listMockReports();
}
