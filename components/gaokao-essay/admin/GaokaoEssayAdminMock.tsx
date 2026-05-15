"use client";

import { useEffect, useMemo, useState } from "react";
import { listLocalReports } from "@/lib/gaokao-essay/api";
import { formatCny, GAOKAO_ESSAY_USE_BACKEND } from "@/lib/gaokao-essay/constants";
import type { AdminExceptionItem, FunnelResponse } from "@/lib/gaokao-essay/types";

type AdminTab = "funnel" | "exceptions" | "quality";
type QualityTaskType = "checkpoint" | "pytest" | "batch_mock" | "typecheck" | "build" | "full_gate";
type QualityRunStatus = "running" | "passed" | "failed";
type QualityBatchSummary = {
  outputDir: string;
  total: number;
  passed: number;
  failed: number;
  minRuleScore: number | null;
};
type QualityRunRecord = {
  runId: string;
  taskType: QualityTaskType;
  status: QualityRunStatus;
  currentStep: string;
  steps: string[];
  startedAt: string;
  finishedAt?: string;
  error?: string;
  outputDir: string;
  batchSummary?: QualityBatchSummary | null;
};
type QualityStatusResponse = {
  enabled: boolean;
  activeRunId: string | null;
  latestRun: QualityRunRecord | null;
  latestCheckpoint: string | null;
  latestBatchSummary: QualityBatchSummary | null;
  paths: {
    projectRoot: string;
    sampleInputDir: string;
    batchOutputRoot: string;
    qualityRunRoot: string;
  };
  modelSettings: {
    environment: string;
    llmProviderOrder: string;
    tencentTokenhubBaseUrl: string;
    tencentTokenhubFreeModel: string;
    tencentTokenhubPaidModel: string;
    tencentTokenhubFallbackModel: string;
    supportChatLlmEnabled: string;
    supportChatModel: string;
    configSources: string[];
  };
  promptSettings: {
    defaultPromptVersion: string;
    batchPromptA: string;
    batchPromptB: string;
    prompts: Array<{
      version: string;
      label: string;
      filePath: string;
      exists: boolean;
      sizeBytes: number | null;
      updatedAt: string | null;
      sha256: string | null;
      preview: string;
    }>;
  };
};
type QualityLogsResponse = {
  runId: string;
  record: QualityRunRecord | null;
  stdout: string;
  stderr: string;
};
type EditableQualitySettings = {
  modelSettings: QualityStatusResponse["modelSettings"] & {
    editableConfigPath: string;
  };
  prompts: Array<QualityStatusResponse["promptSettings"]["prompts"][number] & { content: string }>;
};
type QualityCheckpoint = {
  type: "commit" | "tag";
  ref: string;
  subject: string;
  label: string;
};
type RestoreCheckpointPreview = {
  ref: string;
  subject: string;
  changedFiles: string[];
};

