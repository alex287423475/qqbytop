import type { Metadata } from "next";
import type { ArticleMeta } from "@/lib/articles";
import type { Locale } from "@/lib/site-data";

export const siteBaseUrl = "https://qqbytop.com";

const blogCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    empty: string;
    allArticlesLabel: string;
    categoryEmpty: string;
    clearFilter: string;
    prevPage: string;
    nextPage: string;
    pageLabel: (page: number, totalPages: number) => string;
    showingLabel: (startItem: number, endItem: number, totalItems: number) => string;
    currentRangeLabel: (startItem: number, endItem: number, totalItems: number) => string;
    breadcrumbs: {
      home: string;
      blog: string;
    };
  }
> = {
  zh: {
    eyebrow: "专业资讯",
    title: "把翻译、合规和本地化讲清楚",
    description: "QQBY 专业资讯：翻译报价、法律合规、技术本地化与跨境内容运营方法。",
    empty: "当前语言下还没有发布文章，后续会持续补充。",
    allArticlesLabel: "全部文章",
    categoryEmpty: "当前分类下还没有文章。",
    clearFilter: "查看全部文章",
    prevPage: "上一页",
    nextPage: "下一页",
    pageLabel: (page, totalPages) => `第 ${page} / ${totalPages} 页`,
    showingLabel: (startItem, endItem, totalItems) => `显示第 ${startItem}-${endItem} 篇，共 ${totalItems} 篇`,
    currentRangeLabel: (startItem, endItem, totalItems) => `当前显示 ${startItem}-${endItem} / ${totalItems}`,
    breadcrumbs: {
      home: "首页",
      blog: "专业资讯",
    },
  },
  en: {
    eyebrow: "Insights",
    title: "Translation, compliance, and localization explained clearly",
    description: "QQBY insights on pricing, compliance, localization workflows, and multilingual delivery.",
    empty: "No articles are published in this language yet.",
    allArticlesLabel: "All articles",
    categoryEmpty: "No articles are available in this category yet.",
    clearFilter: "View all articles",
    prevPage: "Previous",
    nextPage: "Next",
    pageLabel: (page, totalPages) => `Page ${page} of ${totalPages}`,
    showingLabel: (startItem, endItem, totalItems) => `Showing ${startItem}-${endItem} of ${totalItems} articles`,
    currentRangeLabel: (startItem, endItem, totalItems) => `Currently showing ${startItem}-${endItem} / ${totalItems}`,
    breadcrumbs: {
      home: "Home",
      blog: "Insights",
    },
  },
  ja: {
    eyebrow: "インサイト",
    title: "翻訳・コンプライアンス・ローカライズを整理して解説",
    description: "QQBY による翻訳価格、法務対応、技術ローカライズの実務記事。",
    empty: "この言語では、まだ記事が公開されていません。",
    allArticlesLabel: "すべての記事",
    categoryEmpty: "このカテゴリにはまだ記事がありません。",
    clearFilter: "すべての記事を見る",
    prevPage: "前のページ",
    nextPage: "次のページ",
    pageLabel: (page, totalPages) => `${page} / ${totalPages} ページ`,
    showingLabel: (startItem, endItem, totalItems) => `${totalItems} 件中 ${startItem}-${endItem} 件を表示`,
    currentRangeLabel: (startItem, endItem, totalItems) => `現在表示 ${startItem}-${endItem} / ${totalItems}`,
    breadcrumbs: {
      home: "ホーム",
      blog: "インサイト",
    },
  },
};

export function getBlogCopy(locale: Locale) {
  return blogCopy[locale];
}

export function buildAbsoluteUrl(path: string) {
  return `${siteBaseUrl}${path}`;
}

export function buildBlogHref(locale: string, category: string, page: number) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/${locale}/blog${query ? `?${query}` : ""}`;
}

export function buildBlogCollectionSummary(locale: Locale, startItem: number, endItem: number, totalItems: number) {
  return getBlogCopy(locale).showingLabel(startItem, endItem, totalItems);
}

export function buildBlogCurrentRange(locale: Locale, startItem: number, endItem: number, totalItems: number) {
  return getBlogCopy(locale).currentRangeLabel(startItem, endItem, totalItems);
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

export function buildBlogCollectionSchema({
  locale,
  category,
  page,
  articles,
  startItem,
  totalItems,
}: {
  locale: Locale;
  category: string;
  page: number;
  articles: ArticleMeta[];
  startItem: number;
  totalItems: number;
}) {
  const copy = getBlogCopy(locale);
  const categoryLabel = category && category !== "all" ? category : copy.allArticlesLabel;
  const canonical = buildBlogHref(locale, category, page);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryLabel} | ${copy.eyebrow}`,
    description: buildBlogCollectionSummary(locale, startItem, startItem + articles.length - 1, totalItems),
    url: buildAbsoluteUrl(canonical),
    isPartOf: {
      "@type": "WebSite",
      name: "QQBY 全球博译",
      url: siteBaseUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: totalItems,
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: startItem + index,
        url: buildAbsoluteUrl(`/${locale}/blog/${article.slug}`),
        name: article.title,
      })),
    },
  };
}

export function buildBlogBreadcrumbSchema({
  locale,
  category,
  page,
}: {
  locale: Locale;
  category: string;
  page: number;
}) {
  const copy = getBlogCopy(locale);
  const blogHref = buildBlogHref(locale, "all", 1);
  const currentHref = buildBlogHref(locale, category, page);
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: copy.breadcrumbs.home,
      item: buildAbsoluteUrl(`/${locale}`),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: copy.breadcrumbs.blog,
      item: buildAbsoluteUrl(blogHref),
    },
  ];

  if (category && category !== "all") {
    items.push({
      "@type": "ListItem",
      position: 3,
      name: category,
      item: buildAbsoluteUrl(currentHref),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}
