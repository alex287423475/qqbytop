"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type ResearchDepth = "suggest" | "longtail" | "full";
type ResearchMode = "api" | "manual";
type ManualStage = "suggest" | "longtail" | "metrics";

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

type ManualSourceItem = {
  keyword: string;
  source: string;
  platforms?: string[];
  stage: "suggest" | "longtail";
  fileName?: string;
  searchVolume?: number;
  pcSearchVolume?: number;
  mobileSearchVolume?: number;
  index?: number;
  mobileIndex?: number;
  douyinIndex?: number;
  semPrice?: number | string;
  competition?: string;
  difficulty?: string;
  pageCount?: number;
  longKeywordCount?: number;
  bidwordCompanyCount?: number;
  features?: string;
  score?: number;
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
  const [mode, setMode] = useState<ResearchMode>("api");
  const [seeds, setSeeds] = useState("证件翻译\n合同翻译\n设备说明书翻译");
  const [limit, setLimit] = useState("40");
  const [busy, setBusy] = useState<"research" | "manualClassify" | "add" | "saveSources" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<KeywordCandidate[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [sourceConfig, setSourceConfig] = useState<KeywordSourceConfig>(emptySourceConfig);
  const [sourceSecret, setSourceSecret] = useState("");
  const [manualSuggestRows, setManualSuggestRows] = useState<ManualSourceItem[]>([]);
  const [manualLongTailRows, setManualLongTailRows] = useState<ManualSourceItem[]>([]);
  const [manualMetricRows, setManualMetricRows] = useState<ManualSourceItem[]>([]);
  const [manualExpandTopN, setManualExpandTopN] = useState(10);
  const [manualMetricTopN, setManualMetricTopN] = useState(100);
  const sourceApiBase = `${apiBase}/keyword-sources`;

  const selectedRows = useMemo(
    () => candidates.filter((candidate, index) => selected[getCandidateKey(candidate, index)] && !candidate.duplicate),
    [candidates, selected],
  );

  const suggestPool = useMemo(() => mergeManualSourceItems(manualSuggestRows), [manualSuggestRows]);
  const longTailPool = useMemo(() => mergeManualSourceItems(manualLongTailRows), [manualLongTailRows]);
  const metricPool = useMemo(() => mergeManualSourceItems(manualMetricRows), [manualMetricRows]);
  const expansionRecommendations = useMemo(() => rankManualItems(suggestPool).slice(0, manualExpandTopN), [suggestPool, manualExpandTopN]);
  const metricRecommendations = useMemo(
    () => rankManualItems(mergeManualSourceItems([...suggestPool, ...longTailPool])).slice(0, manualMetricTopN),
    [suggestPool, longTailPool, manualMetricTopN],
  );
  const manualFinalPool = useMemo(() => mergeManualSourceItems([...suggestPool, ...longTailPool, ...metricPool]), [suggestPool, longTailPool, metricPool]);

  useEffect(() => {
    fetchSourceConfig();
  }, []);

  useEffect(() => {
    if (busy !== "research" && busy !== "manualClassify") return;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current.value >= 94) return current;
        const nextValue = Math.min(94, current.value + (current.value < 25 ? 7 : current.value < 58 ? 4 : 2));
        const nextLabel =
          busy === "manualClassify"
            ? nextValue < 40
              ? "正在整理手动导入的 5118 词池..."
              : "正在调用模型C做去重、分类、评分和内容模式判断..."
            : nextValue < 25
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
      applyCandidatePayload(payload, "关键词挖掘完成。");

      const semanticRemoved = Number(payload?.summary?.semanticRemoved || 0);
      const sourceItems = Number(payload?.summary?.sourceItems || 0);
      const warning = payload?.errors?.length ? ` 提示：${payload.errors.slice(0, 2).join("；")}` : "";
      const semanticText = semanticRemoved > 0 ? ` 已归并 ${semanticRemoved} 个相似候选词。` : "";
      const stats = `下拉调用 ${payload?.summary?.suggestCalls ?? 0} 次，长尾调用 ${payload?.summary?.longTailCalls ?? 0} 次，补指标 ${payload?.summary?.metricKeywords ?? 0} 个。`;
      setLastMessage(`5118 候选词 ${sourceItems} 个，模型C输出 ${payload?.candidates?.length || 0} 个，可用 ${payload?.summary?.available ?? 0} 个。${stats}${semanticText}${warning}`);
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

  async function classifyManualImport() {
    if (manualFinalPool.length === 0) {
      setError("请先上传 5118 下拉词、长尾词或指标文件。");
      return;
    }

    setBusy("manualClassify");
    setError(null);
    setLastMessage(null);
    setCandidates([]);
    setSelected({});
    setProgress({ value: 10, label: "正在准备手动导入词池..." });

    let timeout: number | undefined;
    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 90000);
      const sourceItems = rankManualItems(manualFinalPool)
        .slice(0, 500)
        .map((item) => ({
          keyword: item.keyword,
          source: item.source,
          platforms: item.platforms,
          stage: item.stage,
          searchVolume: item.searchVolume,
          pcSearchVolume: item.pcSearchVolume,
          mobileSearchVolume: item.mobileSearchVolume,
          index: item.index,
          mobileIndex: item.mobileIndex,
          douyinIndex: item.douyinIndex,
          semPrice: item.semPrice,
          competition: item.competition,
          difficulty: item.difficulty,
          pageCount: item.pageCount,
          longKeywordCount: item.longKeywordCount,
          bidwordCompanyCount: item.bidwordCompanyCount,
          features: item.features,
        }));
      const response = await fetch(`${apiBase}/keyword-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seeds,
          limit: Number.parseInt(limit, 10) || 40,
          sourceMode: "manual-import",
          sourceItems,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "模型C处理手动导入词失败。");
      applyCandidatePayload(payload, "手动导入词池处理完成。");
      setLastMessage(
        `手动导入词池 ${sourceItems.length} 个，模型C输出 ${payload?.candidates?.length || 0} 个，可用 ${payload?.summary?.available ?? 0} 个。`,
      );
    } catch (nextError) {
      const message =
        nextError instanceof Error && nextError.name === "AbortError"
          ? "模型C处理手动导入词超过 90 秒未响应，请检查模型C连接。"
          : nextError instanceof Error
            ? nextError.message
            : "模型C处理手动导入词失败。";
      setProgress({ value: 0, label: "" });
      setError(message);
    } finally {
      if (timeout !== undefined) window.clearTimeout(timeout);
      setBusy(null);
    }
  }

  function applyCandidatePayload(payload: any, label: string) {
    const rows = (payload?.candidates || []) as KeywordCandidate[];
    setCandidates(rows);
    setSelected(Object.fromEntries(rows.map((row, index) => [getCandidateKey(row, index), !row.duplicate && row.score >= 70])));
    setProgress({ value: 100, label });
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

  async function handleManualFiles(event: ChangeEvent<HTMLInputElement>, stage: ManualStage) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setLastMessage(null);
    try {
      const parsed = (await Promise.all(files.map((file) => parseManualFile(file, stage)))).flat();
      if (parsed.length === 0) throw new Error("没有从文件中解析到关键词，请检查导出文件是否包含“关键词”列。");
      if (stage === "suggest") setManualSuggestRows((current) => mergeManualSourceItems([...current, ...parsed]));
      if (stage === "longtail") setManualLongTailRows((current) => mergeManualSourceItems([...current, ...parsed]));
      if (stage === "metrics") setManualMetricRows((current) => mergeManualSourceItems([...current, ...parsed]));
      setLastMessage(`已导入 ${files.length} 个文件，解析到 ${parsed.length} 条关键词。`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "解析 5118 导出文件失败。");
    }
  }

  async function copyKeywordList(rows: ManualSourceItem[], label: string) {
    const text = rows.map((row) => row.keyword).join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setLastMessage(`已复制 ${rows.length} 个${label}。`);
  }

  function clearManualStage(stage: ManualStage) {
    if (stage === "suggest") setManualSuggestRows([]);
    if (stage === "longtail") setManualLongTailRows([]);
    if (stage === "metrics") setManualMetricRows([]);
    setLastMessage(null);
    setError(null);
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
          支持两种方式：API自动挖掘直接调用 5118 全链路；手动导入用于把 5118 后台导出的下拉词、长尾词、批量查指数文件上传到面板，再交给模型C分类和筛选。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ModeButton active={mode === "api"} onClick={() => setMode("api")}>
            API自动挖掘
          </ModeButton>
          <ModeButton active={mode === "manual"} onClick={() => setMode("manual")}>
            5118手动导入
          </ModeButton>
        </div>
      </div>

      {error && <pre className="mt-5 whitespace-pre-wrap rounded border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</pre>}
      {lastMessage && <div className="mt-5 rounded border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">{lastMessage}</div>}

      {mode === "api" ? (
        <ApiResearchControls
          busy={busy}
          sourceConfig={sourceConfig}
          sourceSecret={sourceSecret}
          seeds={seeds}
          limit={limit}
          setSeeds={setSeeds}
          setLimit={setLimit}
          setSourceSecret={setSourceSecret}
          saveSourceConfig={saveSourceConfig}
          researchKeywords={researchKeywords}
          updateSourceConfig={updateSourceConfig}
          togglePlatform={togglePlatform}
        />
      ) : (
        <ManualImportControls
          busy={busy}
          seeds={seeds}
          limit={limit}
          setSeeds={setSeeds}
          setLimit={setLimit}
          suggestRows={suggestPool}
          longTailRows={longTailPool}
          metricRows={metricPool}
          finalRows={manualFinalPool}
          expansionRecommendations={expansionRecommendations}
          metricRecommendations={metricRecommendations}
          manualExpandTopN={manualExpandTopN}
          manualMetricTopN={manualMetricTopN}
          setManualExpandTopN={setManualExpandTopN}
          setManualMetricTopN={setManualMetricTopN}
          handleManualFiles={handleManualFiles}
          clearManualStage={clearManualStage}
          copyKeywordList={copyKeywordList}
          classifyManualImport={classifyManualImport}
        />
      )}

      {(busy === "research" || busy === "manualClassify") && (
        <div className="mt-5 rounded border border-brand-500/30 bg-brand-950/20 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm text-brand-100">
            <span>{progress.label || "正在准备关键词挖掘..."}</span>
            <span className="font-mono">{progress.value}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress.value}%` }} />
          </div>
        </div>
      )}

      <CandidateActions
        candidates={candidates}
        selectedRows={selectedRows}
        busy={busy}
        keywordApiBase={keywordApiBase}
        toggleAllAvailable={toggleAllAvailable}
        addSelectedKeywords={addSelectedKeywords}
      />

      <CandidateTable candidates={candidates} selected={selected} setSelected={setSelected} />
    </section>
  );
}

