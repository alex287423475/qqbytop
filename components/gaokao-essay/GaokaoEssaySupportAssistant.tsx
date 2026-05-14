"use client";

import { useState } from "react";
import { sendSupportChat, triggerSmartAppeal } from "@/lib/gaokao-essay/api";
import { GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";

type SupportAssistantTone = "light" | "dark";

const DEFAULT_REPLY = "您好，我是系统护航助手。可以说明 99 元/53 元 20 篇额度包、免费摘要与完整报告区别、微信提取文字流程、智能申诉与重试、退款或补发权益规则。";

export function GaokaoEssaySupportAssistant({
  reportId,
  orderId,
  tone = "light",
  compact = false,
}: {
  reportId?: string;
  orderId?: string;
  tone?: SupportAssistantTone;
  compact?: boolean;
}) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState(DEFAULT_REPLY);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [appealing, setAppealing] = useState(false);
  const dark = tone === "dark";
  const canTriggerSmartAppeal = Boolean(reportId && suggestedActions.includes("trigger_smart_appeal"));
  const canShowRefundPolicy = suggestedActions.includes("show_refund_policy");

  async function handleSend() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    try {
      const response = await sendSupportChat({ reportId, orderId, message });
      setReply(response.message);
      setSuggestedActions(response.suggested_actions || []);
    } catch {
      setReply("系统护航助手暂时无法连接。若是支付成功但未解锁，请先点击“智能申诉与重试”；符合规则的订单将原路退款或补发权益。");
      setSuggestedActions(reportId ? ["trigger_smart_appeal"] : []);
    } finally {
      setSending(false);
    }
  }

  async function handleSmartAppeal() {
    if (!reportId || appealing) return;
    setAppealing(true);
    try {
      const response = await triggerSmartAppeal(reportId);
      setReply(response.message);
      setSuggestedActions(response.refund_triggered ? ["show_refund_policy"] : []);
    } catch {
      setReply("智能申诉暂时无法提交。请稍后重试；若已支付但仍未解锁，请保留订单号，系统会按规则核实退款或补发权益。");
    } finally {
      setAppealing(false);
    }
  }

  return (
    <section className={dark ? "rounded-2xl border border-white/10 bg-white/10 p-5 text-white" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={dark ? "text-xs font-bold uppercase tracking-[0.18em] text-blue-100" : "text-xs font-bold uppercase tracking-[0.18em] text-blue-700"}>AI Support</p>
          <h2 className={dark ? "mt-1 text-lg font-bold text-white" : "mt-1 text-lg font-bold text-slate-950"}>系统护航助手</h2>
        </div>
        <span className={dark ? "rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-100" : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"}>
          规则自助
        </span>
      </div>

      <p className={dark ? "mt-3 text-sm leading-6 text-slate-200" : "mt-3 text-sm leading-6 text-slate-600"}>{reply}</p>

      {(canTriggerSmartAppeal || canShowRefundPolicy) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canTriggerSmartAppeal ? (
            <button
              type="button"
              onClick={handleSmartAppeal}
              disabled={appealing}
              className={
                dark
                  ? "rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:bg-slate-600 disabled:text-slate-300"
                  : "rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
              }
            >
              {appealing ? "处理中..." : "智能申诉与重试"}
            </button>
          ) : null}
          {canShowRefundPolicy ? (
            <a
              href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/refund-policy`}
              className={
                dark
                  ? "rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  : "rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              }
            >
              查看退款规则
            </a>
          ) : null}
        </div>
      )}

      {!compact ? (
        <div className={dark ? "mt-3 flex flex-wrap gap-2 text-xs text-slate-300" : "mt-3 flex flex-wrap gap-2 text-xs text-slate-500"}>
          <span>20 篇额度</span>
          <span>智能申诉</span>
          <span>补发权益</span>
          <span>退款规则</span>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleSend();
          }}
          className={
            dark
              ? "min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-blue-300"
              : "min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-600"
          }
          placeholder="输入订单、报告或使用问题"
          aria-label={reportId ? `报告 ${reportId} 的售后问题` : "高考作文诊断工具售后问题"}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className={dark ? "rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:bg-slate-600" : "rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:bg-slate-300"}
        >
          {sending ? "发送中..." : "发送"}
        </button>
      </div>
    </section>
  );
}
