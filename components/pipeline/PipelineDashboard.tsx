"use client";

import { WorkflowDashboard } from "@/components/workflow/WorkflowDashboard";
import type { WorkflowStatus } from "@/components/workflow/WorkflowDashboard";

const stages = [
  { key: "keywords", label: "关键词", accent: "text-brand-400", activeSteps: ["keywords"] },
  { key: "drafts", label: "草稿", accent: "text-amber-300", activeSteps: ["generate"] },
  { key: "validated", label: "已校验", accent: "text-sky-300", activeSteps: ["validate"] },
  { key: "approved", label: "已审核", accent: "text-violet-300", activeSteps: ["approve"] },
  { key: "published", label: "已发布", accent: "text-emerald-300", activeSteps: ["publish"] },
];

const actions = [
  { key: "generate", label: "生成文章" },
  { key: "validate", label: "校验草稿" },
  { key: "approve", label: "审核通过" },
  { key: "publish", label: "发布内容" },
];

const providerOptions = [
  { value: "mock", label: "Mock" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "deepseek", label: "DeepSeek" },
];

const stageLabels = {
  draft: "草稿",
  generating: "生成中",
  validated: "已校验",
  approved: "已审核",
  published: "已发布",
  rejected: "已退回",
};

export function PipelineDashboard({ initialStatus }: { initialStatus?: WorkflowStatus }) {
  return (
    <WorkflowDashboard
      title="SEO 文章生产线控制台"
      eyebrow="Local Brain"
      description="这个页面仅用于本地开发环境。它读取 local-brain 状态文件，并按生成、校验、审核、发布四个步骤控制内容流水线。"
      apiBase="/api/pipeline"
      initialStatus={initialStatus}
      stages={stages}
      actions={actions}
      providerOptions={providerOptions}
      defaultProvider="mock"
      stageLabels={stageLabels}
      itemName="文章"
      keywordManager={{ enabled: true, apiBase: "/api/pipeline/keywords" }}
    />
  );
}
