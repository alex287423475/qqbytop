import Image from "next/image";
import Link from "next/link";
import { BlogCategoryChips } from "@/components/shared/BlogCategoryChips";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildArticleListing } from "@/lib/article-listing";
import { getAllArticles } from "@/lib/articles";
import {
  buildBlogBreadcrumbSchema,
  buildBlogCollectionSchema,
  buildBlogCollectionSummary,
  buildBlogCurrentRange,
  buildBlogFeature,
  buildBlogHref,
  buildBlogPageOverview,
  buildBlogPageMetadata,
  getBlogCopy,
} from "@/lib/blog-page";
import { locales, type Locale } from "@/lib/site-data";
import { normalizeArticleCategories } from "@/lib/article-listing";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const articles = getAllArticles(normalized);
  const listing = buildArticleListing(articles, {
    category: filters.category,
    page: filters.page,
    pageSize: 6,
  });

  return buildBlogPageMetadata({
    locale: normalized,
    category: listing.activeCategory,
    page: listing.pagination.page,
  });
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const copy = getBlogCopy(normalized);
  const articles = getAllArticles(normalized);
  const listing = buildArticleListing(articles, {
    category: filters.category,
    page: filters.page,
    pageSize: 6,
  });
  const filteredArticles =
    listing.activeCategory === "all"
      ? articles
      : articles.filter((article) =>
          normalizeArticleCategories(article.categories?.length ? article.categories : article.category).includes(
            listing.activeCategory,
          ),
        );
  const overview = buildBlogPageOverview({
    locale: normalized,
    activeCategory: listing.activeCategory,
    totalArticles: articles.length,
    totalCategories: Math.max(0, listing.facets.length - 1),
    categoryArticles: filteredArticles.length,
    currentPage: listing.pagination.page,
    latestDate: filteredArticles[0]?.date ?? articles[0]?.date ?? "",
  });
  const featuredArticle =
    filteredArticles.find((article) => article.contentMode === "fact-source") ?? filteredArticles[0] ?? null;
  const feature = buildBlogFeature({
    locale: normalized,
    article: featuredArticle,
  });
  const collectionSchema = buildBlogCollectionSchema({
    locale: normalized,
    category: listing.activeCategory,
    page: listing.pagination.page,
    articles: listing.articles,
    startItem: listing.pagination.startItem,
    totalItems: listing.pagination.totalItems,
  });
  const breadcrumbSchema = buildBlogBreadcrumbSchema({
    locale: normalized,
    category: listing.activeCategory,
    page: listing.pagination.page,
  });

  return (
    <>
      <JsonLd data={collectionSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{copy.description}</p>
          {listing.facets.length > 1 && (
            <div className="mt-8">
              <BlogCategoryChips
                facets={listing.facets.map((facet) => ({
                  ...facet,
                  href: buildBlogHref(normalized, facet.value, 1),
                }))}
                activeCategory={listing.activeCategory}
              />
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
              {copy.empty}
            </div>
          ) : (
            <>
              <div id="blog-results" className="mb-8 scroll-mt-28 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-brand-600">
                      {listing.activeCategory === "all" ? copy.allArticlesLabel : listing.activeCategory}
                    </p>
                    {listing.activeCategory !== "all" && (
                      <Link
                        href={`${buildBlogHref(normalized, "all", 1)}#blog-results`}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                      >
                        {copy.clearFilter}
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {buildBlogCollectionSummary(
                      normalized,
                      listing.pagination.startItem,
                      listing.pagination.endItem,
                      listing.pagination.totalItems,
                    )}
                  </p>
                </div>
                <p className="text-sm text-slate-500">{copy.pageLabel(listing.pagination.page, listing.pagination.totalPages)}</p>
              </div>

              <div className="mb-10 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{overview.eyebrow}</p>
                  <h2 className="mt-3 text-2xl font-bold text-brand-900">{overview.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{overview.description}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {overview.stats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
                        <p className="mt-2 text-xl font-bold text-brand-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {featuredArticle && feature && (
                  <section className="overflow-hidden rounded-3xl border border-brand-200 bg-brand-950 text-white shadow-sm">
                    {featuredArticle.coverImage && (
                      <Link
                        href={`/${normalized}/blog/${featuredArticle.slug}`}
                        className="block border-b border-white/10 bg-brand-900/60"
                      >
                        <Image
                          src={featuredArticle.coverImage}
                          alt={featuredArticle.coverAlt || featuredArticle.title}
                          width={1200}
                          height={630}
                          sizes="(max-width: 1024px) 100vw, 34vw"
                          className="aspect-[1200/630] w-full object-cover"
                        />
                      </Link>
                    )}
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">{feature.eyebrow}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
                          {feature.badge}
                        </span>
                        <span className="text-xs text-brand-100/80">{featuredArticle.category}</span>
                      </div>
                      <h2 className="mt-4 text-2xl font-bold leading-tight text-white">{featuredArticle.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-brand-50/90">{feature.description}</p>
                      <p className="mt-4 text-sm leading-7 text-brand-100/80">{featuredArticle.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {featuredArticle.keywords.slice(0, 3).map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-brand-100/85"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                        <p className="text-xs text-brand-100/70">
                          {featuredArticle.date} · {featuredArticle.readTime}
                        </p>
                        <Link
                          href={`/${normalized}/blog/${featuredArticle.slug}`}
                          className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
                        >
                          {feature.cta}
                        </Link>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {listing.articles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
                  {copy.categoryEmpty}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {listing.articles.map((article) => (
                    <article
                      key={article.slug}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-600 hover:shadow-lg"
                    >
                      {article.coverImage && (
                        <Link href={`/${normalized}/blog/${article.slug}`} className="block overflow-hidden border-b border-slate-100 bg-slate-50">
                          <Image
                            src={article.coverImage}
                            alt={article.coverAlt || article.title}
                            width={1200}
                            height={630}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="aspect-[1200/630] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </Link>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-brand-600">{article.category}</p>
                          {article.contentMode === "fact-source" && (
                            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                              {feature?.badge || "核心事实源"}
                            </span>
                          )}
                        </div>
                        <h2 className="mt-3 text-xl font-bold text-brand-900">
                          <Link href={`/${normalized}/blog/${article.slug}`}>{article.title}</Link>
                        </h2>
                        <p className="mt-4 leading-7 text-slate-600">{article.description}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {article.keywords.slice(0, 3).map((keyword) => (
                            <span key={keyword} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <p className="mt-5 text-xs text-slate-500">
                          {article.date} · {article.readTime}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {listing.pagination.totalPages > 1 && (
                <nav
                  className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap"
                  aria-label="Blog pagination"
                >
                  <Link
                    href={`${buildBlogHref(normalized, listing.activeCategory, Math.max(1, listing.pagination.page - 1))}#blog-results`}
                    aria-disabled={listing.pagination.page === 1}
                    className={`inline-flex min-w-24 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium ${
                      listing.pagination.page === 1
                        ? "pointer-events-none border-slate-200 text-slate-300"
                        : "border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700"
                    }`}
                  >
                    {copy.prevPage}
                  </Link>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {Array.from({ length: listing.pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => {
                      const active = pageNumber === listing.pagination.page;
                      return (
                        <Link
                          key={pageNumber}
                          href={`${buildBlogHref(normalized, listing.activeCategory, pageNumber)}#blog-results`}
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold ${
                            active
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700"
                          }`}
                        >
                          {pageNumber}
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href={`${buildBlogHref(
                      normalized,
                      listing.activeCategory,
                      Math.min(listing.pagination.totalPages, listing.pagination.page + 1),
                    )}#blog-results`}
                    aria-disabled={listing.pagination.page === listing.pagination.totalPages}
                    className={`inline-flex min-w-24 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium ${
                      listing.pagination.page === listing.pagination.totalPages
                        ? "pointer-events-none border-slate-200 text-slate-300"
                        : "border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700"
                    }`}
                  >
                    {copy.nextPage}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {buildBlogCurrentRange(
                      normalized,
                      listing.pagination.startItem,
                      listing.pagination.endItem,
                      listing.pagination.totalItems,
                    )}
                  </p>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
