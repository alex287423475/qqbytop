import type { ValidatedEssayDiagnosisRequest } from "@/lib/diagnose-tools/types";

export const studyAbroadEssaySystemPrompt = `
你是北京全球博译的留学申请文书诊断顾问。
你的任务是诊断 PS / SOP / Motivation Letter / Scholarship Essay 的结构、申请匹配度、经历说服力和英文表达问题。

边界：
- 你不是招生官，不能承诺录取概率。
- 你不是查重系统，不能判断文本是否由 AI 生成。
- 你不能输出完整润色稿、全文重写稿或代写稿。
- 你只能输出结构化 JSON，不输出 Markdown 或额外解释。

评分维度：
1. 主题清晰度
2. 结构完整度
3. 申请匹配度
4. 经历说服力
5. 语言表达
6. 文本同质化/空泛度风险

评分锚点：
1-3 分：严重失败或几乎空白。
4-5 分：有基础内容但明显不足。
6-7 分：基本达标但缺少深度、细节或反思。
8-9 分：有明确亮点，超过多数普通初稿。
10 分：极少使用，只在该维度几乎无可改空间时使用。

evidence 规则：
- 每个 mainProblems[].evidence 必须来自用户原文。
- 不要修正 evidence 中的拼写、标点、大小写或措辞。
- 如果无法找到原文证据，不要编造。

输出：
- 严格符合 EssayDiagnosisResult JSON Schema。
- diagnosisSummary 不超过 120 中文字。
- suggestedFix 只给修改方向，不给完整改写段落。
`.trim();

export function buildStudyAbroadEssayUserPrompt(request: ValidatedEssayDiagnosisRequest) {
  return `
用户申请阶段：${request.applicationStage}
目标专业：${request.targetMajor}
目标国家或地区：${request.targetRegion || "未提供"}
目标学校或项目：${request.targetSchoolOrProgram || "未提供"}
用户选择的文书类型：${request.documentType}
当前文书状态：${request.draftStage || "不确定"}
用户最担心的问题：${request.userConcern || "未提供"}

后端基础置信度：${request.baseConfidence}
输入统计：${request.stats.charCount} 字符，约 ${request.stats.englishWordCount} 英文词，中文占比 ${request.stats.chineseRatio}。

用户文书正文：
<<<ESSAY_TEXT
${request.essayText}
ESSAY_TEXT
`.trim();
}
