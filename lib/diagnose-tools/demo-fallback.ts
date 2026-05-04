import { defaultBeforeAfterExample, dimensionNames } from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import type { DimensionScore, EssayDiagnosisResult, ValidatedEssayDiagnosisRequest } from "@/lib/diagnose-tools/types";

export function createDemoEssayDiagnosis(request: ValidatedEssayDiagnosisRequest): EssayDiagnosisResult {
  const demoEvidence = [
    "I have always been interested in business because it is important in the modern world.",
    "Your program is famous and I believe it will help me achieve my future career goals.",
    "This experience taught me many skills and made me a better person.",
  ];
  const dimensionScores: DimensionScore[] = [
    {
      id: "theme_clarity",
      name: dimensionNames.theme_clarity,
      score: 6,
      comment: "主题方向可见，但中心句还不够锋利。",
      finding: "开头表达了申请兴趣，但还没有把“我为什么适合这个方向”压缩成一条清楚主线。",
      evidence: demoEvidence[0],
      action: "把开头改成“具体经历 + 形成的问题意识 + 目标方向”的一句主旨句，再让结尾回扣同一主线。",
    },
    {
      id: "structure_completeness",
      name: dimensionNames.structure_completeness,
      score: 6,
      comment: "段落功能基本存在，但递进关系偏弱。",
      finding: "经历、动机和未来目标之间像并列陈述，缺少从过去到项目再到未来的因果推进。",
      evidence: "段落之间多用泛化衔接，缺少清晰的 transition sentence。",
      action: "给每段标注功能：动机来源、能力证据、项目匹配、未来计划；删掉不能服务主线的段落。",
    },
    {
      id: "application_fit",
      name: dimensionNames.application_fit,
      score: 5,
      comment: "项目匹配证据不足，是优先修补项。",
      finding: "目前更像在称赞学校，而不是证明你研究过该项目、课程或资源。",
      evidence: demoEvidence[1],
      action: "补入 2-3 个具体匹配点，例如课程名称、导师方向、实验室资源、capstone 或职业路径。",
    },
    {
      id: "experience_persuasiveness",
      name: dimensionNames.experience_persuasiveness,
      score: 6,
      comment: "经历可用，但说服力还没有完全释放。",
      finding: "经历描述停留在“学到了很多”，缺少你的角色、行动、结果和反思。",
      evidence: demoEvidence[2],
      action: "每个核心经历至少补齐一个结果信号：数据、反馈、作品、责任边界或你改变判断的细节。",
    },
    {
      id: "language_expression",
      name: dimensionNames.language_expression,
      score: 6,
      comment: "表达基本可读，但有翻译腔和泛化句。",
      finding: "句子没有严重阻碍理解，但抽象词偏多，动词力度不足，英文自然度仍有提升空间。",
      evidence: "important / famous / many skills / better person 等表达过于笼统。",
      action: "优先替换泛化形容词，改用具体动作动词，并把长句拆成更清楚的英文逻辑链。",
    },
    {
      id: "generic_risk",
      name: dimensionNames.generic_risk,
      score: 5,
      comment: "同质化风险较高，需要加入个人细节。",
      finding: "部分句子可套用到很多申请者身上，缺少独有场景、选择取舍和真实反思。",
      evidence: "I have always been interested... / achieve my future career goals.",
      action: "删减模板句，加入只有你能写出的细节：具体项目、冲突、失败、转折或一次关键选择。",
    },
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
