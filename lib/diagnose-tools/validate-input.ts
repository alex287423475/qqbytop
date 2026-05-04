import {
  applicationStages,
  essayDocumentTypes,
} from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import { sanitizePlainText, sanitizeUserContext } from "@/lib/diagnose-tools/sanitize";
import type {
  ApplicationStage,
  Confidence,
  DraftStage,
  EssayDiagnosisRequest,
  EssayDocumentType,
  InputStats,
  ValidatedEssayDiagnosisRequest,
} from "@/lib/diagnose-tools/types";

const draftStages: DraftStage[] = ["初稿", "修改稿", "已定稿", "不确定"];

export class InputValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function getInputStats(essayText: string): InputStats {
  const text = String(essayText || "");
  const englishWordCount = (text.match(/[A-Za-z]+(?:['-][A-Za-z]+)?/g) || []).length;
  const chineseCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const visibleCount = text.replace(/\s/g, "").length || 1;
  return {
    charCount: text.length,
    englishWordCount,
    chineseRatio: Number((chineseCount / visibleCount).toFixed(3)),
  };
}

export function getBaseConfidence(stats: InputStats, hasCompleteContext: boolean): Confidence {
  if (stats.englishWordCount < 300 || stats.chineseRatio > 0.5 || !hasCompleteContext) return "low";
  if (stats.englishWordCount <= 1500) return "high";
  return "normal";
}

function oneOf<T extends string>(value: string, options: readonly T[], fallback: T) {
  return options.includes(value as T) ? (value as T) : fallback;
}

export function validateEssayDiagnosisInput(payload: unknown): ValidatedEssayDiagnosisRequest {
  const body = (payload || {}) as Record<string, unknown>;
  const applicationStage = oneOf(
    sanitizeUserContext(body.applicationStage, 20),
    applicationStages,
    "硕士",
  ) as ApplicationStage;
  const documentType = oneOf(
    sanitizeUserContext(body.documentType, 40),
    essayDocumentTypes,
    "不确定",
  ) as EssayDocumentType;
  const targetMajor = sanitizeUserContext(body.targetMajor, 120);
  const essayText = sanitizePlainText(body.essayText, 16000);
  const stats = getInputStats(essayText);

  if (!targetMajor) throw new InputValidationError("请填写目标专业。");
  if (!essayText) throw new InputValidationError("请粘贴一篇 PS / SOP 初稿后再诊断。");
  if (stats.charCount > 15000 || stats.englishWordCount > 2500) {
    throw new InputValidationError("这篇内容过长，可能包含多篇材料。请只粘贴一篇 PS / SOP，或拆分后再诊断。");
  }
  if (stats.englishWordCount < 80 && stats.charCount < 500) {
    throw new InputValidationError("内容过短，只能做初步判断。请至少粘贴一段完整文书内容。");
  }

  const targetRegion = sanitizeUserContext(body.targetRegion, 80);
  const targetSchoolOrProgram = sanitizeUserContext(body.targetSchoolOrProgram, 140);
  const draftStage = oneOf(sanitizeUserContext(body.draftStage, 20), draftStages, "不确定") as DraftStage;
  const userConcern = sanitizeUserContext(body.userConcern, 200);
  const hasCompleteContext = Boolean(targetMajor && applicationStage && documentType);

  return {
    applicationStage,
    targetMajor,
    documentType,
    essayText,
    targetRegion,
    targetSchoolOrProgram,
    draftStage,
    userConcern,
    stats,
    baseConfidence: getBaseConfidence(stats, hasCompleteContext),
  };
}
