"use client";

import { useEffect, useMemo, useState } from "react";
import { listLocalReports } from "@/lib/gaokao-essay/api";
import { formatCny, GAOKAO_ESSAY_USE_BACKEND } from "@/lib/gaokao-essay/constants";
import type { AdminExceptionItem, FunnelResponse } from "@/lib/gaokao-essay/types";

export function GaokaoEssayAdminMock() {
  const [tick, setTick] = useState(0);
  const [backendFunnel, setBackendFunnel] = useState<FunnelResponse | null>(null);
  const [backendExceptions, setBackendExceptions] = useState<AdminExceptionItem[]>([]);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

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

          <article className="border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-slate-950">异常优先级</h2>
            {backendExceptions.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {backendExceptions.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="border border-slate-200 p-3">
                    <strong>{item.kind}</strong>
                    <p className="mt-1">{item.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.id}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="border border-slate-200 p-3">REFUND_FAILED：退款失败，需要最高优先级处理。</li>
                <li className="border border-slate-200 p-3">PAID_NOT_UNLOCKED：支付成功但未解锁，优先触发补偿。</li>
                <li className="border border-slate-200 p-3">UPLOAD_INCOMPLETE：上传未完成或 OCR 失败，提示重拍或文本输入。</li>
                <li className="border border-slate-200 p-3">MERCHANT_DISABLED：商户号异常或额度不足，暂停该商户。</li>
              </ul>
            )}
          </article>
        </section>

        <section className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-950">渠道漏斗指标</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="访问 → 提交作文" value={percent(funnel.drafts, funnel.visits)} />
            <Metric label="报告 → 点击解锁" value={percent(funnel.unlock_clicks, funnel.reports_completed)} />
            <Metric label="退款率" value={percent(funnel.refunds, funnel.paid_orders)} />
          </div>
        </section>
      </div>
    </main>
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
