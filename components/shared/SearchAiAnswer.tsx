"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SearchAiSource = {
  type: string;
  typeLabel: string;
  title: string;
  href: string;
  category: string;
  description: string;
};

type SearchAiResponse = {
  answer: string;
  sources: SearchAiSource[];
  provider: string;
  model: string;
  degraded?: boolean;
  message?: string;
};

type SearchAiAnswerProps = {
  query: string;
  locale: string;
  type: string;
};

export function SearchAiAnswer({ query, locale, type }: SearchAiAnswerProps) {
  const [loading, setLoading] = useState(Boolean(query));
  const [payload, setPayload] = useState<SearchAiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) return;

    const controller = new AbortController();
    setLoading(true);
    setPayload(null);
    setError(null);

    fetch("/api/search/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, locale, type }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as SearchAiResponse | null;
        if (!response.ok) throw new Error(data?.message || "AI 推荐失败。");
        setPayload(data);
      })
      .catch((nextError) => {
        if (controller.signal.aborted) return;
        setError(nextError instanceof Error ? nextError.message : "AI 推荐失败。");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, locale, type]);

  if (!query.trim()) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-slate-50 shadow-sm">
      <div className="border-b border-brand-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">AI 搜索助手</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-900">基于站内内容的推荐答案</h2>
          </div>
          {payload?.provider && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {payload.provider === "mock" || payload.degraded ? "站内摘要模式" : `${payload.provider} · ${payload.model}`}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        {loading && (
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-brand-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            <p className="text-sm text-slate-500">正在读取站内内容并生成建议...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
            {error} 下方仍可查看普通搜索结果。
          </div>
        )}

        {!loading && payload && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="whitespace-pre-line text-base leading-8 text-slate-700">{payload.answer}</div>
              {payload.degraded && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
                  当前使用站内摘要模式。我们会先根据站内内容为您整理可参考的答案和相关页面。
                </p>
              )}
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-brand-900">推荐页面</h3>
              <div className="mt-4 space-y-3">
                {payload.sources.slice(0, 4).map((source) => (
                  <Link
                    key={source.href}
                    href={source.href}
                    className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="text-xs font-semibold text-brand-600">{source.typeLabel}</span>
                    <span className="mx-2 text-xs text-slate-300">/</span>
                    <span className="text-xs text-slate-500">{source.category}</span>
                    <span className="mt-1 block text-sm font-semibold leading-6 text-brand-900">{source.title}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
