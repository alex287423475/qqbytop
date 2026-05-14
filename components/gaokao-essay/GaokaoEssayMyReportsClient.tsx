"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listLocalReports } from "@/lib/gaokao-essay/api";
import { GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";
import type { GaokaoEssayReport } from "@/lib/gaokao-essay/types";

export function GaokaoEssayMyReportsClient() {
  const [reports, setReports] = useState<GaokaoEssayReport[]>([]);

  useEffect(() => {
    setReports(listLocalReports());
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">我的报告</h1>
              <p className="mt-3 leading-7 text-slate-600">
                当前展示本浏览器内的 mock 历史。生产版会在绑定手机号或邮箱后，从后端按用户身份读取历史报告。
              </p>
            </div>
            <Link className="inline-flex w-fit bg-blue-700 px-5 py-3 font-semibold text-white" href={GAOKAO_ESSAY_TOOL_BASE_PATH}>
              新建诊断
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {reports.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">当前浏览器还没有可查看的诊断报告。</div>
          ) : (
            reports.map((report) => (
              <Link key={report.id} href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${report.id}`} className="grid gap-3 border border-slate-200 bg-white p-5 transition hover:border-blue-500 md:grid-cols-[1fr_160px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-blue-700">{report.source_type === "image" ? "图片识别" : "文本输入"}</span>
                    <span className="bg-slate-100 px-2 py-1 text-xs text-slate-600">{report.status}</span>
                    <span className="bg-slate-100 px-2 py-1 text-xs text-slate-600">{report.is_unlocked ? "已解锁" : "未解锁"}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{report.confirmed_text}</p>
                  <p className="mt-2 text-xs text-slate-500">hash {report.confirmed_text_hash.slice(0, 18)}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-slate-500">{new Date(report.created_at).toLocaleString("zh-CN")}</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{report.free_summary ? `${report.free_summary.score.estimated}/${report.free_summary.score.max}` : "未评分"}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