function ApiResearchControls(props: {
  busy: string | null;
  sourceConfig: KeywordSourceConfig;
  sourceSecret: string;
  seeds: string;
  limit: string;
  setSeeds: (value: string) => void;
  setLimit: (value: string) => void;
  setSourceSecret: (value: string) => void;
  saveSourceConfig: () => void;
  researchKeywords: () => void;
  updateSourceConfig: (next: Partial<KeywordSourceConfig["source5118"]>) => void;
  togglePlatform: (platform: string, checked: boolean) => void;
}) {
  const {
    busy,
    sourceConfig,
    sourceSecret,
    seeds,
    limit,
    setSeeds,
    setLimit,
    setSourceSecret,
    saveSourceConfig,
    researchKeywords,
    updateSourceConfig,
    togglePlatform,
  } = props;

  return (
    <>
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_160px_auto]">
        <SeedAndLimitFields seeds={seeds} limit={limit} setSeeds={setSeeds} setLimit={setLimit} />
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
    </>
  );
}

function ManualImportControls(props: {
  busy: string | null;
  seeds: string;
  limit: string;
  setSeeds: (value: string) => void;
  setLimit: (value: string) => void;
  suggestRows: ManualSourceItem[];
  longTailRows: ManualSourceItem[];
  metricRows: ManualSourceItem[];
  finalRows: ManualSourceItem[];
  expansionRecommendations: ManualSourceItem[];
  metricRecommendations: ManualSourceItem[];
  manualExpandTopN: number;
  manualMetricTopN: number;
  setManualExpandTopN: (value: number) => void;
  setManualMetricTopN: (value: number) => void;
  handleManualFiles: (event: ChangeEvent<HTMLInputElement>, stage: ManualStage) => void;
  clearManualStage: (stage: ManualStage) => void;
  copyKeywordList: (rows: ManualSourceItem[], label: string) => void;
  classifyManualImport: () => void;
}) {
  const {
    busy,
    seeds,
    limit,
    setSeeds,
    setLimit,
    suggestRows,
    longTailRows,
    metricRows,
    finalRows,
    expansionRecommendations,
    metricRecommendations,
    manualExpandTopN,
    manualMetricTopN,
    setManualExpandTopN,
    setManualMetricTopN,
    handleManualFiles,
    clearManualStage,
    copyKeywordList,
    classifyManualImport,
  } = props;

  return (
    <div className="mt-5 grid gap-5">
      <div className="rounded border border-slate-700 bg-slate-950/30 p-4">
        <h3 className="font-semibold text-white">5118 手动三步导入</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          第一步上传下拉词导出文件，复制高价值词去 5118 做长尾扩展；第二步上传长尾词导出文件，复制高价值词去批量查指数；第三步上传指标文件，模型C会基于真实数据输出候选词表。每一步都支持一次选择多个 CSV/TXT 文件。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_160px]">
        <SeedAndLimitFields seeds={seeds} limit={limit} setSeeds={setSeeds} setLimit={setLimit} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ManualStageCard
          title="1. 上传下拉词文件"
          description="5118 下拉词/全网下拉词导出，可多选多个种子词或平台的文件。"
          rows={suggestRows}
          stage="suggest"
          buttonLabel="上传下拉词"
          onFiles={handleManualFiles}
          onClear={clearManualStage}
        />
        <ManualStageCard
          title="2. 上传长尾词文件"
          description="把第一步筛出的词放进 5118 长尾词工具后，上传导出的长尾词文件。"
          rows={longTailRows}
          stage="longtail"
          buttonLabel="上传长尾词"
          onFiles={handleManualFiles}
          onClear={clearManualStage}
        />
        <ManualStageCard
          title="3. 上传指标文件"
          description="5118 批量查指数导出，建议包含搜索量、指数、竞价竞争度、点击价格等字段。"
          rows={metricRows}
          stage="metrics"
          buttonLabel="上传指标词"
          onFiles={handleManualFiles}
          onClear={clearManualStage}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecommendationCard
          title="建议用于扩长尾"
          description="从下拉词里按商业意图筛出，复制后放入 5118 长尾词工具。"
          rows={expansionRecommendations}
          value={manualExpandTopN}
          onChange={setManualExpandTopN}
          onCopy={() => copyKeywordList(expansionRecommendations, "扩长尾词")}
        />
        <RecommendationCard
          title="建议用于补指标"
          description="从下拉词 + 长尾词里筛出，复制后放入 5118 批量查指数。"
          rows={metricRecommendations}
          value={manualMetricTopN}
          onChange={setManualMetricTopN}
          onCopy={() => copyKeywordList(metricRecommendations, "补指标词")}
        />
      </div>

      <div className="flex flex-col gap-3 rounded border border-slate-700 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-300">
          手动词池已合并去重 <span className="font-semibold text-white">{finalRows.length}</span> 个，其中指标词{" "}
          <span className="font-semibold text-white">{metricRows.length}</span> 个。
        </div>
        <button
          type="button"
          onClick={classifyManualImport}
          disabled={busy !== null || finalRows.length === 0}
          className="rounded bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {busy === "manualClassify" ? "模型C处理中..." : "模型C处理导入词"}
        </button>
      </div>
    </div>
  );
}

