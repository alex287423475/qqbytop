export type Confidence = "low" | "normal" | "high";
export type Severity = "high" | "medium" | "low";

export type ApplicationStage =
  | "本科"
  | "硕士"
  | "博士"
  | "转学"
  | "交换"
  | "奖学金"
  | "其他";

export type EssayDocumentType =
  | "PS"
  | "SOP"
  | "Motivation Letter"
  | "Scholarship Essay"
  | "不确定";

export type DraftStage = "初稿" | "修改稿" | "已定稿" | "不确定";

export type ServiceName =
  | "文书基础润色"
  | "文书深度优化"
  | "SOP / PS 结构重写"
  | "英文简历优化"
  | "申请材料包审核";

export type DimensionId =
  | "theme_clarity"
  | "structure_completeness"
  | "application_fit"
  | "experience_persuasiveness"
  | "language_expression"
  | "generic_risk";

export interface EssayDiagnosisRequest {
  applicationStage: ApplicationStage;
  targetMajor: string;
  documentType: EssayDocumentType;
  essayText: string;
  targetRegion?: string;
  targetSchoolOrProgram?: string;
  draftStage?: DraftStage;
  userConcern?: string;
}

export interface InputStats {
  charCount: number;
  englishWordCount: number;
  chineseRatio: number;
}

export interface ValidatedEssayDiagnosisRequest extends EssayDiagnosisRequest {
  targetRegion: string;
  targetSchoolOrProgram: string;
  draftStage: DraftStage;
  userConcern: string;
  stats: InputStats;
  baseConfidence: Confidence;
}

export interface DocumentTypeAssessment {
  submittedType: EssayDocumentType;
  detectedFit: "更接近 PS" | "更接近 SOP" | "类型基本匹配" | "无法判断";
  comment: string;
  explanation: string;
}

export interface DimensionScore {
  id: DimensionId;
  name: string;
  score: number;
  comment: string;
  finding: string;
  evidence: string;
  action: string;
}

export interface MainProblem {
  title: string;
  severity: Severity;
  evidence: string;
  whyItMatters: string;
  suggestedFix: string;
}

export interface RevisionPriority {
  level: Severity;
  item: string;
  reason: string;
}

export interface ServiceRecommendation {
  primaryService: ServiceName;
  secondaryService?: ServiceName;
  reason: string;
}

export interface BeforeAfterExample {
  before: string;
  after: string;
  note: string;
}

export interface EssayDiagnosisResult {
  diagnosticId: string;
  toolSlug: "study-abroad-essay-check";
  isDemo: boolean;
  source: "openai" | "compatible" | "demo";
  overallScore: number;
  confidence: Confidence;
  diagnosisSummary: string;
  documentTypeAssessment: DocumentTypeAssessment;
  dimensionScores: DimensionScore[];
  mainProblems: MainProblem[];
  revisionPriorities: RevisionPriority[];
  quickWins: string[];
  serviceRecommendation: ServiceRecommendation;
  beforeAfterExample: BeforeAfterExample;
  privacyNote: string;
  createdAt: string;
}

export interface ToolDefinition {
  slug: "study-abroad-essay-check";
  title: string;
  description: string;
  privacyNote: string;
}

export interface LeadSubmission {
  diagnosticId: string;
  selectedService: ServiceName;
  name: string;
  contact: string;
  note?: string;
  authorizeEssayReview?: boolean;
  applicationStage?: ApplicationStage;
  targetMajor?: string;
  documentType?: EssayDocumentType;
}
