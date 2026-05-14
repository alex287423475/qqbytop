export type WritingTaskType = "task1" | "task2";

export type WritingDimension = "TR" | "CC" | "LR" | "GRA";

export type DimensionScore = {
  dimension: WritingDimension;
  label: string;
  score: number;
  summary: string;
  evidence: string;
};

export type WritingIssue = {
  category: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  explanation: string;
};

export type SampleRevision = {
  original: string;
  revised: string;
  reason: string;
};

export type BasicWritingReport = {
  reportId: string;
  taskType: WritingTaskType;
  prompt: string;
  wordCount: number;
  estimatedBandRange: {
    low: number;
    high: number;
  };
  dimensionScores: DimensionScore[];
  topIssues: WritingIssue[];
  sampleRevision: SampleRevision;
  upgradeHint: string;
};

export type PricingSku = {
  id: "writing_trial_1" | "writing_pack_5" | "writing_pack_15";
  name: string;
  price: string;
  unit: string;
  credits: number;
  fit: string;
  note: string;
  featured?: boolean;
};

export type WritingTopic = {
  slug: string;
  taskType: WritingTaskType;
  category: string;
  title: string;
  prompt: string;
  difficulty: string;
  searchIntent: string;
};
