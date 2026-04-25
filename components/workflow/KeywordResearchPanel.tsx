"use client";

import { useEffect, useMemo, useState } from "react";

type KeywordCandidate = {
  keyword: string;
  slug: string;
  locale: string;
  category: string;
  intent: string;
  priority: string;
  contentMode: string;
  source: string;
  reason: string;
  score: number;
  duplicate: boolean;
};

type KeywordResearchPanelProps = {
  apiBase: string;
  keywordApiBase?: string;
  onKeywordsChanged?: () => void;
};

export function KeywordResearchPanel({ apiBase, keywordApiBase, onKeywordsChanged }: KeywordResearchPanelProps) {
  const [seeds, setSeeds] = useState("证件翻译\n合同翻译\n设备说明书翻译");
  const [limit, setLimit] = useState("40");
  const [busy, setBusy] = useState<"research" | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<KeywordCandidate[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ value: 0, label: "" });

  const selectedRows = useMemo(() => candidates.filter((candidate) => selected[candidate.slug] && !candidate.duplicate), [candidates, selected]);

  useEffect(() => {
    if (busy !== "research") return;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current.value >= 90) return current;
        const nextValue = Math.min(90, current.value + (current.value < 45 ? 8 : 3));
        const nextLabel =
          nextValue < 35
            ? "正在整理种子词和已有关键词..."
            : nextValue < 70
              ? "正在调用模型C进行语义挖掘..."
              : "正在等待模型C返回，超时会自动切换本地规则...";
        return { value: nextValue, label: nextLabel };
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [busy]);

  async function researchKeywords() {
    setBusy("research");
    setError(null);
    setLastMessage(null);
    setCandidates([]);
    setSelected({});
    setProgress({ value: 10, label: "正在整理种子词..." });

    let timeout: number | undefined;
    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 60000);
      const response = await fetch(`${apiBase}/keyword-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seeds, limit: Number.parseInt(limit, 10) || 40 }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "关键词挖掘失败。");

      const rows = (payload?.candidates || []) as KeywordCandidate[];
      setCandidates(rows);
      setSelected(Object.fromEntries(rows.filter((row) => !row.duplicate && row.score >= 70).map((row) => [row.slug, true])));
      setProgress({ value: 100, label: "关键词挖掘完成。" });
      const engineLabel =
        payload?.engine === "modelC+local-rules" ? "模型C语义挖掘 + 本地规则补全" : payload?.engine === "modelC" ? "模型C语义挖掘" : "本地规则兜底";
      const warning = payload?.warning ? ` ${payload.warning}` : "";
      setLastMessage(`已生成 ${rows.length} 个候选词，可用 ${payload?.summary?.available ?? 0} 个。来源：${engineLabel}。${warning}`);
    } catch (nextError) {
      const message = nextError instanceof Error && nextError.name === "AbortError" ? "关键词挖掘请求超过 60 秒未响应，请检查模型C连接，或稍后重试。" : nextError instanceof Error ? nextError.message : "关键词挖掘失败。";
      setProgress({ value: 0, label: "" });
      setError(message);
    } finally {
      if (timeout !== undefined) window.clearTimeout(timeout);
      setBusy(null);
    }
  }

  async function addSelectedKeywords() {
    if (!keywordApiBase || selectedRows.length === 0) return;
    setBusy("add");
    setError(null);
    setLastMessage(null);

    let success = 0;
    const failed: string[] = [];

    for (const row of selectedRows) {
      const response = await fetch(keywordApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });

      if (response.ok) {
        success += 1;
      } else {
        const payload = await response.json().catch(() => null);
        failed.push(`${row.keyword}: ${payload?.message || response.status}`);
      }
    }

    setCandidates((current) => current.map((candidate) => (selected[candidate.slug] ? { ...candidate, duplicate: true, reason: "已加入关键词文件" } : candidate)));
    setSelected({});
    setLastMessage(`已加入 ${success} 个关键词。${failed.length ? `失败 ${failed.length} 个。` : ""}`);
    if (failed.length > 0) setError(failed.slice(0, 3).join("\n"));
    onKeywordsChanged?.();
    setBusy(null);
  }

  function toggleAllAvailable() {
    const available = candidates.filter((candidate) => !candidate.duplicate);
    const allSelected = available.length > 0 && available.every((candidate) => selected[candidate.slug]);
    setSelected(Object.fromEntries(available.map((candidate) => [candidate.slug, !allSelected])));
  }

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
        <h2 className="text-lg font-bold text-white">关键词挖掘工具</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-400">
          输入一个或多个种子词，系统会优先调用模型C做语义挖掘，再用本地规则补全价格词、问题词、风险词、合规词和核心事实源词。候选词可以勾选后直接加入关键词文件。
        </p>
      </div>

      {error && <pre className="mt-5 whitespace-pre-wrap rounded border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</pre>}
      {lastMessage && <div className="mt-5 rounded border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">{lastMessage}</div>}
      {busy === "research" && (
        <div className="mt-5 rounded border border-brand-500/30 bg-brand-950/20 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm text-brand-100">
            <span>{progress.label || "正在准备关键词挖掘..."}</span>
            <span className="font-mono">{progress.value}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress.value}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">模型C最长等待约 30 秒；无响应时会自动使用本地规则返回候选词。</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_160px_auto]">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          种子词
          <textarea
            value={seeds}
            onChange={(event) => setSeeds(event.target.value)}
            className="min-h-28 rounded border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-brand-500"
            placeholder={"证件翻译\n合同翻译\n设备说明书翻译"}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          生成数量
          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            inputMode="numeric"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={researchKeywords}
            disabled={busy !== null || !seeds.trim()}
            className="rounded bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {busy === "research" ? "挖掘中..." : "开始挖掘"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          候选词 {candidates.length} 个，已选择 {selectedRows.length} 个
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleAllAvailable}
            disabled={candidates.length === 0}
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-brand-500 disabled:text-slate-600"
          >
            全选/取消
          </button>
          <button
            type="button"
            onClick={addSelectedKeywords}
            disabled={busy !== null || selectedRows.length === 0 || !keywordApiBase}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {busy === "add" ? "加入中..." : "加入关键词文件"}
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">选择</th>
              <th className="px-3 py-3">关键词</th>
              <th className="px-3 py-3">slug</th>
              <th className="px-3 py-3">分类</th>
              <th className="px-3 py-3">意图</th>
              <th className="px-3 py-3">优先级</th>
              <th className="px-3 py-3">模式</th>
              <th className="px-3 py-3">来源</th>
              <th className="px-3 py-3">评分</th>
              <th className="px-3 py-3">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {candidates.map((candidate) => (
              <tr key={candidate.slug} className={candidate.duplicate ? "text-slate-600" : "text-slate-200"}>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    disabled={candidate.duplicate}
                    checked={Boolean(selected[candidate.slug])}
                    onChange={(event) => setSelected((current) => ({ ...current, [candidate.slug]: event.target.checked }))}
                    className="h-4 w-4 accent-brand-500"
                  />
                </td>
                <td className="min-w-64 px-3 py-3 font-medium">{candidate.keyword}</td>
                <td className="min-w-52 px-3 py-3 font-mono text-xs text-slate-400">{candidate.slug}</td>
                <td className="px-3 py-3">{candidate.category}</td>
                <td className="px-3 py-3">{candidate.intent}</td>
                <td className="px-3 py-3">{candidate.priority}</td>
                <td className="px-3 py-3">{candidate.contentMode === "fact-source" ? "核心事实源" : "普通文章"}</td>
                <td className="min-w-32 px-3 py-3 text-xs text-slate-400">{candidate.source}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${candidate.score >= 80 ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-300"}`}>
                    {candidate.score}
                  </span>
                </td>
                <td className="min-w-72 px-3 py-3 text-xs text-slate-400">{candidate.reason}</td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                  先输入种子词并点击“开始挖掘”。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
