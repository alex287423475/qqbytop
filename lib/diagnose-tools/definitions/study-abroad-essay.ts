import type {
  ApplicationStage,
  DimensionId,
  EssayDocumentType,
  ServiceName,
  ToolDefinition,
} from "@/lib/diagnose-tools/types";

export const studyAbroadEssayTool: ToolDefinition = {
  slug: "study-abroad-essay-check",
  title: "留学文书诊断",
  description: "粘贴 PS / SOP / Motivation Letter 初稿，快速判断主题、结构、申请匹配和英文表达问题。",
  privacyNote: "你的文书仅用于本次实时诊断。默认不保存完整正文，不用于 AI 训练，也不会提交到任何查重系统。",
};

export const applicationStages: ApplicationStage[] = ["本科", "硕士", "博士", "转学", "交换", "奖学金", "其他"];

export const essayDocumentTypes: EssayDocumentType[] = [
  "PS",
  "SOP",
  "Motivation Letter",
  "Scholarship Essay",
  "不确定",
];

export const concernOptions = ["语言表达", "结构逻辑", "申请匹配", "经历太空", "不确定类型"];

export const serviceNames: ServiceName[] = [
  "文书基础润色",
  "文书深度优化",
  "SOP / PS 结构重写",
  "英文简历优化",
  "申请材料包审核",
];

export const dimensionNames: Record<DimensionId, string> = {
  theme_clarity: "主题清晰度",
  structure_completeness: "结构完整度",
  application_fit: "申请匹配度",
  experience_persuasiveness: "经历说服力",
  language_expression: "语言表达",
  generic_risk: "文本同质化/空泛度风险",
};

export const defaultBeforeAfterExample = {
  before:
    "I have always been interested in business because it is important in the modern world and can help people achieve success.",
  after:
    "My interest in business analytics began when I rebuilt a weekly sales tracker and found that one pricing rule was hiding a 12% drop in repeat orders.",
  note: "示例，不是对你文书的完整改写。",
};
