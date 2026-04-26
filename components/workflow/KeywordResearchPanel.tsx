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
  searchVolume?: string;
  competition?: string;
  difficulty?: string;
};

type KeywordSourceConfig = {
  source5118: {
    enabled: boolean;
    endpoint: string;
    platform: string;
    apiKeySet: boolean;
    apiKeyMasked: string;
  };
  chinaz: {
    enabled: boolean;
    endpoint: string;
    version: string;
    apiKeySet: boolean;
    apiKeyMasked: string;
  };
};

type KeywordResearchPanelProps = {
  apiBase: string;
  keywordApiBase?: string;
  onKeywordsChanged?: () => void;
};

const emptySourceConfig: KeywordSourceConfig = {
  source5118: {
    enabled: true,
    endpoint: "https://apis.5118.com/suggest/list",
    platform: "baidu",
    apiKeySet: false,
    apiKeyMasked: "",
  },
  chinaz: {
    enabled: true,
    endpoint: "https://openapi.chinaz.net/v1/1001/longkeyword",
    version: "1.0",
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
  const [sourceSecrets, setSourceSecrets] = useState({ source5118ApiKey: "", chinazApiKey: "" });
  const [sourceUsage, setSourceUsage] = useState({ use5118: true, useChinaz: true });
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
        if (current.value >= 92) return current;
        const nextValue = Math.min(92, current.value + (current.value < 30 ? 7 : current.value < 65 ? 5 : 2));
        const nextLabel =
          nextValue < 25
            ? "正在请求 5118 下拉词和站长工具百度长尾词..."
            : nextValue < 55
              ? "正在合并 API 候选词、去重和整理指标..."
              : nextValue < 82
                ? "正在调用模型C做意图分类、主题聚类和内容模式判断..."
                : "正在等待模型C返回结构化结果...";
        return { value: nextValue, label: nextLabel };
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [busy]);

  async function fetchSourceConfig() {
    try {
      const response = await fetch(sourceApiBase, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as KeywordSourceConfig;
      setSourceConfig(payload);
      setSourceUsage({ use5118: payload.source5118.enabled, useChinaz: payload.chinaz.enabled });
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
            enabled: sourceConfig.source5118.enabled,
            endpoint: sourceConfig.source5118.endpoint,
            platform: sourceConfig.source5118.platform,
            apiKey: sourceSecrets.source5118ApiKey || undefined,
          },
          chinaz: {
            enabled: sourceConfig.chinaz.enabled,
            endpoint: sourceConfig.chinaz.endpoint,
            version: sourceConfig.chinaz.version,
            apiKey: sourceSecrets.chinazApiKey || undefined,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "保存关键词数据源配置失败。");
      setSourceConfig(payload);
      setSourceUsage({ use5118: payload.source5118.enabled, useChinaz: payload.chinaz.enabled });
      setSourceSecrets({ source5118ApiKey: "", chinazApiKey: "" });
      setLastMessage("关键词数据源配置已保存。");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存关键词数据源配置失败。");
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
    setProgress({ value: 8, label: "正在准备关键词挖掘请求..." });

    let timeout: number | undefined;
    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 90000);
      const response = await fetch(`${apiBase}/keyword-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seeds,
          limit: Number.parseInt(limit, 10) || 40,
          use5118: sourceUsage.use5118,
          useChinaz: sourceUsage.useChinaz,
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
      const warning = payload?.errors?.length ? ` 部分数据源提示：${payload.errors.slice(0, 2).join("；")}` : "";
      const semanticText = semanticRemoved > 0 ? ` 已归并 ${semanticRemoved} 个相似候选词。` : "";
      setLastMessage(`API 候选词 ${sourceItems} 个，生成候选词 ${rows.length} 个，可用 ${payload?.summary?.available ?? 0} 个。${semanticText}${warning}`);
    } catch (nextError) {
      const message =
        nextError instanceof Error && nextError.name === "AbortError"
          ? "关键词挖掘请求超过 90 秒未响应，请检查 5118/站长工具 API 或模型C连接。"
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

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
        <h2 className="text-lg font-bold text-white">关键词挖掘工具</h2>
        <p className="max-w-4xl text-sm leading-6 text-slate-400">
          输入种子词后，系统先调用 5118 下拉词和站长工具百度长尾词 API 获取真实候选词，再交给模型C做去重、意图分类、主题聚类和内容模式判断。模型C不再凭空补充本地规则词。
        </p>
      </div>

      {error && <pre className="mt-5 whitespace-pre-wrap rounded border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</pre>}
      {lastMessage && <div className="mt-5 rounded border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">{lastMessage}</div>}

      <div className="mt-5 rounded border border-slate-700 bg-slate-950/30 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">关键词数据源配置</h3>
            <p className="mt-1 text-xs text-slate-400">API Key 只保存在本地 local-brain/.env。留空保存时会沿用已保存密钥。</p>
          </div>
          <button
            type="button"
            onClick={saveSourceConfig}
            disabled={busy !== null}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {busy === "saveSources" ? "保存中..." : "保存数据源配置"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-slate-800 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={sourceConfig.source5118.enabled}
                onChange={(event) => {
                  setSourceConfig((current) => ({ ...current, source5118: { ...current.source5118, enabled: event.target.checked } }));
                  setSourceUsage((current) => ({ ...current, use5118: event.target.checked }));
                }}
                className="h-4 w-4 accent-brand-500"
              />
              5118 下拉词 API
            </label>
            <div className="mt-3 grid gap-3">
              <input
                value={sourceConfig.source5118.endpoint}
                onChange={(event) => setSourceConfig((current) => ({ ...current, source5118: { ...current.source5118, endpoint: event.target.value } }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
                placeholder="https://apis.5118.com/suggest/list"
              />
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <input
                  value={sourceConfig.source5118.platform}
                  onChange={(event) => setSourceConfig((current) => ({ ...current, source5118: { ...current.source5118, platform: event.target.value } }))}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
                  placeholder="baidu"
                />
                <input
                  value={sourceSecrets.source5118ApiKey}
                  onChange={(event) => setSourceSecrets((current) => ({ ...current, source5118ApiKey: event.target.value }))}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
                  placeholder={sourceConfig.source5118.apiKeySet ? `已保存：${sourceConfig.source5118.apiKeyMasked}` : "5118 API Key"}
                  type="password"
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-slate-800 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={sourceConfig.chinaz.enabled}
                onChange={(event) => {
                  setSourceConfig((current) => ({ ...current, chinaz: { ...current.chinaz, enabled: event.target.checked } }));
                  setSourceUsage((current) => ({ ...current, useChinaz: event.target.checked }));
                }}
                className="h-4 w-4 accent-brand-500"
              />
              站长工具百度长尾词 API
            </label>
            <div className="mt-3 grid gap-3">
              <input
                value={sourceConfig.chinaz.endpoint}
                onChange={(event) => setSourceConfig((current) => ({ ...current, chinaz: { ...current.chinaz, endpoint: event.target.value } }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
                placeholder="https://openapi.chinaz.net/v1/1001/longkeyword"
              />
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <input
                  value={sourceConfig.chinaz.version}
                  onChange={(event) => setSourceConfig((current) => ({ ...current, chinaz: { ...current.chinaz, version: event.target.value } }))}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
                  placeholder="1.0"
                />
                <input
                  value={sourceSecrets.chinazApiKey}
                  onChange={(event) => setSourceSecrets((current) => ({ ...current, chinazApiKey: event.target.value }))}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
                  placeholder={sourceConfig.chinaz.apiKeySet ? `已保存：${sourceConfig.chinaz.apiKeyMasked}` : "站长工具 APIKey"}
                  type="password"
                />
              </div>
            </div>
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
          <p className="mt-2 text-xs text-slate-400">流程：5118/站长工具 API → 合并去重 → 模型C分类评分 → 候选词表。</p>
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
            disabled={busy !== null || !seeds.trim() || (!sourceUsage.use5118 && !sourceUsage.useChinaz)}
            className="rounded bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {busy === "research" ? "挖掘中..." : "开始挖掘"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sourceUsage.use5118}
            onChange={(event) => setSourceUsage((current) => ({ ...current, use5118: event.target.checked }))}
            className="h-4 w-4 accent-brand-500"
          />
          本次使用 5118
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sourceUsage.useChinaz}
            onChange={(event) => setSourceUsage((current) => ({ ...current, useChinaz: event.target.checked }))}
            className="h-4 w-4 accent-brand-500"
          />
          本次使用站长工具
        </label>
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
                  先配置数据源、输入种子词，然后点击“开始挖掘”。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
