import {
  defaultBeforeAfterExample,
  dimensionNames,
  serviceNames,
} from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import { matchEvidenceInSource } from "@/lib/diagnose-tools/evidence";
import { sanitizeAiText } from "@/lib/diagnose-tools/sanitize";
import type {
  Confidence,
  DimensionId,
  DimensionScore,
  EssayDiagnosisResult,
  MainProblem,
  ServiceName,
  Severity,
  ValidatedEssayDiagnosisRequest,
} from "@/lib/diagnose-tools/types";

const dimensionIds = Object.keys(dimensionNames) as DimensionId[];
const severityValues: Severity[] = ["high", "medium", "low"];
const confidenceValues: Confidence[] = ["low", "normal", "high"];
const confidenceRank: Record<Confidence, number> = { low: 0, normal: 1, high: 2 };

export const studyAbroadEssayJsonSchema = {
  name: "essay_diagnosis_result",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      overallScore: { type: "integer", minimum: 0, maximum: 100 },
      confidence: { type: "string", enum: confidenceValues },
      diagnosisSummary: { type: "string", maxLength: 180 },
      documentTypeAssessment: {
        type: "object",
        additionalProperties: false,
        properties: {
          submittedType: { type: "string" },
          detectedFit: { type: "string", enum: ["更接近 PS", "更接近 SOP", "类型基本匹配", "无法判断"] },
          comment: { type: "string", maxLength: 140 },
          explanation: { type: "string", maxLength: 180 },
        },
        required: ["submittedType", "detectedFit", "comment", "explanation"],
      },
      dimensionScores: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", enum: dimensionIds },
            name: { type: "string" },
            score: { type: "integer", minimum: 1, maximum: 10 },
            comment: { type: "string", maxLength: 120 },
          },
          required: ["id", "name", "score", "comment"],
        },
      },
      mainProblems: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", maxLength: 80 },
            severity: { type: "string", enum: severityValues },
            evidence: { type: "string", maxLength: 240 },
            whyItMatters: { type: "string", maxLength: 180 },
            suggestedFix: { type: "string", maxLength: 180 },
          },
          required: ["title", "severity", "evidence", "whyItMatters", "suggestedFix"],
        },
      },
      revisionPriorities: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            level: { type: "string", enum: severityValues },
            item: { type: "string", maxLength: 80 },
            reason: { type: "string", maxLength: 160 },
          },
          required: ["level", "item", "reason"],
        },
      },
      quickWins: { type: "array", minItems: 3, maxItems: 3, items: { type: "string", maxLength: 120 } },
      serviceRecommendation: {
        type: "object",
        additionalProperties: false,
        properties: {
          primaryService: { type: "string", enum: serviceNames },
          secondaryService: { type: "string", enum: serviceNames },
          reason: { type: "string", maxLength: 180 },
        },
        required: ["primaryService", "reason"],
      },
    },
    required: [
      "overallScore",
      "confidence",
      "diagnosisSummary",
      "documentTypeAssessment",
      "dimensionScores",
      "mainProblems",
      "revisionPriorities",
      "quickWins",
      "serviceRecommendation",
    ],
  },
  strict: true,
} as const;

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function enumValue<T extends string>(value: unknown, options: readonly T[], fallback: T) {
  return options.includes(value as T) ? (value as T) : fallback;
}

function normalizeDimensions(raw: unknown): DimensionScore[] {
  const input = Array.isArray(raw) ? raw : [];
  return dimensionIds.map((id) => {
    const found = input.find((item) => item && typeof item === "object" && (item as { id?: unknown }).id === id) as
      | Record<string, unknown>
      | undefined;
    return {
      id,
      name: dimensionNames[id],
      score: clampNumber(found?.score, 1, 10, 6),
      comment: sanitizeAiText(found?.comment || "该维度仍有进一步打磨空间。", 120),
    };
  });
}

