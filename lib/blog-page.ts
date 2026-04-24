import type { Metadata } from "next";
import type { ArticleMeta } from "@/lib/articles";
import type { Locale } from "@/lib/site-data";

export const siteBaseUrl = "https://qqbytop.com";

type BlogStat = {
  label: string;
  value: string;
};

type BlogOverview = {
  eyebrow: string;
  title: string;
  description: string;
  stats: BlogStat[];
};

type BlogFeature = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  cta: string;
};

const zhCategoryInsights: Record<string, string> = {
  "翻译价格": "集中梳理报价逻辑、计费变量和交付边界，适合询价前快速判断预算与工作量。",
  "证件翻译": "覆盖签证、学历、证明类材料的格式要求、盖章逻辑和常见退件原因。",
  "法律翻译": "围绕合同、诉讼材料、证据文件展开，重点强调术语一致性与法律风险。",
  "专业翻译": "聚焦高门槛行业文档，帮助你判断项目难点、审核深度和协作方式。",
  "跨境电商": "面向平台卖家和独立站团队，侧重 listing、申诉、支付与合规文档场景。",
  "法律合规": "更关注监管口径、证据链和可核验表达，适合需要稳妥交付的场景。",
  "技术本地化": "从界面、文档到交付流程，讨论多语言上线时的术语、排版与版本同步。",
  "技术翻译": "围绕说明书、手册、参数表和 SOP 展开，强调可执行性与技术准确度。",
  "翻译质量": "拆解质量判断标准、审校方法与返工成本，帮助团队建立可复用的验收框架。",
  "跨境合规": "聚焦跨境业务中的规则变化、申诉材料和风险控制，适合需要长期跟踪的团队。",
};

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
    overview: {
      allEyebrow: string;
      allTitle: string;
      allDescription: string;
      categoryEyebrow: string;
      categoryTitle: (category: string) => string;
      categoryDescription: (category: string) => string;
      totalArticles: string;
      totalCategories: string;
      categoryArticles: string;
      currentPage: string;
      latestUpdate: string;
    };
    feature: {
      eyebrow: string;
      title: string;
      description: string;
      factSourceBadge: string;
      defaultBadge: string;
      cta: string;
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
    overview: {
      allEyebrow: "栏目导读",
      allTitle: "先用分类找到问题，再决定看哪一篇",
      allDescription: "这里按业务场景整理了报价、证件、法律、技术和跨境合规等主题，适合先快速缩小范围，再进入具体文章。",
      categoryEyebrow: "分类导读",
      categoryTitle: (category) => `${category}相关文章`,
      categoryDescription: (category) =>
        zhCategoryInsights[category] ?? "这一分类会优先呈现判断标准、交付边界和实际风险点，适合先建立整体判断框架。",
      totalArticles: "已发布文章",
      totalCategories: "分类数量",
      categoryArticles: "本分类文章",
      currentPage: "当前页码",
      latestUpdate: "最近更新",
    },
    feature: {
      eyebrow: "推荐阅读",
      title: "先看这篇",
      description: "如果你想快速把握这一栏目的重点，可以先从这篇文章开始。",
      factSourceBadge: "核心事实源",
      defaultBadge: "重点文章",
      cta: "进入文章",
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
    overview: {
      allEyebrow: "Section guide",
      allTitle: "Start with a topic, then narrow to the article you need",
      allDescription: "Browse pricing, certificates, legal translation, technical localization, and cross-border compliance topics from one structured hub.",
      categoryEyebrow: "Topic guide",
      categoryTitle: (category) => `${category} articles`,
      categoryDescription: (category) =>
        `This topic page surfaces the key decision points, delivery boundaries, and recurring risks behind ${category.toLowerCase()}.`,
      totalArticles: "Published",
      totalCategories: "Categories",
      categoryArticles: "In this topic",
      currentPage: "Page",
      latestUpdate: "Latest update",
    },
    feature: {
      eyebrow: "Recommended read",
      title: "Start here",
      description: "Use this article as the quickest way to understand the core context of the topic.",
      factSourceBadge: "Core fact source",
      defaultBadge: "Featured",
      cta: "Read article",
    },
  },
  ja: {
    eyebrow: "インサイト",
    title: "翻訳・コンプライアンス・ローカライズを整理して理解",
    description: "QQBY による翻訳料金、法務対応、技術ローカライズ、多言語運用の記事一覧です。",
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
    overview: {
      allEyebrow: "ガイド",
      allTitle: "まずテーマを選び、次に必要な記事へ進む",
      allDescription: "料金、証明書、法務、技術ローカライズ、越境コンプライアンスなどを整理して閲覧できます。",
      categoryEyebrow: "カテゴリガイド",
      categoryTitle: (category) => `${category} の記事`,
      categoryDescription: (category) =>
        `${category} に関する判断基準、納品範囲、よくあるリスクを先に把握できる構成です。`,
      totalArticles: "公開記事",
      totalCategories: "カテゴリ数",
      categoryArticles: "このカテゴリの記事",
      currentPage: "現在ページ",
      latestUpdate: "最新更新",
    },
    feature: {
      eyebrow: "おすすめ",
      title: "まず読むべき記事",
      description: "このカテゴリの要点をつかむなら、まずはこちらの記事がおすすめです。",
      factSourceBadge: "コア事実ソース",
      defaultBadge: "注目記事",
      cta: "記事を読む",
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

export function buildBlogPageOverview({
  locale,
  activeCategory,
  totalArticles,
  totalCategories,
  categoryArticles,
  currentPage,
  latestDate,
}: {
  locale: Locale;
  activeCategory: string;
  totalArticles: number;
  totalCategories: number;
  categoryArticles: number;
  currentPage: number;
  latestDate: string;
}): BlogOverview {
  const copy = getBlogCopy(locale);
  const isAll = activeCategory === "all";

  return {
    eyebrow: isAll ? copy.overview.allEyebrow : copy.overview.categoryEyebrow,
    title: isAll ? copy.overview.allTitle : copy.overview.categoryTitle(activeCategory),
    description: isAll ? copy.overview.allDescription : copy.overview.categoryDescription(activeCategory),
    stats: isAll
      ? [
          { label: copy.overview.totalArticles, value: String(totalArticles) },
          { label: copy.overview.totalCategories, value: String(totalCategories) },
          { label: copy.overview.latestUpdate, value: latestDate || "-" },
        ]
      : [
          { label: copy.overview.categoryArticles, value: String(categoryArticles) },
          { label: copy.overview.currentPage, value: String(currentPage) },
          { label: copy.overview.latestUpdate, value: latestDate || "-" },
        ],
  };
}

export function buildBlogFeature({
  locale,
  article,
}: {
  locale: Locale;
  article: ArticleMeta | null;
}): BlogFeature | null {
  if (!article) return null;
  const copy = getBlogCopy(locale);
  return {
    eyebrow: copy.feature.eyebrow,
    title: copy.feature.title,
    description: copy.feature.description,
    badge: article.contentMode === "fact-source" ? copy.feature.factSourceBadge : copy.feature.defaultBadge,
    cta: copy.feature.cta,
  };
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
