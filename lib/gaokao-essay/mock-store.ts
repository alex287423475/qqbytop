"use client";

import { GAOKAO_ESSAY_TOOL_BASE_PATH } from "./constants";
import { countEnglishWords, createConfirmedTextHash, normalizeEssayText } from "./schemas";
import type {
  CreateReportRequest,
  Draft,
  FullReport,
  GaokaoEssayReport,
  MarketingAttribution,
  OcrResult,
  ReportStatus,
} from "./types";

const DRAFTS_KEY = "gaokao_essay_mock_drafts_v2";
const REPORTS_KEY = "gaokao_essay_mock_reports_v2";

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readRecord<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(key);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, T>;
  } catch {
    window.localStorage.removeItem(key);
    return {};
  }
}

function writeRecord<T>(key: string, value: Record<string, T>) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mockOcrResult(fileName?: string): OcrResult {
  const transcribedText = [
    "Dear editor,",
    "Recently our school has started a campaign about green life. Students can bring reusable bottles and turn off lights after class.",
    "We can also reuse paper and remind our friends to save water. Although these actions look small, they will help us build better habits.",
    "If everyone takes one step, our school will become cleaner and more beautiful.",
    "Yours,",
    "Li Hua",
  ].join("\n");

  return {
    transcribed_text: transcribedText,
    line_items: transcribedText.split("\n").map((text, index) => ({
      line_no: index + 1,
      text,
      confidence: index === 1 ? 0.86 : 0.94,
    })),
    uncertain_spans: [
      {
        line_no: 2,
        text: "green life",
        possible_values: ["green life", "great life"],
        reason: "手写 g/r 形态接近，需要在校对页确认。",
      },
    ],
    quality_warnings: fileName?.toLowerCase().endsWith(".heic")
      ? ["HEIC 需要在前端转为 JPEG 后再上传；当前为本地 mock 识别。"]
      : [],
    likely_ocr_artifacts: [
      {
        text: "rn/m",
        reason: "OCR 可能把 rn 误识别为 m，诊断模型会在内部做容错判断。",
      },
    ],
  };
}

function buildFreeSummary(text: string, wordCount: number) {
  const hasConnector = /\b(first|second|moreover|however|therefore|finally|in conclusion|although|because)\b/i.test(text);
  const hasExample = /\b(for example|such as|for instance|if everyone|students can)\b/i.test(text);
  const estimated = Math.max(12, Math.min(23, 15 + (hasConnector ? 2 : 0) + (hasExample ? 2 : 0) + (wordCount > 110 ? 2 : 0)));

  return {
    score: {
      estimated,
      max: 25,
      confidence: "medium" as const,
      reason: "基于篇幅、衔接信号、例证密度与基础语法稳定性给出的 AI 预估。",
    },
    top_risks: [
      {
        type: "logic",
        severity: hasConnector ? ("minor" as const) : ("major" as const),
        label: hasConnector ? "段落推进基本清晰" : "段落衔接信号不足",
      },
      {
        type: "content",
        severity: hasExample ? ("minor" as const) : ("major" as const),
        label: hasExample ? "已有行动例证，但可更贴题" : "观点缺少具体例证支撑",
      },
      {
        type: "format",
        severity: wordCount >= 80 ? ("minor" as const) : ("major" as const),
        label: wordCount >= 80 ? "篇幅基本满足任务要求" : "篇幅偏短，论证展开不足",
      },
    ],
    locked_sections: ["逐句荧光笔标注", "高考评分维度拆解", "稳健版与进阶版范文", "AI 演算母题库"],
    notice: "免费层仅暴露风险类型和严重度，不提供逐句修改、范文或完整训练方案。",
  };
}