export function GaokaoEssayAdminMock() {
  const [tick, setTick] = useState(0);
  const [backendFunnel, setBackendFunnel] = useState<FunnelResponse | null>(null);
  const [backendExceptions, setBackendExceptions] = useState<AdminExceptionItem[]>([]);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("funnel");

  const reports = useMemo(() => listLocalReports(), [tick]);
  const completed = reports.filter((report) => report.status === "COMPLETED").length;
  const failed = reports.filter((report) => report.status === "FAILED").length;
  const unlocked = reports.filter((report) => report.is_unlocked).length;
  const mockRevenue = unlocked * 5300;

  useEffect(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!GAOKAO_ESSAY_USE_BACKEND) return;
    let cancelled = false;
    async function loadAdminData() {
      try {
        const [funnelResponse, exceptionsResponse] = await Promise.all([
          fetch("/api/admin/gaokao-essay/funnel", { cache: "no-store" }),
          fetch("/api/admin/gaokao-essay/exceptions", { cache: "no-store" }),
        ]);
        if (!funnelResponse.ok) throw new Error(`后台漏斗接口返回 ${funnelResponse.status}`);
        if (!exceptionsResponse.ok) throw new Error(`后台异常接口返回 ${exceptionsResponse.status}`);
        const funnel = (await funnelResponse.json()) as FunnelResponse;
        const exceptions = (await exceptionsResponse.json()) as AdminExceptionItem[];
        if (!cancelled) {
          setBackendFunnel(funnel);
          setBackendExceptions(exceptions);
          setBackendMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setBackendMessage(error instanceof Error ? error.message : "后台数据加载失败");
        }
      }
    }
    loadAdminData();
    return () => {
      cancelled = true;
    };
  }, []);

  const funnel: FunnelResponse = backendFunnel ?? {
    visits: Math.max(reports.length, 1),
    drafts: reports.length,
    reports_completed: completed,
    unlock_clicks: unlocked,
    orders: unlocked,
    paid_orders: unlocked,
    refunds: 0,
    gross_revenue_cents: mockRevenue,
    net_revenue_cents: mockRevenue,
  };

  const sourceLabel = backendFunnel ? "FastAPI 后台数据" : "前端 mock 数据";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-blue-700">高考英语作文诊断后台</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">运营、异常与转化漏斗</h1>
          <p className="mt-3 leading-7 text-slate-600">
            当前数据源：{sourceLabel}。生产数据由 FastAPI <code>/api/v1/admin/*</code> 提供，并通过 <code>/admin</code> 鉴权保护。
          </p>
          {backendMessage ? <p className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{backendMessage}</p> : null}
        </section>

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "funnel" ? <FunnelPanel funnel={funnel} /> : null}
        {activeTab === "exceptions" ? <ExceptionsPanel exceptions={backendExceptions} /> : null}
        {activeTab === "quality" ? <QualityGatePanel /> : null}
      </div>
    </main>
  );
}

function AdminTabs({ activeTab, onChange }: { activeTab: AdminTab; onChange: (tab: AdminTab) => void }) {
  const tabs: Array<[AdminTab, string]> = [
    ["funnel", "运营漏斗"],
    ["exceptions", "异常订单"],
    ["quality", "质量闸门"],
  ];
  return (
    <nav className="flex flex-wrap gap-2 border border-slate-200 bg-white p-2">
      {tabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`px-4 py-2 text-sm font-semibold ${
            activeTab === value ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function FunnelPanel({ funnel }: { funnel: FunnelResponse }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["草稿数", funnel.drafts],
          ["报告完成", funnel.reports_completed],
          ["已支付订单", funnel.paid_orders],
          ["退款数", funnel.refunds],
        ].map(([label, value]) => (
          <article key={label} className="border border-slate-200 bg-white p-5">
            <span className="text-sm text-slate-500">{label}</span>
            <strong className="mt-2 block text-3xl text-slate-950">{value}</strong>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-950">转化漏斗</h2>
          <div className="mt-4 space-y-3">
            <FunnelBar label="访问" value={funnel.visits} max={Math.max(funnel.visits, 1)} />
            <FunnelBar label="草稿" value={funnel.drafts} max={Math.max(funnel.visits, funnel.drafts, 1)} />
            <FunnelBar label="报告完成" value={funnel.reports_completed} max={Math.max(funnel.drafts, 1)} />
            <FunnelBar label="点击解锁" value={funnel.unlock_clicks} max={Math.max(funnel.reports_completed, 1)} />
            <FunnelBar label="支付订单" value={funnel.paid_orders} max={Math.max(funnel.unlock_clicks, 1)} />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            总收入：{formatCny(funnel.gross_revenue_cents)}；净收入：{formatCny(funnel.net_revenue_cents)}。
          </p>
        </article>

        <section className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-950">渠道漏斗指标</h2>
          <div className="mt-4 grid gap-3">
            <Metric label="访问 → 提交作文" value={percent(funnel.drafts, funnel.visits)} />
            <Metric label="报告 → 点击解锁" value={percent(funnel.unlock_clicks, funnel.reports_completed)} />
            <Metric label="退款率" value={percent(funnel.refunds, funnel.paid_orders)} />
          </div>
        </section>
      </section>
    </>
  );
}

function ExceptionsPanel({ exceptions }: { exceptions: AdminExceptionItem[] }) {
  return (
    <article className="border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-slate-950">异常优先级</h2>
      {exceptions.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {exceptions.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="border border-slate-200 p-3">
              <strong>{item.kind}</strong>
              <p className="mt-1">{item.message}</p>
              <p className="mt-1 text-xs text-slate-500">{item.id}</p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <li className="border border-slate-200 p-3">REFUND_FAILED：退款失败，需要最高优先级处理。</li>
          <li className="border border-slate-200 p-3">PAID_NOT_UNLOCKED：支付成功但未解锁，优先触发补偿。</li>
          <li className="border border-slate-200 p-3">UPLOAD_INCOMPLETE：上传未完成或 OCR 失败，提示重拍或文本输入。</li>
          <li className="border border-slate-200 p-3">MERCHANT_DISABLED：商户号异常或额度不足，暂停该商户。</li>
        </ul>
      )}
    </article>
  );
}

function QualityGatePanel() {
  const [status, setStatus] = useState<QualityStatusResponse | null>(null);
  const [logs, setLogs] = useState<QualityLogsResponse | null>(null);
  const [editableSettings, setEditableSettings] = useState<EditableQualitySettings | null>(null);
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [restorePreview, setRestorePreview] = useState<RestoreCheckpointPreview | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreLoadingRef, setRestoreLoadingRef] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const response = await fetch("/api/admin/gaokao-essay/quality/status", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `质量状态接口返回 ${response.status}`);
    setStatus(data as QualityStatusResponse);
    return data as QualityStatusResponse;
  }

  async function loadEditableSettings() {
    const response = await fetch("/api/admin/gaokao-essay/quality/settings", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `质量设置接口返回 ${response.status}`);
    setEditableSettings(data as EditableQualitySettings);
    return data as EditableQualitySettings;
  }

  async function loadCheckpoints() {
    const response = await fetch("/api/admin/gaokao-essay/quality/checkpoints", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `checkpoint 接口返回 ${response.status}`);
    setCheckpoints(data as QualityCheckpoint[]);
    return data as QualityCheckpoint[];
  }

  async function loadLogs(runId: string) {
    const response = await fetch(`/api/admin/gaokao-essay/quality/logs?runId=${encodeURIComponent(runId)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `质量日志接口返回 ${response.status}`);
    setLogs(data as QualityLogsResponse);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadStatus(), loadEditableSettings(), loadCheckpoints()]).catch((error) => {
      if (!cancelled) setMessage(error instanceof Error ? error.message : "质量状态加载失败");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const runId = status?.activeRunId || status?.latestRun?.runId;
    if (!runId) return;
    loadLogs(runId).catch((error) => setMessage(error instanceof Error ? error.message : "质量日志加载失败"));
    if (status?.latestRun?.status !== "running" && !status?.activeRunId) return;
    const timer = window.setInterval(async () => {
      try {
        const nextStatus = await loadStatus();
        const nextRunId = nextStatus.activeRunId || nextStatus.latestRun?.runId;
        if (nextRunId) await loadLogs(nextRunId);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "质量任务轮询失败");
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [status?.activeRunId, status?.latestRun?.runId, status?.latestRun?.status]);

  async function runTask(taskType: QualityTaskType) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/gaokao-essay/quality/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `质量任务启动失败 ${response.status}`);
      setStatus((await loadStatus()) as QualityStatusResponse);
      await loadLogs((data as QualityRunRecord).runId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "质量任务启动失败");
    } finally {
      setLoading(false);
    }
  }

  function updateModelDraft<K extends keyof EditableQualitySettings["modelSettings"]>(key: K, value: EditableQualitySettings["modelSettings"][K]) {
    setEditableSettings((current) => {
      if (!current) return current;
      return { ...current, modelSettings: { ...current.modelSettings, [key]: value } };
    });
  }

  function updatePromptDraft(version: string, content: string) {
    setEditableSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        prompts: current.prompts.map((prompt) => (prompt.version === version ? { ...prompt, content } : prompt)),
      };
    });
  }

  async function saveModelSettings() {
    if (!editableSettings) return;
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const response = await fetch("/api/admin/gaokao-essay/quality/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSettings: {
            environment: editableSettings.modelSettings.environment,
            llmProviderOrder: editableSettings.modelSettings.llmProviderOrder,
            tencentTokenhubBaseUrl: editableSettings.modelSettings.tencentTokenhubBaseUrl,
            tencentTokenhubFreeModel: editableSettings.modelSettings.tencentTokenhubFreeModel,
            tencentTokenhubPaidModel: editableSettings.modelSettings.tencentTokenhubPaidModel,
            tencentTokenhubFallbackModel: editableSettings.modelSettings.tencentTokenhubFallbackModel,
            supportChatLlmEnabled: editableSettings.modelSettings.supportChatLlmEnabled,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `模型设置保存失败 ${response.status}`);
      setEditableSettings(data as EditableQualitySettings);
      await loadStatus();
      setSettingsMessage("已先自动保存修改前节点，再写入模型设置。重启 FastAPI/后台服务后生产诊断会读取新配置。");
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "模型设置保存失败");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function savePrompt(version: string) {
    const prompt = editableSettings?.prompts.find((item) => item.version === version);
    if (!prompt) return;
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const response = await fetch("/api/admin/gaokao-essay/quality/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: [{ version, content: prompt.content }] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Prompt 保存失败 ${response.status}`);
      setEditableSettings(data as EditableQualitySettings);
      await loadStatus();
      setSettingsMessage(`已先自动保存修改前节点，再写入 ${version}。请立即跑样例批测，未通过不要部署。`);
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Prompt 保存失败");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function previewCheckpoint(ref: string) {
    setRestoreLoadingRef(ref);
    setRestoreMessage(null);
    try {
      const response = await fetch("/api/admin/gaokao-essay/quality/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", ref }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `checkpoint 预览失败 ${response.status}`);
      setRestorePreview(data as RestoreCheckpointPreview);
    } catch (error) {
      setRestoreMessage(error instanceof Error ? error.message : "checkpoint 预览失败");
    } finally {
      setRestoreLoadingRef(null);
    }
  }

  async function restoreCheckpoint(ref: string) {
    const checkpoint = checkpoints.find((item) => item.ref === ref);
    const confirmed = window.confirm(
      `确认恢复到 ${checkpoint?.label || ref} 吗？\n\n系统会先自动保存当前节点，再把已跟踪文件恢复到所选节点；未跟踪文件不会被删除。`,
    );
    if (!confirmed) return;

    setRestoreLoadingRef(ref);
    setRestoreMessage(null);
    try {
      const response = await fetch("/api/admin/gaokao-essay/quality/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", ref }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `checkpoint 恢复失败 ${response.status}`);
      setRestorePreview(data as RestoreCheckpointPreview);
      await Promise.all([loadStatus(), loadEditableSettings(), loadCheckpoints()]);
      setRestoreMessage(`已恢复到 ${ref}。当前状态已在恢复前自动保存为新节点。`);
    } catch (error) {
      setRestoreMessage(error instanceof Error ? error.message : "checkpoint 恢复失败");
    } finally {
      setRestoreLoadingRef(null);
    }
  }

  const run = status?.latestRun ?? null;
  const running = loading || run?.status === "running" || Boolean(status?.activeRunId);

  return (
    <section className="space-y-5">
      <article className="border border-blue-100 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Quality Gate</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">报告质量闸门控制台</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              固定命令执行，不开放任意 Shell。质量线：Schema 100%、规则分 ≥ 80、禁用词命中 0。真实 TokenHub 批测仍建议命令行手动执行。
            </p>
          </div>
          <StatusPill status={run?.status} enabled={status?.enabled} />
        </div>
        {!status?.enabled ? (
          <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            执行按钮当前关闭。需要在 Next.js 运行环境中配置 <code>GAOKAO_QUALITY_CONSOLE_ENABLED=true</code> 后重启服务。
          </p>
        ) : null}
        {message ? <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</p> : null}
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="最近节点" value={status?.latestCheckpoint || "暂无"} />
        <Metric label="当前步骤" value={run?.currentStep || "空闲"} />
        <Metric label="最近批测" value={formatBatchSummary(status?.latestBatchSummary)} />
      </section>

      <article className="border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-950">文件夹位置</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">质量闸门只读取固定样例目录，输出写入 test_outputs，不会把结果提交到 Git。</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <PathCard label="项目根目录" value={status?.paths.projectRoot || "加载中"} />
          <PathCard label="输入文件夹（样例作文）" value={status?.paths.sampleInputDir || "加载中"} />
          <PathCard label="批测输出根目录" value={status?.paths.batchOutputRoot || "加载中"} />
          <PathCard label="任务日志输出目录" value={status?.paths.qualityRunRoot || "加载中"} />
          <PathCard label="最近一次批测输出" value={status?.latestBatchSummary?.outputDir || "暂无"} className="md:col-span-2" />
        </div>
      </article>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-950">模型设置</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">只读展示非密钥配置；API Key 不会在控制台显示。</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow label="环境" value={status?.modelSettings.environment || "加载中"} />
            <InfoRow label="Provider 顺序" value={status?.modelSettings.llmProviderOrder || "加载中"} />
            <InfoRow label="TokenHub Base URL" value={status?.modelSettings.tencentTokenhubBaseUrl || "加载中"} />
            <InfoRow label="免费/摘要模型" value={status?.modelSettings.tencentTokenhubFreeModel || "加载中"} />
            <InfoRow label="付费深度模型" value={status?.modelSettings.tencentTokenhubPaidModel || "加载中"} />
            <InfoRow label="Fallback 模型" value={status?.modelSettings.tencentTokenhubFallbackModel || "加载中"} />
            <InfoRow label="系统护航助手 LLM" value={status ? `${status.modelSettings.supportChatLlmEnabled} · ${status.modelSettings.supportChatModel}` : "加载中"} />
          </dl>
          <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">配置来源</span>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {(status?.modelSettings.configSources || ["加载中"]).map((source) => (
                <li key={source} className="break-all">
                  {source}
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-950">Prompt 设置</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            生产默认：{status?.promptSettings.defaultPromptVersion || "加载中"}；批测对照：{status?.promptSettings.batchPromptA || "加载中"} vs{" "}
            {status?.promptSettings.batchPromptB || "加载中"}。
          </p>
          <div className="mt-4 grid gap-3">
            {(status?.promptSettings.prompts || []).map((prompt) => (
              <PromptCard key={prompt.version} prompt={prompt} />
            ))}
            {!status?.promptSettings.prompts?.length ? <p className="text-sm text-slate-500">Prompt 信息加载中。</p> : null}
          </div>
        </article>
      </section>

      <EditableQualitySettingsPanel
        settings={editableSettings}
        disabled={!status?.enabled || running || settingsSaving}
        message={settingsMessage}
        saving={settingsSaving}
        onModelChange={updateModelDraft}
        onPromptChange={updatePromptDraft}
        onSaveModel={saveModelSettings}
        onSavePrompt={savePrompt}
      />

      <CheckpointRestorePanel
        checkpoints={checkpoints}
        preview={restorePreview}
        message={restoreMessage}
        disabled={!status?.enabled || running || settingsSaving}
        loadingRef={restoreLoadingRef}
        onPreview={previewCheckpoint}
        onRestore={restoreCheckpoint}
      />

      <article className="border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-950">固定操作</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {QUALITY_TASKS.map((task) => (
            <button
              key={task.type}
              type="button"
              disabled={!status?.enabled || running}
              onClick={() => runTask(task.type)}
              className="border border-slate-200 bg-slate-950 px-4 py-3 text-left text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <span className="block">{task.label}</span>
              <span className="mt-1 block text-xs font-normal text-slate-300">{task.description}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-950">最近任务</h3>
          {run ? (
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <InfoRow label="Run ID" value={run.runId} />
              <InfoRow label="任务" value={taskLabel(run.taskType)} />
              <InfoRow label="状态" value={run.status} />
              <InfoRow label="开始" value={formatDateTime(run.startedAt)} />
              <InfoRow label="结束" value={run.finishedAt ? formatDateTime(run.finishedAt) : "运行中"} />
              <InfoRow label="输出目录" value={run.outputDir} />
              {run.error ? <InfoRow label="错误" value={run.error} /> : null}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">暂无质量任务记录。</p>
          )}
        </div>

        <div className="border border-slate-200 bg-slate-950 p-5 text-slate-100">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">实时日志</h3>
            {run?.runId ? (
              <button type="button" onClick={() => loadLogs(run.runId)} className="bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20">
                刷新
              </button>
            ) : null}
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-200">
            {logs ? [logs.stdout, logs.stderr ? `\n\n[stderr]\n${logs.stderr}` : ""].join("") : "暂无日志。"}
          </pre>
        </div>
      </article>
    </section>
  );
}

const QUALITY_TASKS: Array<{ type: QualityTaskType; label: string; description: string }> = [
  { type: "checkpoint", label: "保存节点", description: "创建 Git checkpoint" },
  { type: "pytest", label: "跑后端测试", description: "uv run pytest" },
  { type: "batch_mock", label: "跑样例批测", description: "11 篇样例质量闸门" },
  { type: "typecheck", label: "跑 TypeScript", description: "npm run typecheck" },
  { type: "build", label: "跑生产构建", description: "npm run build" },
  { type: "full_gate", label: "一键完整质量闸门", description: "节点 + 测试 + 批测 + 构建" },
];

function StatusPill({ status, enabled }: { status?: QualityRunStatus; enabled?: boolean }) {
  if (!enabled) return <span className="bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">未启用</span>;
  if (status === "running") return <span className="bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">运行中</span>;
  if (status === "passed") return <span className="bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">通过</span>;
  if (status === "failed") return <span className="bg-red-100 px-4 py-2 text-sm font-bold text-red-800">失败</span>;
  return <span className="bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">空闲</span>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-1 break-all font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function PathCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <code className="mt-2 block break-all text-slate-900">{value}</code>
    </div>
  );
}

function PromptCard({
  prompt,
}: {
  prompt: QualityStatusResponse["promptSettings"]["prompts"][number];
}) {
  return (
    <div className={`border p-4 ${prompt.exists ? "border-slate-200 bg-slate-50" : "border-red-200 bg-red-50"}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-bold text-slate-950">{prompt.label}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{prompt.version}</p>
        </div>
        <span className={`w-fit px-2 py-1 text-xs font-bold ${prompt.exists ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {prompt.exists ? "已找到" : "缺失"}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
        <InfoRow label="文件" value={prompt.filePath} />
        <InfoRow label="SHA256" value={prompt.sha256 || "暂无"} />
        <InfoRow label="大小" value={prompt.sizeBytes === null ? "暂无" : `${prompt.sizeBytes} bytes`} />
        <InfoRow label="更新时间" value={prompt.updatedAt ? formatDateTime(prompt.updatedAt) : "暂无"} />
      </dl>
      {prompt.preview ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{prompt.preview}</p> : null}
    </div>
  );
}

function EditableQualitySettingsPanel({
  settings,
  disabled,
  message,
  saving,
  onModelChange,
  onPromptChange,
  onSaveModel,
  onSavePrompt,
}: {
  settings: EditableQualitySettings | null;
  disabled: boolean;
  message: string | null;
  saving: boolean;
  onModelChange: (key: keyof EditableQualitySettings["modelSettings"], value: string) => void;
  onPromptChange: (version: string, content: string) => void;
  onSaveModel: () => void;
  onSavePrompt: (version: string) => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="border border-blue-100 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">修改模型设置</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              写入本地配置文件：<code>{settings?.modelSettings.editableConfigPath || "加载中"}</code>。保存前会自动创建 Git 节点；只允许修改模型相关字段，不编辑密钥。
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || !settings}
            onClick={onSaveModel}
            className="w-fit bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {saving ? "保存中..." : "保存模型设置"}
          </button>
        </div>
        {message ? <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{message}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <SettingsInput label="环境" value={settings?.modelSettings.environment || ""} disabled={disabled || !settings} onChange={(value) => onModelChange("environment", value)} />
          <SettingsInput
            label="Provider 顺序"
            value={settings?.modelSettings.llmProviderOrder || ""}
            disabled={disabled || !settings}
            onChange={(value) => onModelChange("llmProviderOrder", value)}
          />
          <SettingsInput
            label="TokenHub Base URL"
            value={settings?.modelSettings.tencentTokenhubBaseUrl || ""}
            disabled={disabled || !settings}
            className="md:col-span-2"
            onChange={(value) => onModelChange("tencentTokenhubBaseUrl", value)}
          />
          <SettingsInput
            label="免费/摘要模型"
            value={settings?.modelSettings.tencentTokenhubFreeModel || ""}
            disabled={disabled || !settings}
            onChange={(value) => onModelChange("tencentTokenhubFreeModel", value)}
          />
          <SettingsInput
            label="付费深度模型"
            value={settings?.modelSettings.tencentTokenhubPaidModel || ""}
            disabled={disabled || !settings}
            onChange={(value) => onModelChange("tencentTokenhubPaidModel", value)}
          />
          <SettingsInput
            label="Fallback 模型"
            value={settings?.modelSettings.tencentTokenhubFallbackModel || ""}
            disabled={disabled || !settings}
            onChange={(value) => onModelChange("tencentTokenhubFallbackModel", value)}
          />
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">系统护航助手 LLM</span>
            <select
              value={settings?.modelSettings.supportChatLlmEnabled || "false"}
              disabled={disabled || !settings}
              onChange={(event) => onModelChange("supportChatLlmEnabled", event.target.value)}
              className="mt-2 w-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:bg-slate-100"
            >
              <option value="false">false - 规则优先，不调用模型</option>
              <option value="true">true - 未命中规则时调用模型</option>
            </select>
          </label>
        </div>
      </article>

      <article className="border border-blue-100 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-950">修改 Prompt</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          只允许编辑生产默认和实验对照 Prompt。保存前会自动创建 Git 节点；保存后先跑「样例批测」或「一键完整质量闸门」。
        </p>
        <div className="mt-4 space-y-4">
          {(settings?.prompts || []).map((prompt) => (
            <div key={prompt.version} className="border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-950">{prompt.label}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">{prompt.filePath}</p>
                </div>
                <button
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => onSavePrompt(prompt.version)}
                  className="w-fit bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  保存 {prompt.version}
                </button>
              </div>
              <textarea
                value={prompt.content}
                disabled={disabled}
                onChange={(event) => onPromptChange(prompt.version, event.target.value)}
                rows={10}
                className="mt-3 w-full resize-y border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                当前指纹：{prompt.sha256 || "暂无"}；大小：{prompt.sizeBytes ?? 0} bytes。
              </p>
            </div>
          ))}
          {!settings?.prompts?.length ? <p className="text-sm text-slate-500">Prompt 编辑器加载中。</p> : null}
        </div>
      </article>
    </section>
  );
}

function CheckpointRestorePanel({
  checkpoints,
  preview,
  message,
  disabled,
  loadingRef,
  onPreview,
  onRestore,
}: {
  checkpoints: QualityCheckpoint[];
  preview: RestoreCheckpointPreview | null;
  message: string | null;
  disabled: boolean;
  loadingRef: string | null;
  onPreview: (ref: string) => void;
  onRestore: (ref: string) => void;
}) {
  return (
    <article className="border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">历史节点与恢复</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            这里只列出控制台认可的稳定标签和最近提交。恢复前会自动保存当前状态；恢复只覆盖 Git 已跟踪文件，不会清理未跟踪文件。
          </p>
        </div>
        <span className="w-fit bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{checkpoints.length} 个可选节点</span>
      </div>

      {message ? <p className="mt-4 border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{message}</p> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          {checkpoints.map((checkpoint) => (
            <div key={`${checkpoint.type}-${checkpoint.ref}`} className="border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-slate-950">{checkpoint.ref}</p>
                  <p className="mt-1 text-sm text-slate-600">{checkpoint.subject}</p>
                  <span className="mt-2 inline-block bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {checkpoint.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={disabled || Boolean(loadingRef)}
                    onClick={() => onPreview(checkpoint.ref)}
                    className="border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    查看差异
                  </button>
                  <button
                    type="button"
                    disabled={disabled || Boolean(loadingRef)}
                    onClick={() => onRestore(checkpoint.ref)}
                    className="bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {loadingRef === checkpoint.ref ? "处理中..." : "恢复到此节点"}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!checkpoints.length ? <p className="text-sm text-slate-500">暂无可恢复节点。</p> : null}
        </div>

        <div className="border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">差异预览</h4>
          {preview ? (
            <>
              <p className="mt-3 font-bold text-slate-950">{preview.ref}</p>
              <p className="mt-1 text-sm text-slate-600">{preview.subject}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {preview.changedFiles.map((file) => (
                  <li key={file} className="break-all border border-slate-200 bg-white px-3 py-2 font-mono text-xs">
                    {file}
                  </li>
                ))}
                {!preview.changedFiles.length ? <li className="text-slate-500">与当前工作区没有已跟踪文件差异。</li> : null}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-500">先点击某个节点的“查看差异”，确认会回退哪些已跟踪文件，再决定是否恢复。</p>
          )}
        </div>
      </div>
    </article>
  );
}

function SettingsInput({
  label,
  value,
  disabled,
  className = "",
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 disabled:bg-slate-100"
      />
    </label>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 bg-slate-100">
        <span className="block h-full bg-blue-700" style={{ width: `${Math.min(100, Math.round((value / Math.max(max, 1)) * 100))}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 p-4">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="mt-2 block text-2xl text-slate-950">{value}</strong>
    </div>
  );
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "暂无";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function taskLabel(taskType: QualityTaskType) {
  return QUALITY_TASKS.find((task) => task.type === taskType)?.label || taskType;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function formatBatchSummary(summary?: QualityBatchSummary | null) {
  if (!summary) return "暂无";
  const minScore = summary.minRuleScore === null ? "无" : summary.minRuleScore;
  return `${summary.passed}/${summary.total} 通过，最低 ${minScore}`;
}
