export type ArticleListingItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  categories?: string[];
};

export type ArticleFacet = {
  label: string;
  value: string;
  count: number;
};

export function normalizeArticleCategories(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildArticleListing<T extends ArticleListingItem>(
  articles: T[],
  options: { category?: string; page?: string; pageSize?: number },
) {
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 6;
  const facetsMap = new Map<string, number>();

  for (const article of articles) {
    const categories = normalizeArticleCategories(article.categories?.length ? article.categories : article.category);
    for (const category of categories) {
      facetsMap.set(category, (facetsMap.get(category) || 0) + 1);
    }
  }

  const facets: ArticleFacet[] = [
    { label: "全部", value: "all", count: articles.length },
    ...Array.from(facetsMap.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], "zh-Hans-CN");
      })
      .map(([label, count]) => ({ label, value: label, count })),
  ];

  const requestedCategory = (options.category || "").trim();
  const activeCategory = facets.some((facet) => facet.value === requestedCategory) ? requestedCategory : "all";
  const filteredArticles =
    activeCategory === "all"
      ? articles
      : articles.filter((article) =>
          normalizeArticleCategories(article.categories?.length ? article.categories : article.category).includes(activeCategory),
        );

  const totalItems = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(toPositiveInt(options.page, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    facets,
    activeCategory,
    articles: filteredArticles.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
