import type { BasicWritingReport, PricingSku, WritingTopic } from "./types";

export const sampleEssay = `In recent years, many people believe that online education can replace traditional classrooms. I partly agree with this view because online learning is convenient and cheap, but I do not think it can fully replace face-to-face teaching.

On the one hand, online education gives students more freedom. They can study at home and review lessons many times, which is useful for people who live far away from good schools. It also helps working adults because they can learn after work.

On the other hand, traditional classrooms still have important advantages. Teachers can see whether students understand the lesson, and classmates can discuss ideas immediately. If students only learn online, they may feel lonely and lose motivation.

In conclusion, online education is a useful supplement, but schools and teachers are still necessary for most students.`;

export const mockBasicReport: BasicWritingReport = {
  reportId: "demo-band-55",
  taskType: "task2",
  prompt: "Some people think online education can replace traditional classrooms. To what extent do you agree or disagree?",
  wordCount: 238,
  estimatedBandRange: { low: 5.5, high: 6.0 },
  dimensionScores: [
    {
      dimension: "TR",
      label: "Task Response",
      score: 6,
      summary: "立场清楚，但主体段论证偏概括。",
      evidence: "It also helps working adults because they can learn after work.",
    },
    {
      dimension: "CC",
      label: "Coherence & Cohesion",
      score: 6,
      summary: "段落结构完整，衔接词略机械。",
      evidence: "On the one hand / On the other hand / In conclusion",
    },
    {
      dimension: "LR",
      label: "Lexical Resource",
      score: 5.5,
      summary: "词汇准确但重复，缺少话题精确表达。",
      evidence: "useful / important / good schools",
    },
    {
      dimension: "GRA",
      label: "Grammar Range & Accuracy",
      score: 5.5,
      summary: "简单句稳定，复杂句比例不足。",
      evidence: "They can study at home and review lessons many times...",
    },
  ],
  topIssues: [
    {
      category: "论证深度",
      severity: "high",
      evidence: "It also helps working adults because they can learn after work.",
      explanation: "这个理由成立，但缺少具体例子或结果推演，TR 很难稳定到 6.5。",
    },
    {
      category: "词汇重复",
      severity: "medium",
      evidence: "useful / important / freedom",
      explanation: "表达可以理解，但没有体现足够的话题词汇宽度。",
    },
    {
      category: "句式范围",
      severity: "medium",
      evidence: "Teachers can see... and classmates can discuss...",
      explanation: "并列句较多，建议加入让步、条件或结果从句。",
    },
  ],
  sampleRevision: {
    original: "It also helps working adults because they can learn after work.",
    revised:
      "It also benefits working adults, who can fit short lessons around their schedules without giving up their jobs.",
    reason: "保留原意，但加入定语从句和更自然的搭配。",
  },
  upgradeHint: "深度报告会继续给出逐句批改、段落诊断、Band 7+ 改写示例和下一篇练习任务。",
};

export const pricingSkus: PricingSku[] = [
  {
    id: "writing_trial_1",
    name: "单篇解锁",
    price: "￥9.9",
    unit: "1 次写作深度诊断",
    credits: 1,
    fit: "首次验证报告质量，或考前只想精修一篇。",
    note: "解锁当前报告，不与口语点数共享。",
  },
  {
    id: "writing_pack_5",
    name: "5 次诊断包",
    price: "￥39",
    unit: "5 次写作深度诊断",
    credits: 5,
    fit: "适合 1-2 周集中练一个 Task 或一个话题群。",
    note: "主推档位，单次成本明显低于人工批改。",
    featured: true,
  },
  {
    id: "writing_pack_15",
    name: "15 次冲刺包",
    price: "￥99",
    unit: "15 次写作深度诊断",
    credits: 15,
    fit: "适合考前 3-5 周持续复盘，沉淀高频错题。",
    note: "只增加 writing_deep_credits，不影响 speaking_deep_credits。",
  },
];

export const writingTopics: WritingTopic[] = [
  {
    slug: "online-education-replace-classroom",
    taskType: "task2",
    category: "Education",
    title: "Online education and traditional classrooms",
    prompt:
      "Some people think online education can replace traditional classrooms. To what extent do you agree or disagree?",
    difficulty: "中等",
    searchIntent: "在线教育类大作文思路、词汇和批改入口",
  },
  {
    slug: "government-environment-individuals",
    taskType: "task2",
    category: "Environment",
    title: "Government or individuals protecting the environment",
    prompt:
      "Some people believe governments should take responsibility for environmental protection, while others think individuals should be responsible. Discuss both views and give your opinion.",
    difficulty: "高频",
    searchIntent: "环境保护责任类大作文诊断",
  },
  {
    slug: "line-graph-tourism-revenue",
    taskType: "task1",
    category: "Line Graph",
    title: "Tourism revenue line graph",
    prompt:
      "The line graph shows changes in tourism revenue in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features.",
    difficulty: "基础",
    searchIntent: "雅思小作文线图结构诊断",
  },
  {
    slug: "bar-chart-transport-choices",
    taskType: "task1",
    category: "Bar Chart",
    title: "Transport choices bar chart",
    prompt:
      "The bar chart compares the main methods of transport used by commuters in five cities. Summarise the information by selecting and reporting the main features.",
    difficulty: "中等",
    searchIntent: "雅思小作文柱状图批改入口",
  },
];

export const progressSamples = [
  { label: "第 1 篇", score: 5 },
  { label: "第 2 篇", score: 5.5 },
  { label: "第 3 篇", score: 5.5 },
  { label: "第 4 篇", score: 6 },
  { label: "第 5 篇", score: 6 },
];
