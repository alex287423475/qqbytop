"use client";

import { useEffect, useMemo, useState } from "react";

export type WorkflowStage = {
  key: string;
  label: string;
  accent?: string;
  activeSteps?: string[];
};

export type WorkflowAction = {
  key: string;
  label: string;
  busyLabel?: string;
};

export type WorkflowProviderOption = {
  value: string;
  label: string;
};

export type WorkflowItem = {
  id?: string;
  slug?: string;
  name?: string;
  keyword?: string;
  locale?: string;
  stage: string;
  errors?: string[];
  [key: string]: unknown;
};

export type WorkflowStatus = {
  updatedAt: string | null;
  isRunning: boolean;
  currentStep: string | null;
  lock: { pid: number | null; step: string; startedAt: string } | null;
  articles?: Record<string, WorkflowItem>;
  items?: Record<string, WorkflowItem>;
  log: Array<{ time: string; step: string; slug?: string | null; id?: string | null; message: string }>;
  counts: Record<string, number>;
};

type KeywordRow = {
  keyword: string;
  slug: string;
  locale: string;
  category: string;
  intent: string;
  priority: string;
  contentMode?: string;
};

type KeywordOptions = {
  category: string[];
  intent: string[];
};

type KeywordPreview = {
  row: KeywordRow;
  articleUrl: string | null;
  stage: string;
  sourceType?: "article" | "fact-source";
  editable?: boolean;
  filePath: string | null;
  markdown: string | null;
  visualAssets?: VisualAsset[];
};

type VisualAsset = {
  type: string;
  title: string;
  alt: string;
  src: string;
  exists: boolean;
};

type AiRole = "modelA" | "modelB" | "modelC";

type AiConfig = {
  role: AiRole;
  label: string;
  purpose: string;
  provider: string;
  baseUrl: string;
  model: string;
  apiKeySet: boolean;
  apiKeyMasked: string;
};

type AiConfigBundle = {
  modelA: AiConfig;
  modelB: AiConfig;
  modelC: AiConfig;
};

type AiConfigForm = {
  role: AiRole;
  label: string;
  purpose: string;
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  apiKeySet: boolean;
  apiKeyMasked: string;
};

type AiTestResult = {
  success: boolean;
  message: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
};

type PromptFile = {
  key: string;
  label: string;
  description: string;
  fileName: string;
  filePath: string;
  content: string;
};

type BaiduStatus = {
  site: string;
  endpoint: string;
  configured: boolean;
  sitemapUrl: string;
  sitemapPreview: string[];
};

type BaiduSubmitResult = {
  site: string;
  endpoint: string;
  submittedUrls: string[];
  result: {
    success?: number;
    remain?: number;
    not_same_site?: string[];
    not_valid?: string[];
    error?: number;
    message?: string;
    raw?: string;
  };
};

type KeywordManagerConfig = {
  enabled: true;
  apiBase: string;
};

type WorkflowDashboardProps = {
  title: string;
  eyebrow?: string;
  description: string;
  apiBase: string;
  initialStatus?: WorkflowStatus;
  stages: WorkflowStage[];
  actions: WorkflowAction[];
  stageLabels?: Record<string, string>;
  providerOptions?: WorkflowProviderOption[];
  defaultProvider?: string;
  itemName?: string;
  keywordManager?: KeywordManagerConfig;
};

const emptyKeywordForm: KeywordRow = {
  keyword: "",
  slug: "",
  locale: "zh",
  category: "",
  intent: "信息",
  priority: "P1",
  contentMode: "standard",
};

const defaultCategoryOptions = [
  "证件翻译",
  "翻译价格",
  "法律翻译",
  "跨境电商",
  "专利翻译",
  "专业翻译",
  "翻译服务",
  "本地化",
  "商务翻译",
  "技术翻译",
  "医学翻译",
  "游戏本地化",
  "合规翻译",
];

const defaultIntentOptions = ["信息", "询价", "比较", "风险", "办理", "指南", "案例", "合规", "转化"];

function mergeSelectOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function splitMultiValue(value: string) {
  return value
    .split(/[、,，;；|]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createDefaultStatus(stages: WorkflowStage[]): WorkflowStatus {
  return {
    updatedAt: null,
    isRunning: false,
    currentStep: null,
    lock: null,
    items: {},
    log: [],
    counts: Object.fromEntries(stages.map((stage) => [stage.key, 0])),
  };
}

function createEmptyAiForm(provider: string): AiConfigForm {
  return {
    role: "modelA",
    label: "模型A",
    purpose: "生成文章",
    provider,
    baseUrl: "",
    model: "",
    apiKey: "",
    apiKeySet: false,
    apiKeyMasked: "",
  };
}

function createAiForm(role: AiRole, provider: string): AiConfigForm {
  if (role === "modelB") return { ...createEmptyAiForm(provider), role, label: "模型B", purpose: "AI质检与AI重写" };
  if (role === "modelC") return { ...createEmptyAiForm(provider), role, label: "模型C", purpose: "站内AI搜索回答" };
  return createEmptyAiForm(provider);
}

function toAiForm(config: AiConfig): AiConfigForm {
  return {
    role: config.role,
    label: config.label,
    purpose: config.purpose,
    provider: config.provider,
    baseUrl: config.baseUrl || "",
    model: config.model || "",
    apiKey: "",
    apiKeySet: config.apiKeySet,
    apiKeyMasked: config.apiKeyMasked,
  };
}

export function WorkflowDashboard({
  title,
  eyebrow = "Local Workflow",
  description,
  apiBase,
  initialStatus,
  stages,
  actions,
  stageLabels = {},
  providerOptions,
  defaultProvider = providerOptions?.[0]?.value || "mock",
  itemName = "任务",
  keywordManager,
}: WorkflowDashboardProps) {
  const [status, setStatus] = useState<WorkflowStatus>(() => initialStatus || createDefaultStatus(stages));
  const [loading, setLoading] = useState(!initialStatus);
  const [provider, setProvider] = useState(defaultProvider);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keywordRows, setKeywordRows] = useState<KeywordRow[]>([]);
  const [keywordOptions, setKeywordOptions] = useState<KeywordOptions>({ category: defaultCategoryOptions, intent: defaultIntentOptions });
  const [keywordForm, setKeywordForm] = useState<KeywordRow>(emptyKeywordForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [keywordBusy, setKeywordBusy] = useState<string | null>(null);
  const [keywordOptionBusy, setKeywordOptionBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<KeywordPreview | null>(null);
  const [editorMarkdown, setEditorMarkdown] = useState("");
  const [editorBusy, setEditorBusy] = useState(false);
  const [aiForms, setAiForms] = useState<Record<AiRole, AiConfigForm>>(() => ({
    modelA: createAiForm("modelA", defaultProvider),
    modelB: createAiForm("modelB", defaultProvider),
    modelC: createAiForm("modelC", defaultProvider),
  }));
  const [aiBusy, setAiBusy] = useState<AiRole | null>(null);
  const [aiTestBusy, setAiTestBusy] = useState<AiRole | null>(null);
  const [aiTestResult, setAiTestResult] = useState<Record<AiRole, AiTestResult | null>>({ modelA: null, modelB: null, modelC: null });
  const [promptFiles, setPromptFiles] = useState<PromptFile[]>([]);
  const [activePromptKey, setActivePromptKey] = useState("generate-system");
  const [promptDraft, setPromptDraft] = useState("");
  const [promptBusy, setPromptBusy] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");
  const [baiduStatus, setBaiduStatus] = useState<BaiduStatus | null>(null);
  const [baiduSingleUrl, setBaiduSingleUrl] = useState("https://www.qqbytop.com/zh/blog/power-translation");
  const [baiduBatchUrls, setBaiduBatchUrls] = useState("https://www.qqbytop.com/zh\nhttps://www.qqbytop.com/zh/blog");
  const [baiduSitemapLimit, setBaiduSitemapLimit] = useState("10");
  const [baiduBusy, setBaiduBusy] = useState<"single" | "batch" | "sitemap" | null>(null);
  const [baiduResult, setBaiduResult] = useState<BaiduSubmitResult | null>(null);

  async function fetchStatus() {
    const response = await fetch(`${apiBase}/status`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || "无法读取流程状态。");
    }

    const nextStatus = (await response.json()) as WorkflowStatus;
    setStatus(nextStatus);
    setError(null);
  }

  async function fetchKeywords() {
    if (!keywordManager) return;
    const response = await fetch(keywordManager.apiBase, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { rows: KeywordRow[] };
    setKeywordRows(payload.rows || []);
  }

  async function fetchKeywordOptions() {
    if (!keywordManager) return;
    const response = await fetch(`${apiBase}/keyword-options`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { options: KeywordOptions };
    setKeywordOptions({
      category: payload.options?.category || defaultCategoryOptions,
      intent: payload.options?.intent || defaultIntentOptions,
    });
  }

  async function generateKeywordSlug(keyword: string) {
    if (!keywordManager) return "";
    const response = await fetch(`${keywordManager.apiBase}/slug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    });
    const payload = (await response.json().catch(() => null)) as { slug?: string } | null;
    if (!response.ok) return "";
    return payload?.slug || "";
  }

  async function fetchAiConfig() {
    const response = await fetch(`${apiBase}/ai-config`, { cache: "no-store" });
    if (!response.ok) return;
    const config = (await response.json()) as AiConfigBundle;
    setProvider(config.modelA.provider);
    setAiForms({
      modelA: toAiForm(config.modelA),
      modelB: toAiForm(config.modelB),
      modelC: toAiForm(config.modelC),
    });
  }

  async function fetchPromptFiles(preferredKey = activePromptKey) {
    const response = await fetch(`${apiBase}/prompts`, { cache: "no-store" });
    if (!response.ok) return;

    const payload = (await response.json()) as { prompts: PromptFile[] };
    const prompts = payload.prompts || [];
    const selected = prompts.find((prompt) => prompt.key === preferredKey) || prompts[0];

    setPromptFiles(prompts);
    if (selected) {
      setActivePromptKey(selected.key);
      setPromptDraft(selected.content);
    }
  }

  async function fetchBaiduStatus() {
    const response = await fetch(`${apiBase}/baidu`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as BaiduStatus;
    setBaiduStatus(payload);
  }

  useEffect(() => {
    let disposed = false;

    async function load() {
      try {
        await Promise.all([fetchStatus(), fetchKeywords(), fetchKeywordOptions(), fetchAiConfig(), fetchPromptFiles(), fetchBaiduStatus()]);
      } catch (nextError) {
        if (!disposed) setError(nextError instanceof Error ? nextError.message : "状态读取失败。");
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    load();

    const timer = window.setInterval(() => {
      fetchStatus().catch((nextError) => {
        if (!disposed) setError(nextError instanceof Error ? nextError.message : "状态读取失败。");
      });
      fetchKeywords().catch(() => undefined);
      fetchKeywordOptions().catch(() => undefined);
      fetchBaiduStatus().catch(() => undefined);
    }, 1200);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [apiBase, keywordManager?.apiBase]);

  useEffect(() => {
    if (!keywordManager || slugTouched || !keywordForm.keyword.trim()) return;

    let disposed = false;
    const timer = window.setTimeout(() => {
      generateKeywordSlug(keywordForm.keyword)
        .then((slug) => {
          if (!disposed && slug) {
            setKeywordForm((current) => (current.keyword === keywordForm.keyword && !slugTouched ? { ...current, slug } : current));
          }
        })
        .catch(() => undefined);
    }, 250);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [keywordForm.keyword, keywordManager, slugTouched]);

  const itemEntries = useMemo(() => {
    const source = status.items || status.articles || {};
    return Object.values(source).sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b), "zh-Hans-CN"));
  }, [status.items, status.articles]);

  async function saveAiConfig(role: AiRole) {
    const form = aiForms[role];
    setAiBusy(role);

    try {
      const response = await fetch(`${apiBase}/ai-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          provider: form.provider,
          baseUrl: form.baseUrl,
          model: form.model,
          apiKey: form.apiKey || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "保存 AI 配置失败。");

      const config = payload.config as AiConfigBundle;
      setProvider(config.modelA.provider);
      setAiForms({
        modelA: toAiForm(config.modelA),
        modelB: toAiForm(config.modelB),
        modelC: toAiForm(config.modelC),
      });
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存 AI 配置失败。");
    } finally {
      setAiBusy(null);
    }
  }

  async function testAiConfig(role: AiRole) {
    const form = aiForms[role];
    setAiTestBusy(role);
    setAiTestResult((current) => ({ ...current, [role]: null }));

    try {
      const response = await fetch(`${apiBase}/ai-config/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          provider: form.provider,
          baseUrl: form.baseUrl,
          model: form.model,
          apiKey: form.apiKey || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as AiTestResult | null;
      if (!response.ok) throw new Error(payload?.message || "测试连接失败。");
      setAiTestResult((current) => ({ ...current, [role]: payload || { success: true, message: "测试连接成功。" } }));
      setError(null);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "测试连接失败。";
      setAiTestResult((current) => ({ ...current, [role]: { success: false, message } }));
      setError(message);
    } finally {
      setAiTestBusy(null);
    }
  }

  function selectPrompt(key: string) {
    const prompt = promptFiles.find((item) => item.key === key);
    setActivePromptKey(key);
    setPromptDraft(prompt?.content || "");
  }

  async function savePrompt() {
    setPromptBusy(true);

    try {
      const response = await fetch(`${apiBase}/prompts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: activePromptKey, content: promptDraft }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "保存提示词失败。");

      const saved = payload.prompt as PromptFile;
      setPromptFiles((current) => current.map((item) => (item.key === saved.key ? saved : item)));
      setPromptDraft(saved.content);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存提示词失败。");
    } finally {
      setPromptBusy(false);
    }
  }

  async function runStep(step: string, id?: string) {
    setSubmitting(`${step}:${id || "all"}`);

    try {
      const response = await fetch(`${apiBase}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, slug: id, id }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "流程执行失败。");
      }

      await fetchStatus();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "流程执行失败。");
    } finally {
      setSubmitting(null);
    }
  }

  async function submitBaidu(mode: "single" | "batch" | "sitemap") {
    setBaiduBusy(mode);
    setBaiduResult(null);

    const limit = Number.parseInt(baiduSitemapLimit, 10);
    const body =
      mode === "single"
        ? { mode, url: baiduSingleUrl }
        : mode === "batch"
          ? {
              mode,
              urls: baiduBatchUrls
                .split(/\r?\n/u)
                .map((line) => line.trim())
                .filter(Boolean),
            }
          : { mode, limit: Number.isFinite(limit) && limit > 0 ? limit : undefined };

    try {
      const response = await fetch(`${apiBase}/baidu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || payload?.result?.message || "百度推送失败。");
      setBaiduResult(payload as BaiduSubmitResult);
      setError(null);
      await fetchBaiduStatus();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "百度推送失败。");
    } finally {
      setBaiduBusy(null);
    }
  }

  async function addKeyword() {
    if (!keywordManager) return;
    setKeywordBusy("add");

    try {
      const response = await fetch(keywordManager.apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keywordForm),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "添加关键词失败。");

      setKeywordRows(payload.rows || []);
      setKeywordForm(emptyKeywordForm);
      setSlugTouched(false);
      await fetchStatus();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "添加关键词失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function addKeywordOption(type: "category" | "intent", value: string) {
    if (!keywordManager) return;
    const clean = value.trim();
    if (!clean) return;
    setKeywordOptionBusy(`add:${type}`);

    try {
      const response = await fetch(`${apiBase}/keyword-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value: clean }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "添加选项失败。");
      setKeywordOptions(payload.options || keywordOptions);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "添加选项失败。");
    } finally {
      setKeywordOptionBusy(null);
    }
  }

  async function deleteKeywordOption(type: "category" | "intent", value: string) {
    if (!keywordManager) return;
    if (!window.confirm(`确认删除选项：${value}？已在关键词文件中使用的值仍会继续显示。`)) return;
    setKeywordOptionBusy(`delete:${type}:${value}`);

    try {
      const response = await fetch(`${apiBase}/keyword-options`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "删除选项失败。");
      setKeywordOptions(payload.options || keywordOptions);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "删除选项失败。");
    } finally {
      setKeywordOptionBusy(null);
    }
  }

  async function deleteKeyword(slug: string) {
    if (!keywordManager) return;
    if (!window.confirm(`确认删除关键词：${slug}？`)) return;
    setKeywordBusy(`delete:${slug}`);

    try {
      const response = await fetch(keywordManager.apiBase, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "删除关键词失败。");

      setKeywordRows(payload.rows || []);
      await fetchStatus();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "删除关键词失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function previewKeyword(slug: string) {
    if (!keywordManager) return;
    setKeywordBusy(`preview:${slug}`);

    try {
      const response = await fetch(`${keywordManager.apiBase}/preview?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "预览失败。");
      setPreview(payload as KeywordPreview);
      setEditorMarkdown(payload?.markdown || "");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "预览失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function openFactSourcePack(row: KeywordRow | WorkflowItem) {
    const itemId = "slug" in row && row.slug ? String(row.slug) : getItemId(row as WorkflowItem);
    setKeywordBusy(`fact-source:${itemId}`);

    try {
      const response = await fetch(`${apiBase}/fact-sources/${encodeURIComponent(itemId)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "读取事实源资料包失败。");

      setPreview({
        row: {
          keyword: "keyword" in row && row.keyword ? String(row.keyword) : getItemTitle(row as WorkflowItem),
          slug: itemId,
          locale: String(("locale" in row && row.locale) || payload.locale || "zh"),
          category: String(("category" in row && row.category) || ""),
          intent: String(("intent" in row && row.intent) || ""),
          priority: String(("priority" in row && row.priority) || ""),
          contentMode: "fact-source",
        },
        articleUrl: null,
        stage: payload.stage,
        sourceType: "fact-source",
        editable: true,
        filePath: payload.filePath || null,
        markdown: payload.markdown || null,
      });
      setEditorMarkdown(payload.markdown || "");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "读取事实源资料包失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function openArticleEditor(item: WorkflowItem) {
    const itemId = getItemId(item);
    setKeywordBusy(`edit:${itemId}`);

    try {
      const response = await fetch(`${apiBase}/articles/${encodeURIComponent(itemId)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "读取文章失败。");

      setPreview({
        row: {
          keyword: getItemTitle(item),
          slug: itemId,
          locale: String(payload.locale || item.locale || "zh"),
          category: String(item.category || ""),
          intent: String(item.intent || ""),
          priority: String(item.priority || ""),
          contentMode: String(item.contentMode || "standard"),
        },
        articleUrl: payload.articleUrl || null,
        stage: payload.stage,
        sourceType: "article",
        editable: payload.editable,
        filePath: payload.filePath || null,
        markdown: payload.markdown || null,
        visualAssets: payload.visualAssets || [],
      });
      setEditorMarkdown(payload.markdown || "");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "读取文章失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function createRevisionDraft(item: WorkflowItem) {
    const itemId = getItemId(item);
    setKeywordBusy(`revision:${itemId}`);

    try {
      const response = await fetch(`${apiBase}/articles/${encodeURIComponent(itemId)}`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "生成修订草稿失败。");

      setPreview({
        row: {
          keyword: item.keyword || item.name || item.slug || itemId,
          slug: itemId,
          locale: String(item.locale || payload.locale || "zh"),
          category: String(item.category || ""),
          intent: String(item.intent || ""),
          priority: String(item.priority || ""),
          contentMode: String(item.contentMode || "standard"),
        },
        articleUrl: null,
        stage: payload.stage,
        sourceType: "article",
        editable: true,
        filePath: payload.filePath || null,
        markdown: payload.markdown || null,
        visualAssets: payload.visualAssets || [],
      });
      setEditorMarkdown(payload.markdown || "");
      await fetchStatus();
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "生成修订草稿失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function openReviewReport(item: WorkflowItem) {
    const itemId = getItemId(item);
    setKeywordBusy(`review:${itemId}`);

    try {
      const response = await fetch(`${apiBase}/articles/${encodeURIComponent(itemId)}?view=review`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "读取质检报告失败。");

      setPreview({
        row: {
          keyword: `${getItemTitle(item)} - AI质检报告`,
          slug: itemId,
          locale: String(payload.locale || item.locale || "zh"),
          category: String(item.category || ""),
          intent: String(item.intent || ""),
          priority: String(item.priority || ""),
          contentMode: String(item.contentMode || "standard"),
        },
        articleUrl: null,
        stage: payload.stage,
        sourceType: "article",
        editable: false,
        filePath: payload.filePath || null,
        markdown: payload.markdown || null,
        visualAssets: [],
      });
      setEditorMarkdown(payload.markdown || "");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "读取质检报告失败。");
    } finally {
      setKeywordBusy(null);
    }
  }

  async function saveArticleEdit() {
    if (!preview) return;
    setEditorBusy(true);

    try {
      const endpoint =
        preview.sourceType === "fact-source"
          ? `${apiBase}/fact-sources/${encodeURIComponent(preview.row.slug)}`
          : `${apiBase}/articles/${encodeURIComponent(preview.row.slug)}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: editorMarkdown }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "保存文章失败。");

      setPreview({
        ...preview,
        stage: payload.stage || (preview.sourceType === "fact-source" ? "fact-source-pack" : "draft"),
        filePath: payload.filePath || preview.filePath,
        markdown: payload.markdown || editorMarkdown,
        visualAssets: payload.visualAssets || preview.visualAssets || [],
        editable: true,
      });
      setEditorMarkdown(payload.markdown || editorMarkdown);
      if (preview.sourceType !== "fact-source") await fetchStatus();
      setError(payload.message || null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "保存文章失败。");
    } finally {
      setEditorBusy(false);
    }
  }

  const isBusy = status.isRunning || Boolean(submitting);
  const panelTabs = [
    { key: "overview", label: "运行概览", description: "查看当前各阶段数量" },
    { key: "models", label: "AI模型配置", description: "配置模型A、模型B和模型C" },
    { key: "prompts", label: "Prompt提示词", description: "编辑生成、质检、重写提示词" },
    { key: "keywords", label: "关键词文件", description: "新增、删除和预览关键词" },
    { key: "baidu", label: "百度 Sitemap", description: "单条提交、批量提交和 sitemap 主动推送" },
    { key: "workflow", label: "流程操作", description: "执行生成、质检、重写、校验、审核、发布" },
    { key: "logs", label: "最近日志", description: "查看脚本运行事件" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-500">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
          </div>
          <div className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300">
            {status.isRunning ? `运行中：${status.currentStep}` : "当前空闲"}
          </div>
        </div>

        {error && <div className="mt-6 rounded border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">{error}</div>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="pipeline-panel h-fit p-3 lg:sticky lg:top-6">
            <nav className="space-y-2">
              {panelTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActivePanel(tab.key)}
                  className={`w-full rounded px-4 py-3 text-left transition ${
                    activePanel === tab.key ? "bg-brand-600 text-white shadow-lg shadow-brand-950/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={`mt-1 block text-xs ${activePanel === tab.key ? "text-brand-100" : "text-slate-500"}`}>{tab.description}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="min-w-0">
            {activePanel === "overview" && (
              <section className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-5">
                  {stages.map((stage) => (
                    <StageCard
                      key={stage.key}
                      label={stage.label}
                      value={status.counts?.[stage.key] || 0}
                      accent={stage.accent || "text-brand-400"}
                      active={Boolean(status.currentStep && (stage.activeSteps || [stage.key]).includes(status.currentStep))}
                    />
                  ))}
                </div>
                <section className="pipeline-panel p-5">
                  <h2 className="text-lg font-bold text-white">工作台概览</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <SummaryCard label="流程文章" value={itemEntries.length} />
                    <SummaryCard label="关键词数量" value={keywordRows.length} />
                    <SummaryCard label="日志事件" value={status.log.length} />
                  </div>
                </section>
              </section>
            )}

            {activePanel === "models" &&
              (providerOptions ? (
                <AiConfigPanel
                  forms={aiForms}
                  providerOptions={providerOptions}
                  busy={aiBusy}
                  testBusy={aiTestBusy}
                  testResult={aiTestResult}
                  onChange={(role, nextForm) => {
                    setAiForms((current) => ({ ...current, [role]: nextForm }));
                    if (role === "modelA") setProvider(nextForm.provider);
                    setAiTestResult((current) => ({ ...current, [role]: null }));
                  }}
                  onSave={saveAiConfig}
                  onTest={testAiConfig}
                />
              ) : (
                <EmptyState text="当前工作流没有配置 AI 模型面板。" />
              ))}

            {activePanel === "prompts" && (
              <PromptManager
                prompts={promptFiles}
                activeKey={activePromptKey}
                draft={promptDraft}
                busy={promptBusy}
                onSelect={selectPrompt}
                onDraftChange={setPromptDraft}
                onSave={savePrompt}
              />
            )}

            {activePanel === "keywords" &&
              (keywordManager ? (
                <KeywordManager
                  rows={keywordRows}
                  options={keywordOptions}
                  form={keywordForm}
                  busy={keywordBusy}
                  optionBusy={keywordOptionBusy}
                  slugTouched={slugTouched}
                  onFormChange={setKeywordForm}
                  onSlugTouched={setSlugTouched}
                  onAdd={addKeyword}
                  onAddOption={addKeywordOption}
                  onDeleteOption={deleteKeywordOption}
                  onDelete={deleteKeyword}
                  onPreview={previewKeyword}
                  onFactSource={openFactSourcePack}
                />
              ) : (
                <EmptyState text="当前工作流没有关键词文件面板。" />
              ))}

            {activePanel === "baidu" && (
              <BaiduSubmitPanel
                status={baiduStatus}
                singleUrl={baiduSingleUrl}
                batchUrls={baiduBatchUrls}
                sitemapLimit={baiduSitemapLimit}
                busy={baiduBusy}
                result={baiduResult}
                onSingleUrlChange={setBaiduSingleUrl}
                onBatchUrlsChange={setBaiduBatchUrls}
                onSitemapLimitChange={setBaiduSitemapLimit}
                onSubmit={submitBaidu}
                onRefresh={fetchBaiduStatus}
              />
            )}

            {activePanel === "workflow" && (
              <section className="pipeline-panel p-5">
                <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
                  <h2 className="text-lg font-bold text-white">流程操作</h2>
                  <p className="text-sm text-slate-400">
                    主流程是生成文章、AI质检、AI重写、校验、审核、发布。生成文章会自动生成封面和正文配图；“刷新配图”只用于旧文章补图或手动编辑后重建图片。当前提供商：{provider}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {actions.map((action) => (
                    <ActionButton
                      key={action.key}
                      label={action.label}
                      busyLabel={action.busyLabel}
                      onClick={() => runStep(action.key)}
                      disabled={isBusy}
                      busy={submitting === `${action.key}:all`}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {loading ? (
                    <EmptyState text="正在读取状态..." />
                  ) : itemEntries.length === 0 ? (
                    <EmptyState text={`还没有${itemName}进入流程。`} />
                  ) : (
                    itemEntries.map((item) => {
                      const itemId = getItemId(item);

                      return (
                        <article key={itemId} className="rounded border border-slate-700 bg-slate-900/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-white">{getItemTitle(item)}</h3>
                              <p className="mt-1 text-xs text-slate-400">{itemId}</p>
                            </div>
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{stageLabels[item.stage] || item.stage}</span>
                          </div>

                          {item.errors && item.errors.length > 0 && (
                            <ul className="mt-3 space-y-1 text-xs text-rose-300">
                              {item.errors.map((itemError) => (
                                <li key={itemError}>- {itemError}</li>
                              ))}
                            </ul>
                          )}

                          {typeof item.reviewScore === "number" && (
                            <div className="mt-3 rounded border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100">
                              AI质检：{item.reviewScore} 分
                              {typeof item.reviewRecommendation === "string" ? ` / ${item.reviewRecommendation}` : ""}
                              {typeof item.reviewSummary === "string" ? ` / ${item.reviewSummary}` : ""}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <MiniButton label="查看/编辑" onClick={() => openArticleEditor(item)} disabled={isBusy || keywordBusy === `edit:${itemId}`} />
                            {item.stage === "published" && (
                              <MiniButton
                                label="生成修订稿"
                                onClick={() => createRevisionDraft(item)}
                                disabled={isBusy || keywordBusy === `revision:${itemId}`}
                              />
                            )}
                            {item.contentMode === "fact-source" && (
                              <MiniButton label="事实源资料包" onClick={() => openFactSourcePack(item)} disabled={isBusy || keywordBusy === `fact-source:${itemId}`} />
                            )}
                            {(typeof item.reviewScore === "number" || typeof item.reviewReportPath === "string") && (
                              <MiniButton label="质检报告" onClick={() => openReviewReport(item)} disabled={isBusy || keywordBusy === `review:${itemId}`} />
                            )}
                            {actions.map((action) => (
                              <MiniButton key={action.key} label={action.label} onClick={() => runStep(action.key, itemId)} disabled={isBusy} />
                            ))}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {activePanel === "logs" && (
              <section className="pipeline-panel p-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white">最近日志</h2>
                    <p className="mt-2 text-sm text-slate-400">展示流程脚本写入的最新状态事件。</p>
                  </div>
                  <div className="text-xs text-slate-500">{status.updatedAt ? new Date(status.updatedAt).toLocaleString("zh-CN") : "暂无更新时间"}</div>
                </div>

                <div className="mt-5 space-y-3">
                  {status.log.length === 0 ? (
                    <EmptyState text="还没有运行日志。" />
                  ) : (
                    status.log
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                        <div key={`${entry.time}-${index}`} className="rounded border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-200">{entry.message}</span>
                            <span className="text-xs text-slate-500">{new Date(entry.time).toLocaleTimeString("zh-CN")}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {entry.step}
                            {entry.slug || entry.id ? ` / ${entry.slug || entry.id}` : ""}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {preview && (
        <PreviewDialog
          preview={preview}
          markdown={editorMarkdown}
          saving={editorBusy}
          onMarkdownChange={setEditorMarkdown}
          onSave={saveArticleEdit}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function BaiduSubmitPanel({
  status,
  singleUrl,
  batchUrls,
  sitemapLimit,
  busy,
  result,
  onSingleUrlChange,
  onBatchUrlsChange,
  onSitemapLimitChange,
  onSubmit,
  onRefresh,
}: {
  status: BaiduStatus | null;
  singleUrl: string;
  batchUrls: string;
  sitemapLimit: string;
  busy: "single" | "batch" | "sitemap" | null;
  result: BaiduSubmitResult | null;
  onSingleUrlChange: (value: string) => void;
  onBatchUrlsChange: (value: string) => void;
  onSitemapLimitChange: (value: string) => void;
  onSubmit: (mode: "single" | "batch" | "sitemap") => void;
  onRefresh: () => void;
}) {
  const batchCount = batchUrls.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).length;
  const sitemapLimitNumber = Number.parseInt(sitemapLimit, 10);

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-4 border-b border-slate-700 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">百度 Sitemap 主动推送</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            用于把新文章、服务页或整站 sitemap URL 主动提交给百度搜索资源平台。接口 token 只从本地
            <span className="mx-1 rounded bg-slate-950 px-1.5 py-0.5 font-mono text-xs text-slate-200">local-brain/.env</span>
            读取，不会出现在前端代码或 Git 仓库里。
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="w-fit rounded border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-500"
        >
          刷新状态
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-500">站点</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-100">{status?.site || "未读取"}</p>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-500">接口</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-100">{status?.endpoint || "未配置"}</p>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-500">配置状态</p>
          <p className={`mt-2 text-sm font-semibold ${status?.configured ? "text-emerald-300" : "text-rose-300"}`}>
            {status?.configured ? "已配置，可提交" : "未配置 BAIDU_PUSH_ENDPOINT 或 BAIDU_PUSH_TOKEN"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold text-white">单条提交</h3>
          <p className="mt-1 text-xs text-slate-500">适合发布新文章后立刻推送一条 URL。</p>
          <input
            value={singleUrl}
            onChange={(event) => onSingleUrlChange(event.target.value)}
            className="mt-4 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-brand-500"
            placeholder="https://www.qqbytop.com/zh/blog/xxx"
          />
          <button
            type="button"
            onClick={() => onSubmit("single")}
            disabled={Boolean(busy) || !status?.configured || !singleUrl.trim()}
            className="mt-4 rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {busy === "single" ? "提交中..." : "提交单条 URL"}
          </button>
        </div>

        <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold text-white">从 sitemap 批量提交</h3>
          <p className="mt-1 text-xs text-slate-500">自动读取线上 sitemap，并按百度当前额度限制提交前 N 条。</p>
          <div className="mt-4 flex gap-3">
            <input
              value={sitemapLimit}
              onChange={(event) => onSitemapLimitChange(event.target.value)}
              className="w-32 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
              placeholder="10"
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => onSubmit("sitemap")}
              disabled={Boolean(busy) || !status?.configured || !Number.isFinite(sitemapLimitNumber) || sitemapLimitNumber <= 0}
              className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {busy === "sitemap" ? "提交中..." : "提交 sitemap URL"}
            </button>
          </div>
          <p className="mt-3 break-all text-xs text-slate-500">{status?.sitemapUrl || "https://www.qqbytop.com/sitemap.xml"}</p>
        </div>
      </div>

      <div className="mt-5 rounded border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">批量提交</h3>
            <p className="mt-1 text-xs text-slate-500">一行一个 URL，脚本会自动去重，并把 qqbytop.com 统一到 www.qqbytop.com。</p>
          </div>
          <span className="text-xs text-slate-500">当前 {batchCount} 条</span>
        </div>
        <textarea
          value={batchUrls}
          onChange={(event) => onBatchUrlsChange(event.target.value)}
          className="mt-4 min-h-44 w-full resize-y rounded border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-brand-500"
          placeholder={"https://www.qqbytop.com/zh\nhttps://www.qqbytop.com/zh/blog/power-translation"}
        />
        <button
          type="button"
          onClick={() => onSubmit("batch")}
          disabled={Boolean(busy) || !status?.configured || batchCount === 0}
          className="mt-4 rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {busy === "batch" ? "提交中..." : "批量提交 URL"}
        </button>
      </div>

      {status?.sitemapPreview && status.sitemapPreview.length > 0 && (
        <div className="mt-5 rounded border border-slate-800 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">sitemap 预览</h3>
          <div className="mt-3 grid gap-2">
            {status.sitemapPreview.map((url) => (
              <code key={url} className="break-all rounded bg-slate-900 px-3 py-2 text-xs text-slate-300">
                {url}
              </code>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-5 rounded border border-emerald-500/30 bg-emerald-950/20 p-4">
          <h3 className="font-semibold text-emerald-100">提交结果</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <SummaryCard label="成功提交" value={result.result.success || 0} />
            <SummaryCard label="剩余额度" value={result.result.remain || 0} />
            <SummaryCard label="本次 URL" value={result.submittedUrls.length} />
          </div>
          {(result.result.not_same_site?.length || result.result.not_valid?.length || result.result.message) && (
            <pre className="mt-4 max-h-52 overflow-auto rounded bg-slate-950 p-3 text-xs leading-6 text-amber-100">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          )}
          <div className="mt-4 grid gap-2">
            {result.submittedUrls.map((url) => (
              <code key={url} className="break-all rounded bg-slate-950 px-3 py-2 text-xs text-slate-300">
                {url}
              </code>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AiConfigPanel({
  forms,
  providerOptions,
  busy,
  testBusy,
  testResult,
  onChange,
  onSave,
  onTest,
}: {
  forms: Record<AiRole, AiConfigForm>;
  providerOptions: WorkflowProviderOption[];
  busy: AiRole | null;
  testBusy: AiRole | null;
  testResult: Record<AiRole, AiTestResult | null>;
  onChange: (role: AiRole, form: AiConfigForm) => void;
  onSave: (role: AiRole) => void;
  onTest: (role: AiRole) => void;
}) {
  const roleCards: Array<{ role: AiRole; badge: string; note: string; wrap?: boolean }> = [
    { role: "modelA", badge: "生成", note: "用于生成文章草稿。" },
    { role: "modelB", badge: "质检/重写", note: "用于AI质检和AI重写，建议选择更擅长审校、结构化输出和改写的模型。", wrap: true },
    { role: "modelC", badge: "站内搜索", note: "用于首页和搜索页的AI推荐答案，建议选择响应快、中文问答稳定、成本可控的模型。", wrap: true },
  ];

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
        <h2 className="text-lg font-bold text-white">AI 模型配置</h2>
        <p className="text-sm text-slate-400">
          模型A用于生成文章；模型B用于AI质检和AI重写；模型C用于站内AI搜索回答。配置只保存在本地 local-brain/.env，API Key 不会提交到 Git。
        </p>
      </div>

      <div className="mt-5 space-y-6">
        {roleCards.map((card) => (
          <AiRoleConfigCard
            key={card.role}
            role={card.role}
            form={forms[card.role]}
            badge={card.badge}
            note={card.note}
            providerOptions={providerOptions}
            busy={busy}
            testBusy={testBusy}
            testResult={testResult[card.role]}
            wrap={card.wrap}
            onChange={onChange}
            onSave={onSave}
            onTest={onTest}
          />
        ))}
      </div>
    </section>
  );
}

function AiRoleConfigCard({
  role,
  form,
  badge,
  note,
  providerOptions,
  busy,
  testBusy,
  testResult,
  wrap = false,
  onChange,
  onSave,
  onTest,
}: {
  role: AiRole;
  form: AiConfigForm;
  badge: string;
  note: string;
  providerOptions: WorkflowProviderOption[];
  busy: AiRole | null;
  testBusy: AiRole | null;
  testResult: AiTestResult | null;
  wrap?: boolean;
  onChange: (role: AiRole, form: AiConfigForm) => void;
  onSave: (role: AiRole) => void;
  onTest: (role: AiRole) => void;
}) {
  const content = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{form.label}</h3>
          <p className="mt-1 text-xs text-slate-400">{note}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{badge}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr_1fr_1fr_auto_auto]">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          提供商
          <select
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
            value={form.provider}
            onChange={(event) => onChange(role, { ...form, provider: event.target.value })}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <TextInput label="Base URL" value={form.baseUrl} onChange={(baseUrl) => onChange(role, { ...form, baseUrl })} placeholder="留空使用官方默认地址" />
        <TextInput label="Model" value={form.model} onChange={(model) => onChange(role, { ...form, model })} placeholder="gpt-4o-mini" />
        <TextInput
          label="API Key"
          type="password"
          value={form.apiKey}
          onChange={(apiKey) => onChange(role, { ...form, apiKey })}
          placeholder={form.apiKeySet ? `已保存：${form.apiKeyMasked}` : "请输入 API Key"}
        />
        <button
          onClick={() => onSave(role)}
          disabled={busy === role}
          className="self-end rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:bg-slate-700"
        >
          {busy === role ? "保存中" : `保存${form.label}`}
        </button>
        <button
          onClick={() => onTest(role)}
          disabled={testBusy === role}
          className="self-end rounded border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-brand-500 disabled:text-slate-500"
        >
          {testBusy === role ? "测试中" : `测试${form.label}`}
        </button>
      </div>
      {testResult && (
        <div
          className={`mt-4 rounded border px-4 py-3 text-sm ${
            testResult.success ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-100" : "border-rose-500/50 bg-rose-950/40 text-rose-100"
          }`}
        >
          {testResult.success ? "连接成功：" : "连接失败："}
          {testResult.message}
          {typeof testResult.latencyMs === "number" ? `（${testResult.latencyMs}ms）` : ""}
        </div>
      )}
    </>
  );

  if (!wrap) return <div>{content}</div>;

  return <div className="rounded border border-slate-700 bg-slate-900/50 p-4">{content}</div>;
}

function PromptManager({
  prompts,
  activeKey,
  draft,
  busy,
  onSelect,
  onDraftChange,
  onSave,
}: {
  prompts: PromptFile[];
  activeKey: string;
  draft: string;
  busy: boolean;
  onSelect: (key: string) => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  const activePrompt = prompts.find((prompt) => prompt.key === activeKey) || prompts[0];
  const isDirty = Boolean(activePrompt && draft !== activePrompt.content);

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
        <h2 className="text-lg font-bold text-white">Prompt 提示词</h2>
        <p className="text-sm text-slate-400">查看、修改并保存生成文章、AI质检和AI重写的提示词。保存后下一次运行对应 Agent 会立即使用新版提示词。</p>
      </div>

      {prompts.length === 0 ? (
        <EmptyState text="正在读取提示词文件..." />
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.38fr_1fr]">
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt.key}
                onClick={() => onSelect(prompt.key)}
                className={`w-full rounded border px-4 py-3 text-left transition ${
                  prompt.key === activeKey ? "border-brand-500 bg-brand-500/10 text-white" : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-brand-500"
                }`}
              >
                <span className="block text-sm font-semibold">{prompt.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{prompt.fileName}</span>
              </button>
            ))}
          </div>

          <div className="rounded border border-slate-700 bg-slate-950/40">
            <div className="flex flex-col gap-3 border-b border-slate-700 p-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h3 className="font-semibold text-white">{activePrompt?.label || "提示词"}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">{activePrompt?.description || ""}</p>
                {activePrompt?.filePath && <p className="mt-2 break-all text-xs text-slate-500">{activePrompt.filePath}</p>}
              </div>
              <button
                onClick={onSave}
                disabled={busy || !activePrompt || !draft.trim()}
                className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {busy ? "保存中..." : isDirty ? "保存提示词" : "已保存"}
              </button>
            </div>
            <textarea
              className="min-h-[420px] w-full resize-y bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function KeywordManager({
  rows,
  options,
  form,
  busy,
  optionBusy,
  slugTouched,
  onFormChange,
  onSlugTouched,
  onAdd,
  onAddOption,
  onDeleteOption,
  onDelete,
  onPreview,
  onFactSource,
}: {
  rows: KeywordRow[];
  options: KeywordOptions;
  form: KeywordRow;
  busy: string | null;
  optionBusy: string | null;
  slugTouched: boolean;
  onFormChange: (form: KeywordRow) => void;
  onSlugTouched: (touched: boolean) => void;
  onAdd: () => void;
  onAddOption: (type: "category" | "intent", value: string) => void;
  onDeleteOption: (type: "category" | "intent", value: string) => void;
  onDelete: (slug: string) => void;
  onPreview: (slug: string) => void;
  onFactSource: (row: KeywordRow) => void;
}) {
  const categoryOptions = mergeSelectOptions([...options.category, ...rows.flatMap((row) => splitMultiValue(row.category)), ...splitMultiValue(form.category)]);
  const intentOptions = mergeSelectOptions([...options.intent, ...rows.flatMap((row) => splitMultiValue(row.intent)), ...splitMultiValue(form.intent)]);

  return (
    <section className="pipeline-panel p-5">
      <div className="flex flex-col gap-2 border-b border-slate-700 pb-5">
        <h2 className="text-lg font-bold text-white">关键词文件</h2>
        <p className="text-sm text-slate-400">直接管理 local-brain/inputs/keywords.csv，新增后即可进入生成流程。</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_1fr_0.65fr_0.85fr_0.85fr_0.6fr_0.9fr_auto_auto]">
        <TextInput label="关键词" value={form.keyword} onChange={(keyword) => onFormChange({ ...form, keyword })} />
        <TextInput
          label={slugTouched ? "slug（手动）" : "slug（自动）"}
          value={form.slug}
          onChange={(slug) => {
            onSlugTouched(true);
            onFormChange({ ...form, slug });
          }}
          placeholder="自动生成"
        />
        <SelectInput label="语言" value={form.locale} options={["zh", "en", "ja"]} onChange={(locale) => onFormChange({ ...form, locale })} />
        <MultiSelectInput
          label="分类"
          value={form.category}
          options={categoryOptions}
          type="category"
          optionBusy={optionBusy}
          onChange={(category) => onFormChange({ ...form, category })}
          onAddOption={onAddOption}
          onDeleteOption={onDeleteOption}
        />
        <MultiSelectInput
          label="意图"
          value={form.intent}
          options={intentOptions}
          type="intent"
          optionBusy={optionBusy}
          onChange={(intent) => onFormChange({ ...form, intent })}
          onAddOption={onAddOption}
          onDeleteOption={onDeleteOption}
        />
        <SelectInput label="优先级" value={form.priority} options={["P0", "P1", "P2", "P3"]} onChange={(priority) => onFormChange({ ...form, priority })} />
        <SelectInput
          label="内容模式"
          value={form.contentMode || "standard"}
          options={["standard", "fact-source"]}
          onChange={(contentMode) => onFormChange({ ...form, contentMode })}
        />
        <button
          type="button"
          onClick={() => {
            onSlugTouched(false);
            onFormChange({ ...form, slug: "" });
          }}
          className="self-end rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-brand-500"
        >
          重新自动
        </button>
        <button
          onClick={onAdd}
          disabled={busy === "add"}
          className="self-end rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:bg-slate-700"
        >
          {busy === "add" ? "添加中" : "添加"}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">关键词</th>
              <th className="px-3 py-3">slug</th>
              <th className="px-3 py-3">语言</th>
              <th className="px-3 py-3">分类</th>
              <th className="px-3 py-3">意图</th>
              <th className="px-3 py-3">优先级</th>
              <th className="px-3 py-3">内容模式</th>
              <th className="px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => (
              <tr key={row.slug} className="text-slate-200">
                <td className="max-w-xs px-3 py-3 font-medium">{row.keyword}</td>
                <td className="px-3 py-3 text-slate-400">{row.slug}</td>
                <td className="px-3 py-3 text-slate-400">{row.locale}</td>
                <td className="px-3 py-3 text-slate-400">{row.category}</td>
                <td className="px-3 py-3 text-slate-400">{row.intent}</td>
                <td className="px-3 py-3 text-slate-400">{row.priority}</td>
                <td className="px-3 py-3 text-slate-400">{row.contentMode === "fact-source" ? "核心事实源" : "普通文章"}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <MiniButton label="预览" onClick={() => onPreview(row.slug)} disabled={busy === `preview:${row.slug}`} />
                    {row.contentMode === "fact-source" && (
                      <MiniButton label="资料包" onClick={() => onFactSource(row)} disabled={busy === `fact-source:${row.slug}`} />
                    )}
                    <MiniButton label="删除" onClick={() => onDelete(row.slug)} disabled={busy === `delete:${row.slug}`} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  关键词文件为空。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreviewDialog({
  preview,
  markdown,
  saving,
  onMarkdownChange,
  onSave,
  onClose,
}: {
  preview: KeywordPreview;
  markdown: string;
  saving: boolean;
  onMarkdownChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [width, setWidth] = useState(82);
  const [height, setHeight] = useState(72);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const bodyHeight = isFullscreen ? "calc(100vh - 82px)" : `${height}vh`;
  const isPublishedRevision = preview.stage === "published";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 ${isFullscreen ? "px-0" : "px-4"}`}>
      <div
        className={`w-full overflow-hidden bg-slate-900 shadow-2xl ${
          isFullscreen ? "h-screen max-h-screen border-0" : "max-h-[96vh] rounded border border-slate-700"
        }`}
        style={{ maxWidth: isFullscreen ? "100vw" : `${width}vw` }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-700 px-5 py-4">
          <div>
            <p className="text-xs uppercase text-slate-500">{preview.stage}</p>
            <h2 className="mt-1 text-xl font-bold text-white">{preview.row.keyword}</h2>
            <p className="mt-1 text-sm text-slate-400">{preview.row.slug}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                setWidth(64);
                setHeight(64);
              }}
              className={`rounded border px-3 py-1.5 text-sm ${width === 64 ? "border-brand-500 text-white" : "border-slate-700 text-slate-300 hover:border-brand-500"}`}
            >
              标准
            </button>
            <button
              onClick={() => {
                setWidth(82);
                setHeight(72);
              }}
              className={`rounded border px-3 py-1.5 text-sm ${width === 82 ? "border-brand-500 text-white" : "border-slate-700 text-slate-300 hover:border-brand-500"}`}
            >
              宽屏
            </button>
            <button
              onClick={() => {
                setWidth(98);
                setHeight(88);
              }}
              className={`rounded border px-3 py-1.5 text-sm ${width === 98 ? "border-brand-500 text-white" : "border-slate-700 text-slate-300 hover:border-brand-500"}`}
            >
              最大
            </button>
            <button
              onClick={() => setIsFullscreen((current) => !current)}
              className={`rounded border px-3 py-1.5 text-sm ${isFullscreen ? "border-brand-500 text-white" : "border-slate-700 text-slate-300 hover:border-brand-500"}`}
            >
              {isFullscreen ? "退出全屏" : "全屏"}
            </button>
            <button onClick={onClose} className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-brand-500">
              关闭
            </button>
          </div>
        </div>
        <div className="grid gap-0 overflow-y-auto lg:grid-cols-[0.85fr_1.15fr]" style={{ maxHeight: bodyHeight }}>
          <div className="border-b border-slate-800 p-5 lg:border-b-0 lg:border-r">
            <dl className="space-y-3 text-sm">
              <MetaRow label="语言" value={preview.row.locale} />
              <MetaRow label="分类" value={preview.row.category} />
              <MetaRow label="意图" value={preview.row.intent} />
              <MetaRow label="优先级" value={preview.row.priority} />
              <MetaRow label="内容模式" value={preview.row.contentMode === "fact-source" ? "核心事实源" : "普通文章"} />
              <MetaRow label="文件" value={preview.filePath || "暂无生成文件"} />
            </dl>
            {preview.visualAssets && preview.visualAssets.length > 0 && (
              <div className="mt-5 border-t border-slate-800 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">文章配图</p>
                <div className="mt-3 grid gap-3">
                  {preview.visualAssets.map((asset) => (
                    <a
                      key={asset.src}
                      href={asset.src}
                      target="_blank"
                      className="group rounded border border-slate-800 bg-slate-950/70 p-2 transition hover:border-brand-500"
                    >
                      <div className="overflow-hidden rounded bg-white">
                        <img src={asset.src} alt={asset.alt || asset.title || asset.type} className="aspect-[16/9] w-full object-contain" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="truncate">{asset.title || asset.alt || asset.type}</span>
                        <span className={asset.exists ? "text-emerald-300" : "text-rose-300"}>{asset.exists ? "已生成" : "缺失"}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {preview.articleUrl && (
              <a className="mt-5 inline-flex rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500" href={preview.articleUrl} target="_blank">
                打开已发布文章
              </a>
            )}
            {preview.editable && (
              <button
                onClick={onSave}
                disabled={saving}
                className="mt-3 inline-flex rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-700"
              >
                {saving ? "保存中" : isPublishedRevision ? "保存为修订草稿" : "保存修改"}
              </button>
            )}
            {preview.editable && (
              <label className="mt-5 flex flex-col gap-2 text-xs text-slate-400">
                窗口宽度：{width}vw
                <input
                  type="range"
                  min={56}
                  max={98}
                  value={width}
                  onChange={(event) => setWidth(Number(event.target.value))}
                  className="w-full accent-brand-500"
                />
              </label>
            )}
            {preview.editable && (
              <label className="mt-4 flex flex-col gap-2 text-xs text-slate-400">
                编辑区高度：{height}vh
                <input
                  type="range"
                  min={52}
                  max={88}
                  value={height}
                  onChange={(event) => setHeight(Number(event.target.value))}
                  className="w-full accent-brand-500"
                />
              </label>
            )}
            {preview.editable && (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {isPublishedRevision
                  ? "保存后会从线上文章复制出一份修订草稿，当前网站内容不会立刻变化；继续执行“校验草稿”“审核通过”“发布网站”后才会替换线上版本。"
                  : "保存后会退回草稿阶段，请重新执行“校验草稿”。"}
              </p>
            )}
            {preview.sourceType === "fact-source" && <p className="mt-3 text-xs leading-5 text-slate-500">资料包会在核心事实源模式生成时注入给模型。请只放脱敏材料和可公开使用的判断标准。</p>}
          </div>
          {preview.editable ? (
            <textarea
              className="w-full resize-y bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-200 outline-none"
              style={{ minHeight: bodyHeight }}
              value={markdown}
              onChange={(event) => onMarkdownChange(event.target.value)}
            />
          ) : (
            <pre className="whitespace-pre-wrap break-words p-5 text-xs leading-6 text-slate-300">
              {preview.markdown ? preview.markdown.slice(0, 6000) : "这个关键词还没有生成草稿或已发布文章。"}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-200">{value}</dd>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      {label}
      <input
        type={type}
        className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MultiSelectInput({
  label,
  value,
  options,
  type,
  optionBusy,
  onChange,
  onAddOption,
  onDeleteOption,
}: {
  label: string;
  value: string;
  options: string[];
  type: "category" | "intent";
  optionBusy: string | null;
  onChange: (value: string) => void;
  onAddOption: (type: "category" | "intent", value: string) => void;
  onDeleteOption: (type: "category" | "intent", value: string) => void;
}) {
  const [newOption, setNewOption] = useState("");
  const selected = splitMultiValue(value);

  function toggleOption(option: string) {
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    onChange(next.join("、"));
  }

  function addOption() {
    const clean = newOption.trim();
    if (!clean) return;
    onAddOption(type, clean);
    if (!selected.includes(clean)) onChange([...selected, clean].join("、"));
    setNewOption("");
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <div className="rounded border border-slate-700 bg-slate-900 p-2">
        <div className="flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 rounded px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="h-3.5 w-3.5 accent-brand-500"
              />
              <span className="min-w-0 flex-1 truncate">{option}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDeleteOption(type, option);
                }}
                disabled={optionBusy === `delete:${type}:${option}`}
                className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-rose-500/10 hover:text-rose-200 disabled:text-slate-700"
                title={`删除${label}选项`}
              >
                删除
              </button>
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-2 border-t border-slate-800 pt-2">
          <input
            value={newOption}
            onChange={(event) => setNewOption(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOption();
              }
            }}
            placeholder={`新增${label}`}
            className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={addOption}
            disabled={!newOption.trim() || optionBusy === `add:${type}`}
            className="rounded bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-500"
          >
            添加
          </button>
        </div>
        <p className="mt-2 truncate text-[11px] text-slate-500">{selected.length > 0 ? selected.join("、") : `未选择${label}`}</p>
      </div>
    </div>
  );
}

function SelectInput({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      {label}
      <select
        className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function getItemId(item: WorkflowItem) {
  return item.slug || item.id || item.name || item.keyword || "unknown";
}

function getItemTitle(item: WorkflowItem) {
  return item.keyword || item.name || item.slug || item.id || "未命名任务";
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StageCard({ label, value, accent, active = false }: { label: string; value: number; accent: string; active?: boolean }) {
  return (
    <div className={`pipeline-panel p-5 ${active ? "ring-2 ring-brand-500" : ""}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  busyLabel = "执行中...",
  onClick,
  disabled,
  busy = false,
}: {
  label: string;
  busyLabel?: string;
  onClick: () => void;
  disabled: boolean;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
    >
      {busy ? busyLabel : label}
    </button>
  );
}

function MiniButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-brand-500 hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">{text}</div>;
}
