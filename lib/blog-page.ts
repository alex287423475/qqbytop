import type { Metadata } from "next";
import type { Locale } from "@/lib/site-data";

const blogCopy: Record<Locale, { eyebrow: string; title: string; description: string; empty: string }> = {
  zh: {
    eyebrow: "专业资讯",
    title: "把翻译、合规和本地化讲清楚",
    description: "QQBY 专业资讯：翻译报价、法律合规、技术本地化与跨境内容运营方法。",
    empty: "当前语言下还没有发布文章，后续会持续补充。",
  },
  en: {
    eyebrow: "Insights",
    title: "Translation, compliance, and localization explained clearly",
    description: "QQBY insights on pricing, compliance, localization workflows, and multilingual delivery.",
    empty: "No articles are published in this language yet.",
  },
  ja: {
    eyebrow: "インサイト",
    title: "翻訳・コンプライアンス・ローカライズを整理して解説",
    description: "QQBY による翻訳価格、法務対応、技術ローカライズの実務記事。",
    empty: "この言語では、まだ記事が公開されていません。",
  },
};

export function getBlogCopy(locale: Locale) {
  return blogCopy[locale];
}

export function buildBlogHref(locale: string, category: string, page: number) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/${locale}/blog${query ? `?${query}` : ""}`;
}

export function buildBlogCollectionSummary(locale: Locale, startItem: number, endItem: number, totalItems: number) {
  if (locale === "zh") {
    return `显示第 ${startItem}-${endItem} 篇，共 ${totalItems} 篇`;
  }

  if (locale === "ja") {
    return `${totalItems} 件中 ${startItem}-${endItem} 件を表示`;
  }

  return `Showing ${startItem}-${endItem} of ${totalItems} articles`;
}

export function buildBlogPageMetadata({
  locale,
  category,
  page,
}: {
  locale: Locale;
  category: string;
  page: number;
}): Metadata {
  const copy = getBlogCopy(locale);
  const canonical = buildBlogHref(locale, category, page);
  const categoryLabel = category && category !== "all" ? category : "";

  if (locale === "zh") {
    const title = categoryLabel
      ? `${categoryLabel}相关文章${page > 1 ? ` - 第 ${page} 页` : ""} | QQBY 专业资讯`
      : `${copy.eyebrow}${page > 1 ? ` - 第 ${page} 页` : ""} | QQBY 全球博译`;
    const description = categoryLabel
      ? `查看 QQBY 在${categoryLabel}分类下的专业资讯文章${page > 1 ? `，第 ${page} 页` : ""}。`
      : `${copy.description}${page > 1 ? ` 当前为第 ${page} 页。` : ""}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
      },
    };
  }

  const title = categoryLabel
    ? `${categoryLabel} articles${page > 1 ? ` - Page ${page}` : ""} | ${copy.eyebrow}`
    : `${copy.eyebrow}${page > 1 ? ` - Page ${page}` : ""} | QQBY`;
  const description = categoryLabel
    ? `Browse QQBY articles in ${categoryLabel}${page > 1 ? `, page ${page}` : ""}.`
    : `${copy.description}${page > 1 ? ` Page ${page}.` : ""}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}
