export type EssaySourceType = "text" | "image";
export type DraftStatus =
  | "TEXT_CREATED"
  | "IMAGE_DRAFT_CREATED"
  | "OCR_PENDING"
  | "OCR_COMPLETED"
  | "OCR_FAILED"
  | "TEXT_CONFIRMED";
export type ReportStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type OrderStatus = "PENDING" | "PAID" | "GROUP_SUCCESS" | "EXPIRED" | "REFUNDED";
export type RefundStatus = "NONE" | "REQUESTED" | "REFUNDED" | "REFUND_FAILED";
export type Severity = "minor" | "major" | "critical";
export type Confidence = "low" | "medium" | "high";
export type ProductType = "essay_credit_pack_20" | "group_essay_credit_pack_20_member" | "full_report_single" | "group_report_member" | "essay_credit_pack" | "monthly_pass" | string;

export type EssayScore = {
  estimated: number;
  max: number;
  confidence: Confidence;
  reason: string;
};

export type FreeSummaryRisk = {
  type: "grammar" | "vocabulary" | "logic" | "format" | "content" | string;
  severity: Severity;
  label: string;
};

export type FreeSummary = {
  score: EssayScore;
  top_risks: FreeSummaryRisk[];
  locked_sections: string[];
  notice: string;
};

export type HighlightSpan = {
  start: number;
  end: number;
  original: string;
  severity: Severity;
  category: string;
  comment: string;
  correction: string;
  principle: string;
  risk_note: string;
  position_status: "aligned" | "fuzzy_aligned" | "unresolved";
};

export type GaokaoDimension = {
  score: number;
  max: number;
  comment: string;
};

export type LogicMapItem = {
  paragraph: number;
  role: string;
  issue: string;
  suggestion: string;
};

export type RewriteVersions = {
  safe_version: string;
  advanced_version: string;
};

export type StudyPlanItem = {
  priority: number;
  skill: string;
  exercise: string;
};

export type FatalRisk = {
  title: string;
  severity: Severity;
  explanation: string;
};

export type AdvancedPhrase = {
  phrase: string;
  explanation: string;
};

export type DiagnosisMeta = {
  ocr_artifacts?: string[];
  uncertain_ocr_spans?: Array<{
    text: string;
    reason: string;
  }>;
};

export type FullReport = {
  overall_review: string;
  fatal_risks: FatalRisk[];
  gaokao_dimensions: Record<string, GaokaoDimension>;
  highlight_spans: HighlightSpan[];
  logic_map: LogicMapItem[];
  rewrites: RewriteVersions;
  study_plan: StudyPlanItem[];
  advanced_phrases: AdvancedPhrase[];
  disclaimer: string;
  diagnosis_meta?: DiagnosisMeta;
};

export type OcrResult = {
  transcribed_text: string;
  line_items: Array<{ line_no: number; text: string; confidence: number }>;
  uncertain_spans: Array<{ line_no: number; text: string; possible_values: string[]; reason: string }>;
  quality_warnings: string[];
  likely_ocr_artifacts: Array<{ text: string; reason: string }>;
};

export type GaokaoEssayReport = {
  id: string;
  draft_id: string;
  source_type: EssaySourceType;
  status: ReportStatus;
  confirmed_text: string;
  confirmed_text_hash: string;
  word_count: number;
  free_summary: FreeSummary | null;
  full_report: FullReport | null;
  is_unlocked: boolean;
  retry_count: number;
  last_retry_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Draft = {
  id: string;
  source_type: EssaySourceType;
  draft_status: DraftStatus;
  raw_input_text?: string | null;
  confirmed_text?: string | null;
  confirmed_text_hash?: string | null;
  word_count?: number | null;
  ocr_result?: OcrResult | null;
  created_at: string;
  updated_at: string;
};

export type GroupBuy = {
  id: string;
  report_id: string;
  required_members: number;
  paid_members: number;
  group_price_cents: number;
  status: "OPEN" | "SUCCESS" | "EXPIRED";
  official_assist_used: boolean;
  expires_at: string;
};

export type GroupMember = {
  id: string;
  group_buy_id: string;
  order_id?: string | null;
  display_name: string;
  is_official_assist: boolean;
  joined_at: string;
};

export type MarketingAttribution = {
  attribution_id: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_path: string;
  first_seen_at: string;
};

export type ConversionEvent = {
  id: string;
  order_id: string;
  attribution_id?: string | null;
  event_name: "Purchase" | "Refund";
  amount_cents: number;
  currency: "CNY";
  delivery_status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  ad_platform?: string | null;
};

export type CreateDraftRequest = { source_type: "text"; raw_input_text: string } | { source_type: "image" };
export type CreateDraftResponse = {
  draft_id: string;
  draft_token: string;
  confirmed: boolean;
  next_step: "create_report" | "confirm_text" | "upload_image";
  word_count?: number;
};
export type CreateUploadIntentRequest = { draft_id: string; file_name: string; mime_type: string; size_bytes: number };
export type CreateUploadIntentResponse = {
  upload_intent_id: string;
  upload_url: string;
  bucket: string;
  object_key: string;
  expires_at: string;
};
export type CompleteUploadRequest = { bucket: string; object_key: string; mime_type: string; size_bytes: number; sha256?: string };
export type CompleteUploadResponse = { draft_id: string; image_object_id: string; recognition_status: "PENDING" | "COMPLETED" | "FAILED" };
export type ConfirmTextRequest = { confirmed_text: string };
export type ConfirmTextResponse = { draft_id: string; confirmed: boolean; word_count?: number; confirmed_text_hash?: string };
export type CreateReportRequest = { draft_id: string; mock_strategy?: "instant" | "delayed" | "failed" };
export type CreateReportResponse = { report_id: string; status: ReportStatus; queue_position?: number };
export type GetReportResponse = GaokaoEssayReport;
export type CreateOrderRequest = { report_id: string; product_type: ProductType; quantity?: number; group_buy_id?: string; payer_contact?: string };
export type CreateOrderResponse = {
  order_id: string;
  order_status: OrderStatus;
  product_type: ProductType;
  amount_cents: number;
  payment_url?: string;
  merchant_account_id?: string;
  merchant_code?: string;
  group_buy_id?: string | null;
  credit_granted?: number | null;
  credit_remaining?: number | null;
};
export type UnlockWithCreditRequest = { payer_contact: string };
export type UnlockWithCreditResponse = { report_id: string; is_unlocked: boolean; credit_remaining: number };
export type SmartAppealRequest = { reason?: "report_not_generated" | string };
export type SmartAppealResponse = {
  status_synced: boolean;
  retry_triggered: boolean;
  refund_triggered: boolean;
  current_order_status?: OrderStatus | null;
  current_report_status: ReportStatus;
  message: string;
};
export type RefundRequestRequest = { reason?: string };
export type RefundRequestResponse = {
  refund_status: RefundStatus;
  message: string;
};
export type SupportChatRequest = { report_id?: string; order_id?: string; message: string };
export type SupportChatResponse = { message: string; suggested_actions?: string[]; escalation_allowed: false };

export type AdminExceptionItem = {
  kind: string;
  id: string;
  message: string;
  created_at: string;
};

export type FunnelResponse = {
  visits: number;
  drafts: number;
  reports_completed: number;
  unlock_clicks: number;
  orders: number;
  paid_orders: number;
  refunds: number;
  gross_revenue_cents: number;
  net_revenue_cents: number;
};
