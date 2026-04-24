import Image from "next/image";
import Link from "next/link";
import { BlogCategoryChips } from "@/components/shared/BlogCategoryChips";
import { buildArticleListing } from "@/lib/article-listing";
import { getAllArticles } from "@/lib/articles";
import { buildBlogCollectionSummary, buildBlogHref, buildBlogPageMetadata, getBlogCopy } from "@/lib/blog-page";
import { locales, type Locale } from "@/lib/site-data";

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

  return (
    <>
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
                  <p className="text-sm font-semibold text-brand-600">{listing.activeCategory === "all" ? "全部文章" : listing.activeCategory}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {buildBlogCollectionSummary(
                      normalized,
                      listing.pagination.startItem,
                      listing.pagination.endItem,
                      listing.pagination.totalItems,
                    )}
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  第 {listing.pagination.page} / {listing.pagination.totalPages} 页
                </p>
              </div>

              {listing.articles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
                  当前分类下还没有文章。
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
                        <p className="text-sm font-semibold text-brand-600">{article.category}</p>
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
                    上一页
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
                    下一页
                  </Link>
                  <p className="text-sm text-slate-500">
                    当前显示 {listing.pagination.startItem}-{listing.pagination.endItem} / {listing.pagination.totalItems}
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