function SeedAndLimitFields(props: {
  seeds: string;
  limit: string;
  setSeeds: (value: string) => void;
  setLimit: (value: string) => void;
}) {
  return (
    <>
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        种子词
        <textarea
          value={props.seeds}
          onChange={(event) => props.setSeeds(event.target.value)}
          className="min-h-28 rounded border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-brand-500"
          placeholder={"证件翻译\n合同翻译\n设备说明书翻译"}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        输出数量
        <input
          value={props.limit}
          onChange={(event) => props.setLimit(event.target.value)}
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
          inputMode="numeric"
        />
      </label>
    </>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-4 py-2 text-sm font-semibold ${
        active ? "border-brand-500 bg-brand-600 text-white" : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-brand-500"
      }`}
    >
      {children}
    </button>
  );
}

function ManualStageCard(props: {
  title: string;
  description: string;
  rows: ManualSourceItem[];
  stage: ManualStage;
  buttonLabel: string;
  onFiles: (event: ChangeEvent<HTMLInputElement>, stage: ManualStage) => void;
  onClear: (stage: ManualStage) => void;
}) {
  const topRows = rankManualItems(props.rows).slice(0, 4);
  return (
    <div className="rounded border border-slate-700 bg-slate-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-white">{props.title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-400">{props.description}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{props.rows.length} 个</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">
          {props.buttonLabel}
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            multiple
            onChange={(event) => props.onFiles(event, props.stage)}
            className="sr-only"
          />
        </label>
        <button
          type="button"
          onClick={() => props.onClear(props.stage)}
          disabled={props.rows.length === 0}
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-brand-500 disabled:text-slate-600"
        >
          清空
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {topRows.map((row) => (
          <div key={`${props.stage}-${row.keyword}`} className="flex items-center justify-between gap-3 rounded bg-slate-900 px-3 py-2 text-xs">
            <span className="truncate text-slate-200">{row.keyword}</span>
            <span className="text-slate-500">{row.score || 0}</span>
          </div>
        ))}
        {props.rows.length === 0 && <p className="rounded bg-slate-900 px-3 py-6 text-center text-xs text-slate-500">等待上传文件</p>}
      </div>
    </div>
  );
}

function RecommendationCard(props: {
  title: string;
  description: string;
  rows: ManualSourceItem[];
  value: number;
  onChange: (value: number) => void;
  onCopy: () => void;
}) {
  return (
    <div className="rounded border border-slate-700 bg-slate-950/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-semibold text-white">{props.title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-400">{props.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={props.value}
            onChange={(event) => props.onChange(Number.parseInt(event.target.value, 10) || 0)}
            className="w-20 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            inputMode="numeric"
          />
          <button
            type="button"
            onClick={props.onCopy}
            disabled={props.rows.length === 0}
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-brand-500 disabled:text-slate-600"
          >
            复制
          </button>
        </div>
      </div>
      <div className="mt-4 max-h-64 overflow-y-auto rounded border border-slate-800">
        {props.rows.map((row) => (
          <div key={`${props.title}-${row.keyword}`} className="grid grid-cols-[1fr_64px] gap-3 border-b border-slate-800 px-3 py-2 text-xs last:border-b-0">
            <span className="truncate text-slate-200">{row.keyword}</span>
            <span className="text-right text-slate-500">{row.score || 0}</span>
          </div>
        ))}
        {props.rows.length === 0 && <p className="px-3 py-8 text-center text-xs text-slate-500">暂无推荐词</p>}
      </div>
    </div>
  );
}

function CandidateActions(props: {
  candidates: KeywordCandidate[];
  selectedRows: KeywordCandidate[];
  busy: string | null;
  keywordApiBase?: string;
  toggleAllAvailable: () => void;
  addSelectedKeywords: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-400">
        候选词 {props.candidates.length} 个，已选择 {props.selectedRows.length} 个
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={props.toggleAllAvailable}
          disabled={props.candidates.length === 0}
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-brand-500 disabled:text-slate-600"
        >
          全选/取消
        </button>
        <button
          type="button"
          onClick={props.addSelectedKeywords}
          disabled={props.busy !== null || props.selectedRows.length === 0 || !props.keywordApiBase}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {props.busy === "add" ? "加入中..." : "加入关键词文件"}
        </button>
      </div>
    </div>
  );
}

function CandidateTable(props: {
  candidates: KeywordCandidate[];
  selected: Record<string, boolean>;
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
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
          {props.candidates.map((candidate, index) => (
            <tr key={getCandidateKey(candidate, index)} className={candidate.duplicate ? "text-slate-600" : "text-slate-200"}>
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  disabled={candidate.duplicate}
                  checked={Boolean(props.selected[getCandidateKey(candidate, index)])}
                  onChange={(event) => props.setSelected((current) => ({ ...current, [getCandidateKey(candidate, index)]: event.target.checked }))}
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
          {props.candidates.length === 0 && (
            <tr>
              <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                API模式可直接挖掘；手动模式可上传 5118 导出文件后交给模型C处理。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
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

async function parseManualFile(file: File, stage: ManualStage) {
  const text = await readFileText(file);
  const rows = parseCsvLike(text);
  return rows
    .map((row) => mapImportedRow(row, stage, file.name))
    .filter((item): item is ManualSourceItem => Boolean(item?.keyword))
    .map((item) => ({ ...item, score: scoreManualItem(item) }));
}

function readFileText(file: File) {
  return file.arrayBuffer().then((buffer) => {
    const utf8 = new TextDecoder("utf-8").decode(buffer);
    if (!utf8.includes("\uFFFD")) return utf8;

    try {
      return new TextDecoder("gb18030").decode(buffer);
    } catch {
      return utf8;
    }
  });
}

function parseCsvLike(text: string) {
  const cleanText = text.replace(/^\uFEFF/u, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!cleanText) return [] as Record<string, string>[];

  const lines = cleanText.split("\n").filter((line) => line.trim());
  const first = parseCsvLine(lines[0]);
  const hasHeader = first.some((cell) => /关键词|keyword|word|检索|指数|竞价|价格|平台|来源/u.test(cell));
  const headers = hasHeader ? first.map((cell) => normalizeHeader(cell)) : ["keyword"];
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header || `col${index}`] = cells[index] || "";
    });
    if (!hasHeader && cells.length > 1) {
      cells.forEach((cell, index) => {
        row[`col${index}`] = cell;
      });
    }
    return row;
  });
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if ((char === "," || char === "\t") && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[（(].*?[）)]/gu, "")
    .replace(/[\s_\-:：/\\【】\[\]]/gu, "");
}

function mapImportedRow(row: Record<string, string>, stage: ManualStage, fileName: string): ManualSourceItem | null {
  const keyword = getField(row, ["关键词", "keyword", "word", "promoteword", "长尾词", "下拉词", "相关词", "query", "col0"]);
  if (!keyword) return null;
  const platform = getField(row, ["平台", "platform", "搜索引擎", "engine", "source"]);
  const pcSearchVolume = getNumberField(row, ["pc检索量", "pc日检索量", "bidwordpcpv", "pcsearchvolume", "电脑日检索量"]);
  const mobileSearchVolume = getNumberField(row, ["移动检索量", "移动日检索量", "bidwordwisepv", "mobilesearchvolume", "手机日检索量"]);
  const index = getNumberField(row, ["流量指数", "指数", "index", "pc指数"]);
  const mobileIndex = getNumberField(row, ["移动指数", "mobileindex", "wiseindex"]);
  const douyinIndex = getNumberField(row, ["抖音指数", "douyinindex"]);
  const longKeywordCount = getNumberField(row, ["长尾词数量", "长尾词数", "longkeywordcount"]);
  const bidwordCompanyCount = getNumberField(row, ["竞价公司数量", "竞价公司", "bidwordcompanycount"]);
  const competition = normalizeCompetition(getField(row, ["竞价竞争度", "竞价竞争激烈程度", "bidwordkwc", "competition"]));
  const semPrice = getField(row, ["sem点击价格", "竞价点击价格", "点击价格", "semprice", "bidwordprice"]);

  const item: ManualSourceItem = {
    keyword,
    source: stage === "suggest" ? "5118手动下拉词" : stage === "longtail" ? "5118手动长尾词" : "5118手动指标",
    platforms: platform ? [platform] : undefined,
    stage: stage === "suggest" ? "suggest" : "longtail",
    fileName,
    searchVolume: pcSearchVolume + mobileSearchVolume || index || mobileIndex || douyinIndex || undefined,
    pcSearchVolume: pcSearchVolume || undefined,
    mobileSearchVolume: mobileSearchVolume || undefined,
    index: index || undefined,
    mobileIndex: mobileIndex || undefined,
    douyinIndex: douyinIndex || undefined,
    semPrice: semPrice || undefined,
    competition,
    difficulty: competition,
    longKeywordCount: longKeywordCount || undefined,
    bidwordCompanyCount: bidwordCompanyCount || undefined,
    features: getField(row, ["说明", "特征", "reason", "features", "semreason"]),
  };

  return item;
}

function getField(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function getNumberField(row: Record<string, string>, aliases: string[]) {
  const value = getField(row, aliases).replace(/[,，\s]/gu, "");
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function mergeManualSourceItems(items: ManualSourceItem[]) {
  const byKeyword = new Map<string, ManualSourceItem>();
  for (const item of items) {
    const key = normalizeKeywordKey(item.keyword);
    if (!key) continue;
    const current = byKeyword.get(key);
    if (!current) {
      byKeyword.set(key, { ...item, score: scoreManualItem(item) });
      continue;
    }
    const merged: ManualSourceItem = {
      ...current,
      ...item,
      source: mergeLabel(current.source, item.source),
      platforms: Array.from(new Set([...(current.platforms || []), ...(item.platforms || [])])),
      searchVolume: Math.max(current.searchVolume || 0, item.searchVolume || 0) || undefined,
      pcSearchVolume: Math.max(current.pcSearchVolume || 0, item.pcSearchVolume || 0) || undefined,
      mobileSearchVolume: Math.max(current.mobileSearchVolume || 0, item.mobileSearchVolume || 0) || undefined,
      index: Math.max(current.index || 0, item.index || 0) || undefined,
      mobileIndex: Math.max(current.mobileIndex || 0, item.mobileIndex || 0) || undefined,
      douyinIndex: Math.max(current.douyinIndex || 0, item.douyinIndex || 0) || undefined,
      longKeywordCount: Math.max(current.longKeywordCount || 0, item.longKeywordCount || 0) || undefined,
      bidwordCompanyCount: Math.max(current.bidwordCompanyCount || 0, item.bidwordCompanyCount || 0) || undefined,
      competition: item.competition || current.competition,
      difficulty: item.difficulty || current.difficulty,
      features: item.features || current.features,
    };
    byKeyword.set(key, { ...merged, score: scoreManualItem(merged) });
  }
  return Array.from(byKeyword.values()).sort((a, b) => (b.score || 0) - (a.score || 0) || a.keyword.localeCompare(b.keyword, "zh-Hans-CN"));
}

function rankManualItems(items: ManualSourceItem[]) {
  return mergeManualSourceItems(items).sort((a, b) => (b.score || 0) - (a.score || 0) || sourceMetricScore(b) - sourceMetricScore(a));
}

function scoreManualItem(item: ManualSourceItem) {
  let score = 40;
  if (/(价格|报价|费用|多少钱|收费)/u.test(item.keyword)) score += 18;
  if (/(公司|哪里|哪家|推荐|怎么选)/u.test(item.keyword)) score += 13;
  if (/(注意事项|风险|错误|失败|标准|合规|盖章|公证|认证)/u.test(item.keyword)) score += 12;
  if (/(流程|办理|多久|材料|模板)/u.test(item.keyword)) score += 8;
  if (item.keyword.length >= 6 && item.keyword.length <= 24) score += 8;
  if (item.searchVolume || item.index || item.mobileIndex || item.douyinIndex) score += 12;
  if (item.competition === "高") score += 8;
  if (item.competition === "中") score += 5;
  if ((item.bidwordCompanyCount || 0) > 0) score += 6;
  if (item.stage === "longtail") score += 4;
  return Math.max(0, Math.min(100, score));
}

function sourceMetricScore(item: ManualSourceItem) {
  return (
    (item.searchVolume || 0) +
    (item.index || 0) +
    (item.mobileIndex || 0) +
    (item.douyinIndex || 0) +
    (item.longKeywordCount || 0) * 2 +
    (item.bidwordCompanyCount || 0) * 3
  );
}

function normalizeCompetition(value: string) {
  const text = String(value || "").trim();
  if (text === "1") return "高";
  if (text === "2") return "中";
  if (text === "3") return "低";
  if (["高", "中", "低"].includes(text)) return text;
  return text;
}

function normalizeKeywordKey(keyword: string) {
  return keyword.toLowerCase().replace(/\s+/gu, "");
}

function mergeLabel(left: string, right: string) {
  return Array.from(new Set([...left.split("+"), ...right.split("+")].filter(Boolean))).join("+");
}
