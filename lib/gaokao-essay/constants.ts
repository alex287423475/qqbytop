export const GAOKAO_ESSAY_TOOL_BASE_PATH = "/tools/gaokao-english-essay-diagnosis";

export const GAOKAO_ESSAY_COMPANY_NAME = process.env.NEXT_PUBLIC_GAOKAO_ESSAY_COMPANY_NAME || "北京全球博译翻译服务有限公司";

export const GAOKAO_ESSAY_ICP = {
  text: process.env.NEXT_PUBLIC_GAOKAO_ESSAY_ICP_TEXT || "京ICP备2024089908号-1",
  href: process.env.NEXT_PUBLIC_GAOKAO_ESSAY_ICP_HREF || "https://beian.miit.gov.cn/",
} as const;

export const GAOKAO_ESSAY_SUPPORT_TICKET_URL = process.env.NEXT_PUBLIC_GAOKAO_ESSAY_SUPPORT_TICKET_URL || "";

export const GAOKAO_ESSAY_WORD_LIMITS = {
  min: 41,
  max: 350,
} as const;

export const GAOKAO_ESSAY_PRICING = {
  singlePriceCents: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_SINGLE_PRICE_CENTS || 9900),
  groupPriceCents: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_GROUP_PRICE_CENTS || 5300),
  packCredits: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_PACK_CREDITS || 20),
  currency: "CNY",
  groupRequiredMembers: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_GROUP_REQUIRED_MEMBERS || 3),
  groupExpiresHours: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_GROUP_EXPIRES_HOURS || 24),
  officialAssistEnabled: process.env.NEXT_PUBLIC_GAOKAO_ESSAY_OFFICIAL_ASSIST_ENABLED !== "false",
} as const;

export const GAOKAO_ESSAY_PRODUCT_TYPES = {
  singlePack: "essay_credit_pack_20",
  groupPack: "group_essay_credit_pack_20_member",
  legacySingle: "full_report_single",
  legacyGroup: "group_report_member",
} as const;

export const GAOKAO_ESSAY_FREE_LIMITS = {
  perIpPerHour: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_FREE_LIMIT_PER_IP_HOUR || 3),
  globalPerDay: Number(process.env.NEXT_PUBLIC_GAOKAO_ESSAY_FREE_GLOBAL_DAILY_LIMIT || 3000),
} as const;

export const AI_SERVICE_NOTICE = "本诊断报告由底层架构基于千万级真实语料生成。如遇系统异常，支持全额退款。";

export const GAOKAO_ESSAY_USE_BACKEND = process.env.NEXT_PUBLIC_GAOKAO_ESSAY_USE_BACKEND === "true";

export const GAOKAO_ESSAY_IMAGE_OCR_ENABLED = process.env.NEXT_PUBLIC_GAOKAO_ESSAY_IMAGE_OCR_ENABLED !== "false";

export const GAOKAO_ESSAY_BFF_ENDPOINTS = {
  drafts: "/api/tools/gaokao-english-essay-diagnosis/drafts",
  uploadIntents: "/api/tools/gaokao-english-essay-diagnosis/uploads/intents",
  completeUpload: (uploadIntentId: string) => `/api/tools/gaokao-english-essay-diagnosis/uploads/${uploadIntentId}/complete`,
  recognition: (draftId: string) => `/api/tools/gaokao-english-essay-diagnosis/drafts/${draftId}/recognition`,
  confirmDraft: (draftId: string) => `/api/tools/gaokao-english-essay-diagnosis/drafts/${draftId}/confirm`,
  reports: "/api/tools/gaokao-english-essay-diagnosis/reports",
  report: (reportId: string) => `/api/tools/gaokao-english-essay-diagnosis/reports/${reportId}`,
  unlockWithCredit: (reportId: string) => `/api/tools/gaokao-english-essay-diagnosis/reports/${reportId}/unlock-with-credit`,
  smartAppeal: (reportId: string) => `/api/tools/gaokao-english-essay-diagnosis/reports/${reportId}/smart-appeal`,
  orders: "/api/tools/gaokao-english-essay-diagnosis/orders",
  orderSync: (orderId: string) => `/api/tools/gaokao-english-essay-diagnosis/orders/${orderId}/sync`,
  officialAssist: (groupBuyId: string) => `/api/tools/gaokao-english-essay-diagnosis/groups/${groupBuyId}/official-assist`,
  refundRequest: (orderId: string) => `/api/tools/gaokao-english-essay-diagnosis/orders/${orderId}/refund-request`,
  supportChat: "/api/tools/gaokao-english-essay-diagnosis/support/chat",
} as const;

export const GAOKAO_ESSAY_BACKEND_ENDPOINTS = {
  drafts: "/api/v1/drafts",
  uploadIntents: "/api/v1/uploads/intents",
  completeUpload: (uploadIntentId: string) => `/api/v1/uploads/${uploadIntentId}/complete`,
  recognition: (draftId: string) => `/api/v1/drafts/${draftId}/recognition`,
  confirmDraft: (draftId: string) => `/api/v1/drafts/${draftId}/confirm`,
  reports: "/api/v1/reports",
  report: (reportId: string) => `/api/v1/reports/${reportId}`,
  unlockWithCredit: (reportId: string) => `/api/v1/reports/${reportId}/unlock-with-credit`,
  smartAppeal: (reportId: string) => `/api/v1/reports/${reportId}/smart-appeal`,
  orders: "/api/v1/orders",
  orderSync: (orderId: string) => `/api/v1/orders/${orderId}/sync`,
  officialAssist: (groupBuyId: string) => `/api/v1/groups/${groupBuyId}/official-assist`,
  refundRequest: (orderId: string) => `/api/v1/orders/${orderId}/refund-request`,
  supportChat: "/api/v1/support/chat",
} as const;

export function formatCny(cents: number) {
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
