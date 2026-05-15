"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocalReport, getReport } from "@/lib/gaokao-essay/api";
import { formatCny, GAOKAO_ESSAY_PRICING, GAOKAO_ESSAY_PRODUCT_TYPES, GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";
import { lockedFullReportSections } from "@/lib/gaokao-essay/mock-data";
import { updateMockReport } from "@/lib/gaokao-essay/mock-store";
import type { FullReport, GaokaoDimension, GaokaoEssayReport, HighlightSpan, Severity } from "@/lib/gaokao-essay/types";
import { AiServiceNotice } from "./AiServiceNotice";
import { GaokaoEssayFooter } from "./GaokaoEssayFooter";
import { GaokaoEssaySinglePlanFull } from "./GaokaoEssaySinglePlanDetails";
import { GaokaoEssaySupportAssistant } from "./GaokaoEssaySupportAssistant";

const severityLabel: Record<Severity, string> = {
  minor: "轻微",
  major: "明显",
  critical: "致命",
};

const severityClass: Record<Severity, string> = {
  minor: "border-amber-200 bg-amber-50 text-amber-900",
  major: "border-orange-200 bg-orange-50 text-orange-950",
  critical: "border-red-200 bg-red-50 text-red-950",
};

const dimensionLabels: Record<string, string> = {
  content: "内容切题",
  language: "语言表达",
  structure: "篇章结构",
  cohesion: "逻辑衔接",
  format: "格式规范",
};

export function GaokaoEssayReportView({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<GaokaoEssayReport | null>(null);

  useEffect(() => {
    let cancelled = false;

    getReport(reportId).then((found) => {
      if (!cancelled) setReport(found);
    });

    const found = getLocalReport(reportId);
    if (!found || found.status !== "QUEUED") {
      return () => {
        cancelled = true;
      };
    }

    const runningTimer = window.setTimeout(() => {
      const latest = getLocalReport(reportId);
      if (!latest || latest.status !== "QUEUED") return;
      const next = { ...latest, status: "RUNNING" as const };
      updateMockReport(next);
      setReport(next);
    }, 5000);

    const completedTimer = window.setTimeout(() => {
      const latest = getLocalReport(reportId);
      if (!latest || latest.status === "FAILED") return;
      const next = { ...latest, status: "COMPLETED" as const };
      updateMockReport(next);
      setReport(next);
    }, 10000);

    return () => {
      cancelled = true;
      window.clearTimeout(runningTimer);
      window.clearTimeout(completedTimer);
    };
  }, [reportId]);

  if (!report) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">没有找到这份报告</h1>
          <p className="mt-3 text-slate-600">本地演示报告可能已被浏览器清理。请返回工具页重新提交作文生成摘要。</p>
          <Link className="mt-6 inline-flex rounded-full bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800" href={GAOKAO_ESSAY_TOOL_BASE_PATH}>
            返回诊断工具
          </Link>
        </div>
      </main>
    );
  }

  const unlockedFullReport = report.is_unlocked ? report.full_report : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700">报告编号 {report.id.slice(0, 18)}</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">高考英语作文 AI 诊断报告</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              免费摘要只展示预估分、置信度和风险类型。完整报告解锁后会呈现逐句批改、五维诊断、逻辑拆解、两版范文和 7 天练习计划。
            </p>
          </div>
          <AiServiceNotice compact />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <StatusPanel report={report} />
          {report.status === "COMPLETED" && report.free_summary ? <FreeSummaryPanel report={report} /> : null}
          {report.status === "FAILED" ? <FailedPanel report={report} onRetry={setReport} /> : null}
          {unlockedFullReport ? <FullReportPanel report={report} fullReport={unlockedFullReport} /> : <LockedSections />}
        </div>
        <aside className="space-y-5">
          {!report.is_unlocked ? <PaywallCard reportId={reportId} /> : null}
          <SmartAppealCard report={report} onUpdate={setReport} />
          <GaokaoEssaySupportAssistant reportId={reportId} />
        </aside>
      </section>
      <GaokaoEssayFooter />
    </main>
  );
}

