import type { Locale } from "@/lib/site-data";

export type QuoteServiceType = "standard" | "professional" | "premium";

export type QuotePrefill = {
  source: string;
  category: string;
  serviceType: QuoteServiceType;
  languagePair: string;
  fileFormat: string;
  notes: string;
  panelEyebrow: string;
  panelTitle: string;
  panelDescription: string;
};

function clean(value: string | undefined) {
  return (value || "").trim();
}

function isStudyAbroadEssaySource(source: string) {
  return clean(source).toLowerCase() === "study-abroad-essay-tool";
}

export function inferQuoteServiceType(category: string): QuoteServiceType {
  const normalized = clean(category);
  if (["文书深度优化", "SOP / PS 结构重写", "申请材料包审核"].includes(normalized)) {
    return "professional";
  }
  if (["英文简历优化"].includes(normalized)) {
    return "standard";
  }
  if (["法律翻译", "法律合规", "技术翻译", "技术本地化"].includes(normalized)) {
    return "professional";
  }
  if (["跨境电商", "跨境合规"].includes(normalized)) {
    return "premium";
  }
  return "standard";
}

function buildZhNotes(category: string, source: string) {
  const pieces = [
    source === "blog" ? "我从博客文章进入询价页。" : "",
    isStudyAbroadEssaySource(source) ? "我刚完成留学文书诊断，希望根据诊断结果咨询后续优化服务。" : "",
    category ? `当前关注分类：${category}。` : "",
    "请按文件类型、用途、目标语种、审校深度与交付时间评估报价。",
  ].filter(Boolean);
  return pieces.join(" ");
}

function buildEnNotes(category: string, source: string) {
  const pieces = [
    source === "blog" ? "I arrived from the blog page." : "",
    isStudyAbroadEssaySource(source) ? "I just completed the study-abroad essay check and want to discuss the next service step." : "",
    category ? `Current topic: ${category}.` : "",
    "Please estimate based on file type, intended use, target language, review depth, and delivery timeline.",
  ].filter(Boolean);
  return pieces.join(" ");
}

function buildJaNotes(category: string, source: string) {
  const pieces = [
    source === "blog" ? "ブログ記事から見積ページに入りました。" : "",
    isStudyAbroadEssaySource(source) ? "留学文書診断を完了し、次の最適化サービスについて相談したいです。" : "",
    category ? `現在の関心カテゴリ：${category}。` : "",
    "ファイル形式、用途、対象言語、レビュー深度、納期を踏まえて見積をご案内ください。",
  ].filter(Boolean);
  return pieces.join(" ");
}

export function buildQuotePrefill({
  locale,
  source,
  category,
}: {
  locale: Locale;
  source?: string;
  category?: string;
}): QuotePrefill {
  const normalizedSource = clean(source);
  const normalizedCategory = clean(category);
  const serviceType = inferQuoteServiceType(normalizedCategory);

  if (locale === "en") {
    return {
      source: normalizedSource,
      category: normalizedCategory,
      serviceType,
      languagePair: "Chinese -> English",
      fileFormat: "Word / PDF / PPT / Excel",
      notes: buildEnNotes(normalizedCategory, normalizedSource),
      panelEyebrow: normalizedSource === "blog" ? "From blog" : "Quick brief",
      panelTitle: normalizedCategory ? `${normalizedCategory} quote request` : "Tell us what needs to be translated",
      panelDescription: normalizedCategory
        ? `We will keep the current topic in context and estimate based on complexity, review scope, and delivery boundary.`
        : "Share the files, languages, timeline, and intended use. We will estimate based on complexity and review scope.",
    };
  }

  if (locale === "ja") {
    return {
      source: normalizedSource,
      category: normalizedCategory,
      serviceType,
      languagePair: "中国語 -> 英語",
      fileFormat: "Word / PDF / PPT / Excel",
      notes: buildJaNotes(normalizedCategory, normalizedSource),
      panelEyebrow: normalizedSource === "blog" ? "ブログ経由" : "依頼メモ",
      panelTitle: normalizedCategory ? `${normalizedCategory} の見積相談` : "翻訳内容を共有してください",
      panelDescription: normalizedCategory
        ? "現在のカテゴリを引き継いだまま、難度、レビュー範囲、納品条件を見てご案内します。"
        : "ファイル、言語、納期、用途が分かれば、作業量とレビュー範囲を見て見積します。",
    };
  }

  return {
    source: normalizedSource,
    category: normalizedCategory,
    serviceType,
    languagePair: "中 -> 英",
    fileFormat: "Word / PDF / PPT / Excel",
    notes: buildZhNotes(normalizedCategory, normalizedSource),
    panelEyebrow: isStudyAbroadEssaySource(normalizedSource) ? "来自留学文书诊断" : normalizedSource === "blog" ? "来自博客线索" : "快速说明",
    panelTitle: normalizedCategory ? `${normalizedCategory}需求已带入咨询单` : "说明你的翻译需求，我们直接开始评估",
    panelDescription: isStudyAbroadEssaySource(normalizedSource)
      ? "已带入你选择的后续方案。请留下联系方式，并补充申请阶段、目标学校、截止时间或需要处理的材料范围。"
      : normalizedCategory
        ? "我们会保留当前分类上下文，按材料复杂度、审校深度和交付边界来判断工作量与报价。"
        : "上传或说明文件用途、目标语种、交付时间和审校要求，我们会按实际复杂度评估。",
  };
}
