"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalReport, getReport, sendSupportChat } from "@/lib/gaokao-essay/api";
import { formatCny, GAOKAO_ESSAY_PRICING, GAOKAO_ESSAY_PRODUCT_TYPES, GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";
import { lockedFullReportSections } from "@/lib/gaokao-essay/mock-data";
import { updateMockReport } from "@/lib/gaokao-essay/mock-store";
import type { FullReport, GaokaoEssayReport, HighlightSpan } from "@/lib/gaokao-essay/types";
import { AiServiceNotice } from "./AiServiceNotice";
import { GaokaoEssayFooter } from "./GaokaoEssayFooter";
import { GaokaoEssaySinglePlanFull } from "./GaokaoEssaySinglePlanDetails";
import { GaokaoEssaySupportAssistant } from "./GaokaoEssaySupportAssistant";

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
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-950">没有找到这份报告</h1>
          <p className="mt-3 text-slate-600">本地演示报告可能已被浏览器清理。请重新提交作文生成摘要。</p>
          <Link className="mt-6 inline-flex bg-blue-700 px-5 py-3 font-semibold text-white" href={GAOKAO_ESSAY_TOOL_BASE_PATH}>
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
              完整报告未解锁时，服务端必须返回 <code>full_report: null</code>。免费层只展示预估分、置信度和风险类型，不展示逐句修改、范文或训练方案。
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
    <section className="border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">报告状态：{statusText}</h2>
          <p className="mt-1 text-sm text-slate-500">
            词数 {report.word_count} | 内容 hash {report.confirmed_text_hash.slice(0, 16)}
          </p>
        </div>
        {report.status === "QUEUED" || report.status === "RUNNING" ? (
          <div className="h-2 w-full overflow-hidden bg-slate-100 md:w-52">
            <span className="block h-full w-2/3 animate-pulse bg-blue-700" />
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
  };

  return (
    <section className="border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="bg-slate-950 p-5 text-white">
          <span className="text-sm font-semibold text-blue-200">AI 预估分</span>
          <p className="mt-3 text-5xl font-bold">
            {summary.score.estimated}
            <span className="text-xl text-slate-300">/{summary.score.max}</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">置信度：{summary.score.confidence}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">免费摘要</h2>
          <div className="mt-2 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
            相同作文会通过内容 hash 去重。提示：您的作文存在 3 处致命语法扣分项，建议解锁完整报告查看。
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {summary.top_risks.slice(0, 3).map((risk, index) => (
              <article key={"risk-" + risk.type + "-" + index} className="border border-slate-200 p-4">
                <span className="text-xs font-semibold uppercase text-slate-500">风险类型</span>
                <strong className="mt-2 block text-slate-950">{riskTypeLabels[risk.type] ?? risk.type}</strong>
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
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-slate-950">完整报告内容</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {lockedFullReportSections.map((section) => (
          <div key={section} className="border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">
            <span className="font-semibold text-slate-700">已锁定</span>
            <p className="mt-2 text-sm">{section}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">本报告为 AI 辅助诊断，不承诺高考提分或最终得分。</p>
    </section>
  );
}

function FullReportPanel({ report, fullReport }: { report: GaokaoEssayReport; fullReport: FullReport }) {
  return (
    <section className="space-y-6">
      <div className="border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-xl font-bold text-emerald-950">完整报告已解锁</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">{fullReport.disclaimer}</p>
      </div>

      <article className="border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-950">逐句荧光笔标注</h2>
        <HighlightedEssay text={report.confirmed_text} spans={fullReport.highlight_spans} />
      </article>

      <article className="border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-950">高考维度拆解</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(fullReport.gaokao_dimensions).map(([key, value]) => (
            <div key={key} className="border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-slate-950">{key}</strong>
                <span className="font-semibold text-blue-700">
                  {value.score}/{value.max}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{value.comment}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-950">两版改写</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="bg-slate-50 p-4">
            <strong>稳健版</strong>
            <p className="mt-2 leading-7 text-slate-700">{fullReport.rewrites.safe_version}</p>
          </div>
          <div className="bg-blue-50 p-4">
            <strong>进阶版</strong>
            <p className="mt-2 leading-7 text-blue-950">{fullReport.rewrites.advanced_version}</p>
          </div>
        </div>
      </article>
    </section>
  );
}

function HighlightedEssay({ text, spans }: { text: string; spans: HighlightSpan[] }) {
  const aligned = spans
    .filter((span) => span.position_status !== "unresolved" && span.start >= 0 && span.end <= text.length)
    .sort((a, b) => a.start - b.start);
  const parts: Array<{ text: string; span?: HighlightSpan }> = [];
  let cursor = 0;

  for (const span of aligned) {
    if (span.start > cursor) parts.push({ text: text.slice(cursor, span.start) });
    parts.push({ text: text.slice(span.start, span.end), span });
    cursor = Math.max(cursor, span.end);
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  const unresolved = spans.filter((span) => span.position_status === "unresolved");

  return (
    <div className="mt-4 space-y-4">
      <p className="whitespace-pre-wrap border border-slate-200 bg-slate-50 p-4 leading-8 text-slate-800">
        {parts.map((part, index) =>
          part.span ? (
            <mark key={`${part.span.start}-${index}`} className="bg-amber-200 px-1 text-slate-950" title={part.span.comment}>
              {part.text}
            </mark>
          ) : (
            <span key={`plain-${index}`}>{part.text}</span>
          ),
        )}
      </p>
      <div className="grid gap-3">
        {spans.map((span) => (
          <div key={`${span.category}-${span.original}-${span.position_status}`} className="border border-slate-200 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{span.category}</strong>
              <span className="bg-slate-100 px-2 py-1 text-xs text-slate-600">{span.severity}</span>
              <span className="bg-slate-100 px-2 py-1 text-xs text-slate-600">{span.position_status}</span>
            </div>
            <p className="mt-2 text-slate-700">{span.comment}</p>
          </div>
        ))}
      </div>
      {unresolved.length > 0 ? <p className="text-sm text-slate-500">有 {unresolved.length} 个问题未能精确定位，已降级为列表提示。</p> : null}
    </div>
  );
}

function PaywallCard({ reportId }: { reportId: string }) {
  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-slate-950">解锁完整报告</h2>
      <div className="mt-4 space-y-3">
        <Link className="block border border-slate-300 p-4 font-semibold text-slate-900 transition hover:border-blue-600" href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/checkout/${reportId}?product=${GAOKAO_ESSAY_PRODUCT_TYPES.singlePack}`}>
          立即开通 20 篇提分权限 {formatCny(GAOKAO_ESSAY_PRICING.singlePriceCents)}
        </Link>
        <GaokaoEssaySinglePlanFull />
        <Link className="block border-2 border-blue-700 bg-blue-50 p-4 font-semibold text-blue-950 transition hover:bg-blue-100" href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/checkout/${reportId}?product=${GAOKAO_ESSAY_PRODUCT_TYPES.groupPack}`}>
          发起组队开通 20 篇抢分包 {formatCny(GAOKAO_ESSAY_PRICING.groupPriceCents)} / 人
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">发起拼团，分享给同学立享 ￥53 特惠！3 人成团，每人皆可获得【最后冲刺抢分包（20篇额度）】及【2026 AI 演算母题库】。</p>
    </section>
  );
}

function SmartAppealCard({ report, onUpdate }: { report: GaokaoEssayReport; onUpdate: (report: GaokaoEssayReport) => void }) {
  const [message, setMessage] = useState("系统将自动检查支付、任务和报告状态；仍无法生成时自动退款。");

  function handleAppeal() {
    if (report.status === "COMPLETED") {
      setMessage("报告已生成，无需重试。");
      return;
    }
    if (report.retry_count >= 2) {
      setMessage("已达到自动重试上限。真实后端会继续检查订单，并按规则发起退款。");
      return;
    }
    const next = { ...report, status: "COMPLETED" as const, retry_count: report.retry_count + 1, last_retry_at: new Date().toISOString() };
    updateMockReport(next);
    onUpdate(next);
    setMessage("已触发智能重试，当前演示报告已恢复为已生成。");
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">未出报告？</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <button type="button" onClick={handleAppeal} className="mt-4 w-full bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
        智能申诉与重试
      </button>
    </section>
  );
}

function FailedPanel({ report, onRetry }: { report: GaokaoEssayReport; onRetry: (report: GaokaoEssayReport) => void }) {
  return (
    <section className="border border-red-200 bg-red-50 p-5 text-red-950">
      <h2 className="text-xl font-bold">报告生成失败</h2>
      <p className="mt-2 text-sm leading-6">这是失败态 UI。可以使用右侧“智能申诉与重试”按钮触发自助恢复。</p>
      <button
        type="button"
        onClick={() => {
          const next = { ...report, status: "COMPLETED" as const, free_summary: report.free_summary ?? null };
          updateMockReport(next);
          onRetry(next);
        }}
        className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
      >
        本地恢复状态
      </button>
    </section>
  );
}

function SupportAssistant({ reportId }: { reportId: string }) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("您好，我是系统护航助手。可以说明 99 元/53 元 20 篇额度包、免费摘要与完整报告区别、微信提取文字流程、智能申诉与重试、退款或补发权益规则。");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    try {
      const response = await sendSupportChat({ reportId, message });
      setReply(response.message);
    } catch {
      setReply("系统护航助手暂时无法连接。若是支付成功但未解锁，请先点击“智能申诉与重试”；符合规则的订单将原路退款或补发权益。");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">系统护航助手</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{reply}</p>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          placeholder="输入订单、报告或使用问题"
          aria-label={`报告 ${reportId} 的售后问题`}
        />
        <button type="button" onClick={handleSend} disabled={sending} className="bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          {sending ? "发送中..." : "发送"}
        </button>
      </div>
    </section>
  );
}

function LegacySupportAssistant({ reportId }: { reportId: string }) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("可询问图片上传、OCR 校对、报告等待、退款规则和历史报告找回。AI 助手不替代人工承诺结果。");

  function handleSend() {
    const message = input.trim();
    if (!message) return;
    setInput("");

    if (/退款|未出|失败|refund/i.test(message)) {
      setReply("请先使用“智能申诉与重试”。系统会同步订单与任务状态，符合规则时进入退款流程。");
      return;
    }

    if (/图片|OCR|识别/i.test(message)) {
      setReply("图片会先直传云存储，再识别为文本。请在校对页修正 OCR 误识别后再生成报告。");
      return;
    }

    setReply("本服务为 AI 自动生成诊断报告，不逐篇人工批改；订单异常支持一键自助重试/退款。");
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">AI 自助助手</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{reply}</p>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          placeholder="输入问题"
          aria-label={`报告 ${reportId} 的自助问题`}
        />
        <button type="button" onClick={handleSend} className="bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
          发送
        </button>
      </div>
    </section>
  );
}