function StatusPanel({ report }: { report: GaokaoEssayReport }) {
  const statusText = {
    QUEUED: "排队中",
    RUNNING: "诊断中",
    COMPLETED: "已生成",
    FAILED: "生成失败",
    REFUNDED: "已退款",
  }[report.status];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">报告状态：{statusText}</h2>
          <p className="mt-1 text-sm text-slate-500">
            词数 {report.word_count} | 内容 hash {report.confirmed_text_hash.slice(0, 16)}
          </p>
        </div>
        {report.status === "QUEUED" || report.status === "RUNNING" ? (
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 md:w-52">
            <span className="block h-full w-2/3 animate-pulse rounded-full bg-blue-700" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FreeSummaryPanel({ report }: { report: GaokaoEssayReport }) {
  const summary = report.free_summary;
  if (!summary) return null;
  const riskTypeLabels: Record<string, string> = {
    grammar: "语法扣分风险",
    vocabulary: "词汇表达风险",
    logic: "逻辑衔接风险",
    format: "格式规范风险",
    content: "内容展开风险",
    language: "语言表达风险",
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <span className="text-sm font-semibold text-blue-200">AI 预估分</span>
          <p className="mt-3 text-5xl font-bold">
            {summary.score.estimated}
            <span className="text-xl text-slate-300">/{summary.score.max}</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">置信度：{summary.score.confidence}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">免费摘要</h2>
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
            相同作文会通过内容 hash 去重。提示：您的作文存在 3 处关键扣分风险，建议解锁完整报告查看。
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {summary.top_risks.slice(0, 3).map((risk, index) => (
              <article key={"risk-" + risk.type + "-" + index} className="rounded-2xl border border-slate-200 p-4">
                <span className="text-xs font-semibold uppercase text-slate-500">风险类型</span>
                <strong className="mt-2 block text-slate-950">{riskTypeLabels[risk.type] ?? risk.type}</strong>
                <span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-xs font-bold ${severityClass[risk.severity]}`}>
                  {severityLabel[risk.severity]}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LockedSections() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">完整报告内容</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {lockedFullReportSections.map((section) => (
          <div key={section} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">
            <span className="font-semibold text-slate-700">已锁定</span>
            <p className="mt-2 text-sm">{section}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">完整报告解锁后才会展示具体改写、范文和训练路径。</p>
    </section>
  );
}

function FullReportPanel({ report, fullReport }: { report: GaokaoEssayReport; fullReport: FullReport }) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-xl font-bold text-emerald-950">完整报告已解锁</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">{fullReport.disclaimer}</p>
      </div>

      <DiagnosisDashboard report={report} fullReport={fullReport} />

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">逐句批改手术台</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">每条问题按“原文片段、精改替换、提分原理、扣分风险”拆开，方便直接模仿。</p>
        <HighlightedEssay text={report.confirmed_text} spans={fullReport.highlight_spans || []} />
      </article>

      <LogicMapPanel fullReport={fullReport} />
      <RewritePanel fullReport={fullReport} />
      <StudyPlanPanel fullReport={fullReport} />
    </section>
  );
}

function DiagnosisDashboard({ report, fullReport }: { report: GaokaoEssayReport; fullReport: FullReport }) {
  const score = report.free_summary?.score;
  const criticalCount = (fullReport.highlight_spans || []).filter((span) => span.severity === "critical").length;
  const majorCount = (fullReport.highlight_spans || []).filter((span) => span.severity === "major").length;
  const riskLevel = criticalCount > 0 ? "高风险" : majorCount >= 2 ? "中高风险" : "可控风险";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-blue-200">完整诊断仪表盘</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-6xl font-black leading-none">{score?.estimated ?? "--"}</span>
            <span className="pb-2 text-lg text-slate-300">/ {score?.max ?? 25}</span>
          </div>
          <span className="mt-5 inline-flex rounded-full bg-amber-400 px-3 py-1 text-sm font-black text-slate-950">{riskLevel}</span>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-950">综合评价</h3>
            <p className="mt-2 leading-7 text-slate-600">{fullReport.overall_review || "报告已生成，建议优先查看逐句批改和两版范文。"}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {(fullReport.fatal_risks || []).slice(0, 3).map((risk) => (
              <div key={risk.title} className={`rounded-2xl border p-4 ${severityClass[risk.severity]}`}>
                <span className="text-xs font-black uppercase">{severityLabel[risk.severity]}风险</span>
                <strong className="mt-2 block text-base">{risk.title}</strong>
                <p className="mt-2 text-sm leading-6">{risk.explanation}</p>
              </div>
            ))}
          </div>
          <DimensionBars dimensions={fullReport.gaokao_dimensions || {}} />
        </div>
      </div>
    </article>
  );
}

function DimensionBars({ dimensions }: { dimensions: Record<string, GaokaoDimension> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(dimensions).map(([key, value]) => {
        const percent = Math.max(0, Math.min(100, Math.round((value.score / Math.max(1, value.max)) * 100)));
        return (
          <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-slate-950">{dimensionLabels[key] ?? key}</strong>
              <span className="font-bold text-blue-700">
                {value.score}/{value.max}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <span className="block h-full rounded-full bg-blue-700" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{value.comment}</p>
          </div>
        );
      })}
    </div>
  );
}

function HighlightedEssay({ text, spans }: { text: string; spans: HighlightSpan[] }) {
  const aligned = useMemo(
    () =>
      spans
        .filter((span) => span.position_status !== "unresolved" && span.start >= 0 && span.end <= text.length && span.end > span.start)
        .sort((a, b) => a.start - b.start),
    [spans, text.length],
  );

  const parts = useMemo(() => {
    const items: Array<{ text: string; span?: HighlightSpan }> = [];
    let cursor = 0;
    for (const span of aligned) {
      if (span.start < cursor) continue;
      if (span.start > cursor) items.push({ text: text.slice(cursor, span.start) });
      items.push({ text: text.slice(span.start, span.end), span });
      cursor = Math.max(cursor, span.end);
    }
    if (cursor < text.length) items.push({ text: text.slice(cursor) });
    return items;
  }, [aligned, text]);

  return (
    <div className="mt-4 space-y-5">
      <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-8 text-slate-800">
        {parts.map((part, index) =>
          part.span ? (
            <mark key={`${part.span.start}-${index}`} className="rounded bg-red-100 px-1 text-red-950" title={part.span.comment}>
              {part.text}
            </mark>
          ) : (
            <span key={`plain-${index}`}>{part.text}</span>
          ),
        )}
      </p>

      <div className="grid gap-4">
        {spans.map((span, index) => (
          <article key={`${span.category}-${span.original}-${index}`} className="rounded-3xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-slate-950">{index + 1}. {span.category}</strong>
              <span className={`rounded-full border px-2 py-1 text-xs font-bold ${severityClass[span.severity]}`}>{severityLabel[span.severity]}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{span.position_status}</span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <InfoBlock title="原文错误片段" tone="red" text={span.original} />
              <InfoBlock title="精改替换句" tone="green" text={span.correction || "建议重写该句，保证主谓一致和逻辑清晰。"} />
              <InfoBlock title="提分原理解析" tone="blue" text={span.principle || span.comment} />
              <InfoBlock title="考场扣分风险" tone="amber" text={span.risk_note || "该问题会影响阅卷者对语言准确性和逻辑完整度的判断。"} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ title, text, tone }: { title: string; text: string; tone: "red" | "green" | "blue" | "amber" }) {
  const classes = {
    red: "border-red-100 bg-red-50 text-red-950",
    green: "border-emerald-100 bg-emerald-50 text-emerald-950",
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <span className="text-xs font-black uppercase opacity-70">{title}</span>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function LogicMapPanel({ fullReport }: { fullReport: FullReport }) {
  const items = fullReport.logic_map || [];
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">段落逻辑/结构脉络拆解</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={`${item.paragraph}-${item.role}`} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">P{item.paragraph}</span>
              <strong className="text-slate-950">{item.role}</strong>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">问题：{item.issue}</p>
            <p className="mt-2 text-sm leading-6 text-blue-800">建议：{item.suggestion}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RewritePanel({ fullReport }: { fullReport: FullReport }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">两版范文重写</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-4">
          <strong className="text-slate-950">稳妥版范文</strong>
          <p className="mt-3 leading-8 text-slate-700">{fullReport.rewrites?.safe_version || "稳妥版范文生成中。"}</p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4">
          <strong className="text-blue-950">进阶版范文</strong>
          <p className="mt-3 leading-8 text-blue-950">{fullReport.rewrites?.advanced_version || "进阶版范文生成中。"}</p>
        </div>
      </div>
      {fullReport.advanced_phrases?.length ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-bold text-amber-950">进阶表达标注</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {fullReport.advanced_phrases.map((item) => (
              <div key={item.phrase} className="rounded-2xl bg-white/70 p-3">
                <strong className="text-amber-950">{item.phrase}</strong>
                <p className="mt-2 text-sm leading-6 text-amber-900">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function StudyPlanPanel({ fullReport }: { fullReport: FullReport }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">7 天练习计划</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(fullReport.study_plan || []).map((item) => (
          <div key={`${item.priority}-${item.skill}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">优先级 {item.priority}</span>
            <strong className="mt-3 block text-slate-950">{item.skill}</strong>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.exercise}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PaywallCard({ reportId }: { reportId: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">开通完整深度诊断</h2>
      <div className="mt-4 space-y-3">
        <Link
          className="block rounded-3xl border border-slate-300 p-4 font-semibold text-slate-900 transition hover:border-blue-600"
          href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/checkout/${reportId}?product=${GAOKAO_ESSAY_PRODUCT_TYPES.singlePack}`}
        >
          立即开通 20 篇提分权限 {formatCny(GAOKAO_ESSAY_PRICING.singlePriceCents)}
        </Link>
        <GaokaoEssaySinglePlanFull />
        <Link
          className="block rounded-3xl border-2 border-blue-700 bg-blue-50 p-4 font-semibold text-blue-950 transition hover:bg-blue-100"
          href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/checkout/${reportId}?product=${GAOKAO_ESSAY_PRODUCT_TYPES.groupPack}`}
        >
          发起组队开通 20 篇抢分包 {formatCny(GAOKAO_ESSAY_PRICING.groupPriceCents)} / 人
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">3 人成团，每名真实付费成员都获得独立 20 篇额度。作文、报告、订单和个人信息互不共享。</p>
    </section>
  );
}

function SmartAppealCard({ report, onUpdate }: { report: GaokaoEssayReport; onUpdate: (report: GaokaoEssayReport) => void }) {
  const [message, setMessage] = useState("系统会自动检查支付、任务和报告状态；仍无法生成时按规则重试、补发权益或退款。");

  function handleAppeal() {
    if (report.status === "COMPLETED") {
      setMessage("报告已生成。若已付款但未解锁，请在系统护航助手中发送订单号。");
      return;
    }
    if (report.retry_count >= 2) {
      setMessage("已达到自动重试上限。真实后端会继续检查订单，并按规则进入补发权益或退款流程。");
      return;
    }
    const next = { ...report, status: "COMPLETED" as const, retry_count: report.retry_count + 1, last_retry_at: new Date().toISOString() };
    updateMockReport(next);
    onUpdate(next);
    setMessage("已触发智能重试，当前演示报告已恢复为已生成。");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">智能申诉与重试</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <button type="button" onClick={handleAppeal} className="mt-4 w-full rounded-full bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
        检查并重试
      </button>
    </section>
  );
}

function FailedPanel({ report, onRetry }: { report: GaokaoEssayReport; onRetry: (report: GaokaoEssayReport) => void }) {
  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-950">
      <h2 className="text-xl font-bold">报告生成失败</h2>
      <p className="mt-2 text-sm leading-6">可以使用右侧“智能申诉与重试”触发自助恢复。真实支付订单会按规则补发权益或退款。</p>
      <button
        type="button"
        onClick={() => {
          const next = { ...report, status: "COMPLETED" as const, free_summary: report.free_summary ?? null };
          updateMockReport(next);
          onRetry(next);
        }}
        className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
      >
        本地恢复状态
      </button>
    </section>
  );
}