function buildFullReport(text: string): FullReport {
  const firstLongSentence =
    text
      .split(/[.!?]/)
      .find((sentence) => sentence.trim().split(/\s+/).length > 12)
      ?.trim() || "Recently our school has started a campaign about green life";
  const start = text.indexOf(firstLongSentence);

  return {
    overall_review:
      "这篇作文主题方向明确，能围绕任务给出基本观点，但目前最影响分数的是例证不够具体、句式层次不够丰富。完整报告会把关键扣分点定位到句子，并给出可直接模仿的改写路径。",
    fatal_risks: [
      { title: "论证支撑偏弱", severity: "major", explanation: "观点已经出现，但缺少具体校园场景或行动结果，内容分上限会被压低。" },
      { title: "句式变化不足", severity: "major", explanation: "简单句较多，缺少从句、非谓语或强调结构，语言亮点不足。" },
      { title: "结尾升华不够", severity: "minor", explanation: "结尾能回扣主题，但没有把个人行动上升到校园责任或社会意义。" },
    ],
    gaokao_dimensions: {
      content: { score: 4, max: 5, comment: "主题贴合任务，观点明确，但例证可以进一步具体化。" },
      language: { score: 4, max: 5, comment: "基础语法较稳定，可以增加更自然的复合句和高级表达。" },
      structure: { score: 4, max: 5, comment: "开头、主体和结尾完整，段间推进仍可更清晰。" },
      cohesion: { score: 3, max: 5, comment: "衔接词存在，但部分句间因果关系需要补足。" },
      format: { score: 4, max: 5, comment: "格式基本符合常见高考书信或投稿任务要求。" },
    },
    highlight_spans: [
      {
        start: Math.max(0, start),
        end: Math.max(0, start) + firstLongSentence.length,
        original: firstLongSentence,
        severity: "major",
        category: "logic",
        comment: "这一句承载信息较多，建议拆分为观点句和解释句。",
        correction: "This activity is meaningful because small daily habits, such as sorting waste and saving electricity, can gradually improve our campus environment.",
        principle: "把泛泛观点拆成“动作 + 结果”，能让阅卷者看到论证支撑，而不只是口号。",
        risk_note: "如果主体段只有抽象判断，容易被判定为内容展开不足。",
        position_status: start >= 0 ? "aligned" : "fuzzy_aligned",
      },
      {
        start: 9999,
        end: 10010,
        original: "unmatched phrase",
        severity: "minor",
        category: "position",
        comment: "此 mock 问题用于验证 unresolved 高亮降级展示。",
        correction: "Although the exact phrase cannot be located, this point should be rewritten with a clearer cause-and-effect structure.",
        principle: "无法精确定位时仍给出结构性改写方向，避免前端白屏或遗漏建议。",
        risk_note: "定位失败不会影响报告生成，但该问题会以列表形式提示。",
        position_status: "unresolved",
      },
      {
        start: 0,
        end: Math.min(24, text.length),
        original: text.slice(0, Math.min(24, text.length)) || "opening sentence",
        severity: "minor",
        category: "language",
        comment: "开头可以更快点明任务背景，避免进入主题过慢。",
        correction: "Recently, our school has launched a meaningful campaign to encourage greener daily habits.",
        principle: "用 launched a meaningful campaign 快速交代背景，比普通开头更符合高考应用文语气。",
        risk_note: "开头不清晰通常不会重扣，但会影响第一印象和结构分。",
        position_status: text.length > 0 ? "aligned" : "unresolved",
      },
    ],
    logic_map: [
      {
        paragraph: 1,
        role: "背景与立场",
        issue: "立场清晰，但活动背景可以更具体。",
        suggestion: "补充活动目的或校园场景。",
      },
      {
        paragraph: 2,
        role: "行动与结果",
        issue: "行动方向正确，但解释链条偏短。",
        suggestion: "加入结果句说明行动价值。",
      },
    ],
    rewrites: {
      safe_version:
        "Recently, our school has encouraged students to live a greener life. I believe this activity is useful because small habits can gradually change our campus.",
      advanced_version:
        "By turning simple environmental choices into daily routines, students can make the campus cleaner while developing a stronger sense of responsibility.",
    },
    study_plan: [
      { priority: 1, skill: "例证展开", exercise: "每天用 one action + one reason + one result 写 3 组句子。" },
      { priority: 2, skill: "衔接推进", exercise: "练习 however / therefore / as a result 的句间逻辑。" },
      { priority: 3, skill: "结尾升华", exercise: "用 responsibility / campus / future 三个关键词各写 2 个结尾句。" },
    ],
    advanced_phrases: [
      { phrase: "daily habits", explanation: "比 simple things 更自然，适合环保、校园倡议类话题。" },
      { phrase: "improve our campus environment", explanation: "明确结果，能让观点更落地。" },
      { phrase: "a stronger sense of responsibility", explanation: "适合结尾升华，能把行动上升到品质培养。" },
    ],
    disclaimer: "本报告为 AI 辅助诊断，不承诺高考提分或最终得分。",
    diagnosis_meta: { ocr_artifacts: [], uncertain_ocr_spans: [] },
  };
}