function normalizeProblems(raw: unknown, request: ValidatedEssayDiagnosisRequest): MainProblem[] {
  const input = Array.isArray(raw) ? raw : [];
  const problems = input
    .slice(0, 5)
    .map((item) => {
      const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const evidence = sanitizeAiText(entry.evidence, 240);
      const match = matchEvidenceInSource(evidence, request.essayText);
      return {
        problem: {
          title: sanitizeAiText(entry.title || "文书问题需要进一步定位", 80),
          severity: enumValue(entry.severity, severityValues, "medium"),
          evidence,
          whyItMatters: sanitizeAiText(entry.whyItMatters || "该问题会影响申请材料的说服力。", 180),
          suggestedFix: sanitizeAiText(entry.suggestedFix || "建议补充具体经历、项目动机和反思逻辑。", 180),
        },
        match,
      };
    })
    .filter(({ problem, match }) => problem.evidence && match.matched);

  if (problems.length >= 2) return problems.slice(0, 5).map(({ problem }) => problem);
  throw new Error("AI evidence could not be verified against source text");
}

export function lowerConfidence(a: Confidence, b: Confidence): Confidence {
  return confidenceRank[a] <= confidenceRank[b] ? a : b;
}

export function normalizeEssayDiagnosisResult(
  raw: unknown,
  request: ValidatedEssayDiagnosisRequest,
  source: "openai" | "compatible",
): EssayDiagnosisResult {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const confidence = lowerConfidence(enumValue(data.confidence, confidenceValues, "normal"), request.baseConfidence);

  const service = data.serviceRecommendation && typeof data.serviceRecommendation === "object"
    ? (data.serviceRecommendation as Record<string, unknown>)
    : {};

  return {
    diagnosticId: crypto.randomUUID(),
    toolSlug: "study-abroad-essay-check",
    isDemo: false,
    source,
    overallScore: clampNumber(data.overallScore, 0, 100, 68),
    confidence,
    diagnosisSummary: sanitizeAiText(data.diagnosisSummary || "这篇文书已经具备初稿基础，但主题、经历细节和项目匹配仍需要继续打磨。", 180),
    documentTypeAssessment: {
      submittedType: request.documentType,
      detectedFit: enumValue(
        (data.documentTypeAssessment as Record<string, unknown> | undefined)?.detectedFit,
        ["更接近 PS", "更接近 SOP", "类型基本匹配", "无法判断"] as const,
        "无法判断",
      ),
      comment: sanitizeAiText((data.documentTypeAssessment as Record<string, unknown> | undefined)?.comment || "建议结合目标项目要求确认文书类型。", 140),
      explanation: sanitizeAiText(
        (data.documentTypeAssessment as Record<string, unknown> | undefined)?.explanation ||
          "PS 更强调个人成长与动机，SOP 更强调学术目标、项目匹配和研究/职业计划。",
        180,
      ),
    },
    dimensionScores: normalizeDimensions(data.dimensionScores),
    mainProblems: normalizeProblems(data.mainProblems, request),
    revisionPriorities: Array.isArray(data.revisionPriorities)
      ? data.revisionPriorities.slice(0, 3).map((item) => {
          const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            level: enumValue(entry.level, severityValues, "medium"),
            item: sanitizeAiText(entry.item || "先补强核心主题", 80),
            reason: sanitizeAiText(entry.reason || "主题会影响后续结构和服务推荐。", 160),
          };
        })
      : [
          { level: "high", item: "明确主线", reason: "先让读者知道你为什么申请该方向。" },
          { level: "medium", item: "补具体经历", reason: "用细节支撑能力和动机。" },
          { level: "low", item: "压缩套话", reason: "减少泛泛表达，提高真实感。" },
        ],
    quickWins: Array.isArray(data.quickWins)
      ? data.quickWins.slice(0, 3).map((item) => sanitizeAiText(item, 120))
      : ["删掉开头空泛套话。", "每段加入一个具体经历细节。", "补一句目标项目与课程/资源的对应关系。"],
    serviceRecommendation: {
      primaryService: enumValue(service.primaryService, serviceNames, "文书深度优化") as ServiceName,
      secondaryService: service.secondaryService
        ? (enumValue(service.secondaryService, serviceNames, "文书基础润色") as ServiceName)
        : undefined,
      reason: sanitizeAiText(service.reason || "当前主要问题涉及结构、动机和表达，需要结合申请方向做系统优化。", 180),
    },
    beforeAfterExample: defaultBeforeAfterExample,
    privacyNote: "默认不保存完整正文，不用于 AI 训练，也不会提交到任何查重系统。",
    createdAt: new Date().toISOString(),
  };
}
