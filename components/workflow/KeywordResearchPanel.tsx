"use client";

import { useEffect, useMemo, useState } from "react";

type ResearchDepth = "suggest" | "longtail" | "full";

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
  searchVolume?: string;
  competition?: string;
  difficulty?: string;
};

type KeywordSourceConfig = {
  source5118: {
    enabled: boolean;
    suggestEndpoint: string;
    longTailEndpoint: string;
    metricsEndpoint: string;
    platforms: string[];
    defaultDepth: ResearchDepth;
    suggestLimitPerPlatform: number;
    expandTopN: number;
    longTailPageSize: number;
    metricLimit: number;
    metricPollSeconds: number;
    apiKeySet: boolean;
    apiKeyMasked: string;
  };
};

type KeywordResearchPanelProps = {
  apiBase: string;
  keywordApiBase?: string;
  onKeywordsChanged?: () => void;
};

const platformOptions = [
  { value: "baidu", label: "百度PC" },
  { value: "baidumobile", label: "百度移动" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "douyin", label: "抖音" },
];

const emptySourceConfig: KeywordSourceConfig = {
  source5118: {
    enabled: true,
    suggestEndpoint: "https://apis.5118.com/suggest/list",
    longTailEndpoint: "https://apis.5118.com/keyword/word/v2",
    metricsEndpoint: "https://apis.5118.com/keywordparam/v2",
    platforms: ["baidu", "baidumobile", "xiaohongshu", "douyin"],
    defaultDepth: "full",
    suggestLimitPerPlatform: 30,
    expandTopN: 8,
    longTailPageSize: 30,
    metricLimit: 80,
    metricPollSeconds: 90,
    apiKeySet: false,
    apiKeyMasked: "",
  },
};

function getCandidateKey(candidate: KeywordCandidate, index: number) {
  return `${candidate.slug || candidate.keyword}:${index}`;
}

