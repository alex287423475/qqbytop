import { defaultBeforeAfterExample, dimensionNames } from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import type { DimensionScore, EssayDiagnosisResult, ValidatedEssayDiagnosisRequest } from "@/lib/diagnose-tools/types";

export function createDemoEssayDiagnosis(request: ValidatedEssayDiagnosisRequest): EssayDiagnosisResult {
  const demoEvidence = [
    "I have always been interested in business because it is important in the modern world.",
    "Your program is famous and I believe it will help me achieve my future career goals.",
    "This experience taught me many skills and made me a better person.",
  ];
  const dimensionScores: DimensionScore[] = [
    { id: "theme_clarity", name: dimensionNames.theme_clarity, score: 6, comment: "主题需要用更明确的一句话收束。" },
    { id: "structure_completeness", name: dimensionNames.structure_completeness, score: 6, comment: "段落之间需要更清楚的递进关系。" },
    { id: "application_fit", name: dimensionNames.application_fit, score: 5, comment: "应补充目标项目课程、资源或导师匹配。" },
    { id: "experience_persuasiveness", name: dimensionNames.experience_persuasiveness, score: 6, comment: "经历可以再加入可验证细节和结果。" },
    { id: "language_expression", name: dimensionNames.language_expression, score: 6, comment: "表达基本可读，但仍有翻译腔和泛化句。" },
    { id: "generic_risk", name: dimensionNames.generic_risk, score: 5, comment: "需要减少模板化动机和空泛价值判断。" },
  ];

  return {
    diagnosticId: crypto.randomUUID(),
    toolSlug: "study-abroad-essay-check",
    isDemo: true,
    source: "demo",
    overallScore: request.baseConfidence === "low" ? 58 : 66,
    confidence: "low",
    diagnosisSummary:
      "当前为示例诊断报告：AI 接口暂不可用，此报告用于展示工具结果结构，不代表对你文书的真实判断。",
    documentTypeAssessment: {
      submittedType: request.documentType,
      detectedFit: "无法判断",
      comment: "示例报告不会判断你的真实文书类型。",
      explanation: "PS 更强调个人经历和动机，SOP 更强调学术目标、项目匹配和未来计划。",
    },
    dimensionScores,
    mainProblems: [
      {
        title: "核心申请动机还不够具体",
        severity: "high",
        evidence: demoEvidence[0],
        whyItMatters: "如果动机停留在兴趣或价值判断，招生读者很难判断你与该项目的真实关系。",
        suggestedFix: "把兴趣改写成具体触发事件、问题意识或项目经历，而不是直接给结论。",
      },
      {
        title: "项目匹配信息不足",
        severity: "medium",
        evidence: demoEvidence[1],
        whyItMatters: "SOP/PS 需要证明你了解目标项目，而不只是泛泛表达想申请。",
        suggestedFix: "补充目标课程、研究方向、实验室、实践资源或职业路径的具体对应关系。",
      },
      {
        title: "经历证据的结果感偏弱",
        severity: "medium",
        evidence: demoEvidence[2],
        whyItMatters: "只有任务描述而缺少结果，会削弱经历对能力的支撑。",
        suggestedFix: "为关键经历补充数据、反馈、角色边界或你自己的反思。",
      },
    ],
    revisionPriorities: [
      { level: "high", item: "先确定文书主线", reason: "主线决定开头、经历选择和结尾方向。" },
      { level: "medium", item: "补项目匹配证据", reason: "项目匹配是 SOP/PS 的高权重判断项。" },
      { level: "low", item: "最后处理语言润色", reason: "结构和内容稳定后再润色更有效率。" },
    ],
    quickWins: ["删掉开头最空泛的一句。", "每段补一个具体细节或结果。", "增加一处目标项目资源的对应说明。"],
    serviceRecommendation: {
      primaryService: "文书深度优化",
      secondaryService: "SOP / PS 结构重写",
      reason: "示例报告按常见初稿问题推荐，真实服务选择应以完整人工复核为准。",
    },
    beforeAfterExample: defaultBeforeAfterExample,
    privacyNote: "默认不保存完整正文，不用于 AI 训练，也不会提交到任何查重系统。",
    createdAt: new Date().toISOString(),
  };
}