export function createMockDraftAndReport(text: string, options?: { strategy?: CreateReportRequest["mock_strategy"]; attribution?: MarketingAttribution | null }) {
  const normalized = normalizeEssayText(text);
  const wordCount = countEnglishWords(normalized);
  const textHash = createConfirmedTextHash(normalized);
  const timestamp = now();
  const draftId = createId("draft");
  const reportId = createId("report");
  const strategy = options?.strategy || "instant";
  const status: ReportStatus = strategy === "failed" ? "FAILED" : strategy === "delayed" ? "QUEUED" : "COMPLETED";

  const draft: Draft = {
    id: draftId,
    source_type: "text",
    draft_status: "TEXT_CONFIRMED",
    raw_input_text: normalized,
    confirmed_text: normalized,
    confirmed_text_hash: textHash,
    word_count: wordCount,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const report: GaokaoEssayReport = {
    id: reportId,
    draft_id: draftId,
    source_type: "text",
    status,
    confirmed_text: normalized,
    confirmed_text_hash: textHash,
    word_count: wordCount,
    free_summary: strategy === "failed" ? null : buildFreeSummary(normalized, wordCount),
    full_report: null,
    is_unlocked: false,
    retry_count: 0,
    last_retry_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  upsertDraft(draft);
  updateMockReport(report);

  if (options?.attribution) {
    window.localStorage.setItem(`gaokao_essay_report_attr_${reportId}`, JSON.stringify(options.attribution));
  }

  return { draft, report, reportHref: `${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${reportId}` };
}

export function createMockImageDraft(fileName?: string) {
  const timestamp = now();
  const draftId = createId("draft");
  const ocr = mockOcrResult(fileName);
  const draft: Draft = {
    id: draftId,
    source_type: "image",
    draft_status: "OCR_COMPLETED",
    raw_input_text: null,
    confirmed_text: null,
    confirmed_text_hash: null,
    word_count: null,
    ocr_result: ocr,
    created_at: timestamp,
    updated_at: timestamp,
  };
  upsertDraft(draft);
  return {
    draft,
    reviewHref: `${GAOKAO_ESSAY_TOOL_BASE_PATH}/review/${draftId}`,
  };
}

export function getMockDraft(draftId: string) {
  return readRecord<Draft>(DRAFTS_KEY)[draftId] || null;
}

export function upsertDraft(draft: Draft) {
  const drafts = readRecord<Draft>(DRAFTS_KEY);
  drafts[draft.id] = { ...draft, updated_at: now() };
  writeRecord(DRAFTS_KEY, drafts);
}

export function confirmMockDraftText(draftId: string, text: string) {
  const draft = getMockDraft(draftId);
  if (!draft) return null;
  const normalized = normalizeEssayText(text);
  const next: Draft = {
    ...draft,
    draft_status: "TEXT_CONFIRMED",
    confirmed_text: normalized,
    confirmed_text_hash: createConfirmedTextHash(normalized),
    word_count: countEnglishWords(normalized),
    updated_at: now(),
  };
  upsertDraft(next);
  return next;
}

export function createMockReportFromDraft(draftId: string, strategy: CreateReportRequest["mock_strategy"] = "instant") {
  const draft = getMockDraft(draftId);
  if (!draft?.confirmed_text || !draft.confirmed_text_hash || !draft.word_count) return null;
  const reportId = createId("report");
  const timestamp = now();
  const status: ReportStatus = strategy === "failed" ? "FAILED" : strategy === "delayed" ? "QUEUED" : "COMPLETED";
  const report: GaokaoEssayReport = {
    id: reportId,
    draft_id: draft.id,
    source_type: draft.source_type,
    status,
    confirmed_text: draft.confirmed_text,
    confirmed_text_hash: draft.confirmed_text_hash,
    word_count: draft.word_count,
    free_summary: strategy === "failed" ? null : buildFreeSummary(draft.confirmed_text, draft.word_count),
    full_report: null,
    is_unlocked: false,
    retry_count: 0,
    last_retry_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
  updateMockReport(report);
  return { draft, report, reportHref: `${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${reportId}` };
}

export function unlockMockReport(reportId: string) {
  const report = getMockReport(reportId);
  if (!report) return null;
  const next = {
    ...report,
    status: "COMPLETED" as const,
    full_report: buildFullReport(report.confirmed_text),
    is_unlocked: true,
    updated_at: now(),
  };
  updateMockReport(next);
  return next;
}

export function getMockReport(reportId: string) {
  return readRecord<GaokaoEssayReport>(REPORTS_KEY)[reportId] || null;
}

export function updateMockReport(report: GaokaoEssayReport) {
  const reports = readRecord<GaokaoEssayReport>(REPORTS_KEY);
  reports[report.id] = { ...report, updated_at: now() };
  writeRecord(REPORTS_KEY, reports);
}

export function listMockReports() {
  return Object.values(readRecord<GaokaoEssayReport>(REPORTS_KEY)).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