export function KeywordResearchPanel({ apiBase, keywordApiBase, onKeywordsChanged }: KeywordResearchPanelProps) {
  const [seeds, setSeeds] = useState("证件翻译\n合同翻译\n设备说明书翻译");
  const [limit, setLimit] = useState("40");
  const [busy, setBusy] = useState<"research" | "add" | "saveSources" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<KeywordCandidate[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [sourceConfig, setSourceConfig] = useState<KeywordSourceConfig>(emptySourceConfig);
  const [sourceSecret, setSourceSecret] = useState("");
  const sourceApiBase = `${apiBase}/keyword-sources`;

  const selectedRows = useMemo(
    () => candidates.filter((candidate, index) => selected[getCandidateKey(candidate, index)] && !candidate.duplicate),
    [candidates, selected],
  );

  useEffect(() => {
    fetchSourceConfig();
  }, []);

  useEffect(() => {
    if (busy !== "research") return;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current.value >= 94) return current;
        const nextValue = Math.min(94, current.value + (current.value < 25 ? 7 : current.value < 58 ? 4 : 2));
        const nextLabel =
          nextValue < 25
            ? "正在调用 5118 suggest/list 获取多平台下拉词..."
            : nextValue < 50
              ? "正在调用 5118 keyword/word/v2 扩展高价值长尾词..."
              : nextValue < 76
                ? "正在调用 5118 keywordparam/v2 补搜索量、指数和竞价数据..."
                : "正在调用模型C做去重、分类、评分和内容模式判断...";
        return { value: nextValue, label: nextLabel };
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [busy]);

  async function fetchSourceConfig() {
    try {
      const response = await fetch(sourceApiBase, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as KeywordSourceConfig;
      setSourceConfig(payload);
    } catch {
      // The dashboard can still render; saving will show the concrete error if needed.
    }
  }

  async function saveSourceConfig() {
    setBusy("saveSources");
    setError(null);
    setLastMessage(null);

    try {
      const response = await fetch(sourceApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source5118: {
            ...sourceConfig.source5118,
            apiKey: sourceSecret || undefined,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "保存 5118 配置失败。");
      setSourceConfig(payload);
      setSourceSecret("");
      setLastMessage("5118 关键词数据源配置已保存。");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存 5118 配置失败。");
    } finally {
      setBusy(null);
    }
  }

  async function researchKeywords() {
    setBusy("research");
    setError(null);
    setLastMessage(null);
    setCandidates([]);
    setSelected({});
    setProgress({ value: 8, label: "正在准备 5118 全链路关键词挖掘..." });

    let timeout: number | undefined;
    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 180000);
      const response = await fetch(`${apiBase}/keyword-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seeds,
          limit: Number.parseInt(limit, 10) || 40,
          platforms: sourceConfig.source5118.platforms,
          depth: sourceConfig.source5118.defaultDepth,
          suggestLimitPerPlatform: sourceConfig.source5118.suggestLimitPerPlatform,
          expandTopN: sourceConfig.source5118.expandTopN,
          longTailPageSize: sourceConfig.source5118.longTailPageSize,
          metricLimit: sourceConfig.source5118.metricLimit,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "关键词挖掘失败。");

      const rows = (payload?.candidates || []) as KeywordCandidate[];
      setCandidates(rows);
      setSelected(Object.fromEntries(rows.map((row, index) => [getCandidateKey(row, index), !row.duplicate && row.score >= 70])));
      setProgress({ value: 100, label: "关键词挖掘完成。" });

      const semanticRemoved = Number(payload?.summary?.semanticRemoved || 0);
      const sourceItems = Number(payload?.summary?.sourceItems || 0);
      const warning = payload?.errors?.length ? ` 提示：${payload.errors.slice(0, 2).join("；")}` : "";
      const semanticText = semanticRemoved > 0 ? ` 已归并 ${semanticRemoved} 个相似候选词。` : "";
      const stats = `下拉调用 ${payload?.summary?.suggestCalls ?? 0} 次，长尾调用 ${payload?.summary?.longTailCalls ?? 0} 次，补指标 ${payload?.summary?.metricKeywords ?? 0} 个。`;
      setLastMessage(`5118 候选词 ${sourceItems} 个，模型C输出 ${rows.length} 个，可用 ${payload?.summary?.available ?? 0} 个。${stats}${semanticText}${warning}`);
    } catch (nextError) {
      const message =
        nextError instanceof Error && nextError.name === "AbortError"
          ? "关键词挖掘请求超过 180 秒未响应，请检查 5118 API 权限、keywordparam/v2 指标任务或模型C连接。"
          : nextError instanceof Error
            ? nextError.message
            : "关键词挖掘失败。";
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

    setCandidates((current) =>
      current.map((candidate, index) =>
        selected[getCandidateKey(candidate, index)] ? { ...candidate, duplicate: true, reason: "已加入关键词文件" } : candidate,
      ),
    );
    setSelected({});
    setLastMessage(`已加入 ${success} 个关键词。${failed.length ? `失败 ${failed.length} 个。` : ""}`);
    if (failed.length > 0) setError(failed.slice(0, 3).join("\n"));
    onKeywordsChanged?.();
    setBusy(null);
  }

  function toggleAllAvailable() {
    const available = candidates.filter((candidate) => !candidate.duplicate);
    const allSelected = available.length > 0 && candidates.every((candidate, index) => candidate.duplicate || selected[getCandidateKey(candidate, index)]);
    setSelected(Object.fromEntries(candidates.map((candidate, index) => [getCandidateKey(candidate, index), !candidate.duplicate && !allSelected])));
  }

  function updateSourceConfig(next: Partial<KeywordSourceConfig["source5118"]>) {
    setSourceConfig((current) => ({ source5118: { ...current.source5118, ...next } }));
  }

  function togglePlatform(platform: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...sourceConfig.source5118.platforms, platform]))
      : sourceConfig.source5118.platforms.filter((item) => item !== platform);
    updateSourceConfig({ platforms: next.length > 0 ? next : ["baidu"] });
  }

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
        <h2 className="text-lg font-bold text-white">关键词挖掘工具</h2>
        <p className="max-w-4xl text-sm leading-6 text-slate-400">
          点击“开始挖掘”后，系统会自动完成：种子词 → 5118 下拉词 → 5118 长尾扩展 → 5118 指标补全 → 模型C去重分类 → 候选词表。模型C只做分类和评分，不凭空造词。
        </p>
      </div>

      {error && <pre className="mt-5 whitespace-pre-wrap rounded border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</pre>}
      {lastMessage && <div className="mt-5 rounded border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">{lastMessage}</div>}

      <div className="mt-5 rounded border border-slate-700 bg-slate-950/30 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">5118 全链路配置</h3>
            <p className="mt-1 text-xs text-slate-400">API Key 只保存在本地 local-brain/.env。keywordparam/v2 是异步任务，指标补全可能需要等待。</p>
          </div>
          <button
            type="button"
            onClick={saveSourceConfig}
            disabled={busy !== null}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {busy === "saveSources" ? "保存中..." : "保存5118配置"}
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
            <input
              value={sourceConfig.source5118.suggestEndpoint}
              onChange={(event) => updateSourceConfig({ suggestEndpoint: event.target.value })}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="suggest/list"
            />
            <input
              value={sourceConfig.source5118.longTailEndpoint}
              onChange={(event) => updateSourceConfig({ longTailEndpoint: event.target.value })}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="keyword/word/v2"
            />
            <input
              value={sourceConfig.source5118.metricsEndpoint}
              onChange={(event) => updateSourceConfig({ metricsEndpoint: event.target.value })}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="keywordparam/v2"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <input
              value={sourceSecret}
              onChange={(event) => setSourceSecret(event.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder={sourceConfig.source5118.apiKeySet ? `已保存：${sourceConfig.source5118.apiKeyMasked}` : "5118 API Key"}
              type="password"
            />
            <select
              value={sourceConfig.source5118.defaultDepth}
              onChange={(event) => updateSourceConfig({ defaultDepth: event.target.value as ResearchDepth })}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            >
              <option value="suggest">只跑下拉词</option>
              <option value="longtail">下拉词 + 长尾扩展</option>
              <option value="full">全流程补指标</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            {platformOptions.map((platform) => (
              <label key={platform.value} className="flex items-center gap-2 rounded border border-slate-700 px-3 py-2">
                <input
                  type="checkbox"
                  checked={sourceConfig.source5118.platforms.includes(platform.value)}
                  onChange={(event) => togglePlatform(platform.value, event.target.checked)}
                  className="h-4 w-4 accent-brand-500"
                />
                {platform.label}
              </label>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <NumberField label="每平台下拉词" value={sourceConfig.source5118.suggestLimitPerPlatform} onChange={(value) => updateSourceConfig({ suggestLimitPerPlatform: value })} />
            <NumberField label="扩长尾TopN" value={sourceConfig.source5118.expandTopN} onChange={(value) => updateSourceConfig({ expandTopN: value })} />
            <NumberField label="长尾每页数量" value={sourceConfig.source5118.longTailPageSize} onChange={(value) => updateSourceConfig({ longTailPageSize: value })} />
            <NumberField label="补指标词数" value={sourceConfig.source5118.metricLimit} onChange={(value) => updateSourceConfig({ metricLimit: value })} />
            <NumberField label="指标等待秒数" value={sourceConfig.source5118.metricPollSeconds} onChange={(value) => updateSourceConfig({ metricPollSeconds: value })} />
          </div>
        </div>
      </div>

      {busy === "research" && (
        <div className="mt-5 rounded border border-brand-500/30 bg-brand-950/20 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm text-brand-100">
            <span>{progress.label || "正在准备关键词挖掘..."}</span>
            <span className="font-mono">{progress.value}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress.value}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">流程：suggest/list → keyword/word/v2 → keywordparam/v2 → 模型C分类评分 → 候选词表。</p>
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
          输出数量
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
            disabled={busy !== null || !seeds.trim() || sourceConfig.source5118.platforms.length === 0}
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
              <th className="px-3 py-3">搜索量</th>
              <th className="px-3 py-3">竞争度</th>
              <th className="px-3 py-3">难度</th>
              <th className="px-3 py-3">来源</th>
              <th className="px-3 py-3">评分</th>
              <th className="px-3 py-3">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {candidates.map((candidate, index) => (
              <tr key={getCandidateKey(candidate, index)} className={candidate.duplicate ? "text-slate-600" : "text-slate-200"}>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    disabled={candidate.duplicate}
                    checked={Boolean(selected[getCandidateKey(candidate, index)])}
                    onChange={(event) => setSelected((current) => ({ ...current, [getCandidateKey(candidate, index)]: event.target.checked }))}
                    className="h-4 w-4 accent-brand-500"
                  />
                </td>
                <td className="min-w-64 px-3 py-3 font-medium">{candidate.keyword}</td>
                <td className="min-w-52 px-3 py-3 font-mono text-xs text-slate-400">{candidate.slug}</td>
                <td className="px-3 py-3">{candidate.category}</td>
                <td className="px-3 py-3">{candidate.intent}</td>
                <td className="px-3 py-3">{candidate.priority}</td>
                <td className="px-3 py-3">{candidate.contentMode === "fact-source" ? "核心事实源" : "普通文章"}</td>
                <td className="px-3 py-3">{candidate.searchVolume || "-"}</td>
                <td className="px-3 py-3">{candidate.competition || "-"}</td>
                <td className="px-3 py-3">{candidate.difficulty || "-"}</td>
                <td className="min-w-36 px-3 py-3 text-xs text-slate-400">{candidate.source}</td>
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
                <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                  先配置 5118 API Key、输入种子词，然后点击“开始挖掘”。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-2 text-xs text-slate-400">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10) || 0)}
        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
        inputMode="numeric"
      />
    </label>
  );
}
