"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { confirmDraftAndCreateReport, getLocalDraft, getRecognition } from "@/lib/gaokao-essay/api";
import { GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";
import { validateEssayText } from "@/lib/gaokao-essay/schemas";
import type { CreateReportRequest, OcrResult } from "@/lib/gaokao-essay/types";
import { AiServiceNotice } from "./AiServiceNotice";

export function GaokaoEssayReviewClient({ draftId }: { draftId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const validation = useMemo(() => validateEssayText(text), [text]);

  useEffect(() => {
    let cancelled = false;
    getRecognition(draftId).then((result) => {
      if (cancelled) return;
      setOcr(result);
      setText(result?.transcribed_text || getLocalDraft(draftId)?.confirmed_text || "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  async function handleConfirm() {
    if (!validation.valid || submitting) return;
    try {
      setSubmitting(true);
      const strategy = (searchParams.get("mock") || "instant") as CreateReportRequest["mock_strategy"];
      const { reportHref } = await confirmDraftAndCreateReport({
        draftId,
        text: validation.normalized,
        strategy: ["instant", "delayed", "failed"].includes(strategy || "") ? strategy : "instant",
      });
      router.push(reportHref);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "校对确认失败。");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <section className="mx-auto max-w-4xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-blue-700">草稿 {draftId.slice(0, 18)}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">正在读取 OCR 结果</h1>
          <p className="mt-3 text-slate-600">系统会先显示识别文本，确认后才创建诊断任务。</p>
        </section>
      </main>
    );
  }

  if (!ocr) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <section className="mx-auto max-w-4xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-blue-700">草稿 {draftId.slice(0, 18)}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">未找到识别结果</h1>
          <p className="mt-3 leading-7 text-slate-600">请重新上传作文图片，或改用文本粘贴方式提交。</p>
          <Link className="mt-6 inline-flex bg-blue-700 px-5 py-3 font-semibold text-white" href={GAOKAO_ESSAY_TOOL_BASE_PATH}>
            返回诊断工具
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700">草稿 {draftId.slice(0, 18)}</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">校对图片识别结果</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">请修正 OCR 误识别内容。系统会把校对后的文本作为唯一诊断输入。</p>
          </div>
          <AiServiceNotice compact />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">识别文本</h2>
              <p className="mt-1 text-sm text-slate-500">词数 {validation.wordCount}，确认后直接进入报告生成。</p>
            </div>
            <button type="button" onClick={() => setText(ocr.transcribed_text)} className="w-fit border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              恢复 OCR 原文
            </button>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={18}
            className="min-h-[420px] w-full resize-y border border-slate-300 bg-white p-4 text-base leading-8 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          {validation.errors.length > 0 ? (
            <div className="mt-3 space-y-1 text-sm text-red-700">
              {validation.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!validation.valid || submitting}
            className="mt-5 min-h-12 bg-blue-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {submitting ? "创建诊断中..." : "确认文本并生成报告"}
          </button>
        </div>

        <aside className="space-y-5">
          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">OCR 质量提示</h2>
            {ocr.quality_warnings.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                {ocr.quality_warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">未发现明显图片质量问题。</p>
            )}
          </section>

          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">不确定片段</h2>
            <div className="mt-3 space-y-3">
              {ocr.uncertain_spans.length > 0 ? (
                ocr.uncertain_spans.map((span) => (
                  <div key={`${span.line_no}-${span.text}`} className="border border-slate-200 p-3 text-sm leading-6">
                    <strong>第 {span.line_no} 行：{span.text}</strong>
                    <p className="mt-1 text-slate-600">{span.reason}</p>
                    <p className="mt-1 text-slate-500">可能值：{span.possible_values.join(" / ")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">暂无不确定片段。</p>
              )}
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">行级识别</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {ocr.line_items.map((line) => (
                <div key={line.line_no} className="border border-slate-100 p-2">
                  <span className="font-semibold text-slate-500">
                    #{line.line_no} · {Math.round(line.confidence * 100)}%
                  </span>
                  <p className="mt-1 text-slate-800">{line.text || "空行"}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
