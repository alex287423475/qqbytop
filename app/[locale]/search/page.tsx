import Link from "next/link";
import type { Metadata } from "next";
import { SearchAiAnswer } from "@/components/shared/SearchAiAnswer";
import { searchSite, searchTypeLabels, type SearchResultType } from "@/lib/search";
import { buildSeoMetadata } from "@/lib/seo";
import { locales, type Locale } from "@/lib/site-data";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
};

const typeOptions: Array<{ value: "all" | SearchResultType; label: string }> = [
  { value: "all", label: "全部" },
  { value: "article", label: "文章" },
  { value: "service", label: "服务" },
  { value: "industry", label: "行业" },
  { value: "page", label: "页面" },
];

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const title = q ? `搜索：${q}` : "全站搜索";

  return buildSeoMetadata({
    locale: normalized,
    path: "/search",
    title,
    description: "搜索北京全球博译翻译公司网站内的服务、行业方案、专业文章和询价入口。",
    keywords: ["站内搜索", "翻译服务搜索", "翻译问题答案"],
    noIndex: true,
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const filters = await searchParams;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const query = typeof filters.q === "string" ? filters.q.trim() : "";
  const activeType = typeOptions.some((option) => option.value === filters.type) ? filters.type ?? "all" : "all";
  const results = searchSite(normalized, query, activeType);

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">站内搜索</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">搜索服务、方案和专业文章</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            输入证件翻译、合同翻译、跨境电商、报价、SDLXLIFF 等关键词，快速找到对应页面。
          </p>

          <form action={`/${normalized}/search`} className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_120px]">
              <label className="sr-only" htmlFor="site-search-query">
                搜索关键词
              </label>
              <input
                id="site-search-query"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="例如：证件翻译需要注意什么"
                className="min-h-12 rounded-2xl border border-slate-200 px-4 text-base text-brand-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />

              <label className="sr-only" htmlFor="site-search-type">
                搜索范围
              </label>
              <select
                id="site-search-type"
                name="type"
                defaultValue={activeType}
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base text-brand-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button type="submit" className="min-h-12 rounded-2xl bg-brand-600 px-6 text-base font-semibold text-white transition hover:bg-brand-500">
                搜索
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-5">
          {query && <SearchAiAnswer query={query} locale={normalized} type={activeType} />}

          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">{query ? `“${query}” 的搜索结果` : "推荐入口"}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {query ? `找到 ${results.length} 条相关内容` : "输入关键词后会按相关度显示服务、行业方案和文章。"}
              </p>
            </div>
            {query && (
              <Link href={`/${normalized}/search`} className="text-sm font-semibold text-brand-600 hover:text-brand-500">
                清空搜索
              </Link>
            )}
          </div>

          {results.length > 0 ? (
            <>
              <div className="grid gap-5">
                {results.map((result) => (
                  <article key={`${result.type}-${result.href}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                        {searchTypeLabels[result.type]}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{result.category}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-brand-900">
                      <Link href={result.href} className="hover:text-brand-600">
                        {result.title}
                      </Link>
                    </h3>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{result.description}</p>
                    {result.keywords.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {result.keywords.slice(0, 6).map((keyword) => (
                          <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link href={result.href} className="mt-5 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-500">
                      进入页面
                    </Link>
                  </article>
                ))}
              </div>
              <div className="mt-8 rounded-3xl bg-brand-900 px-6 py-8 text-white shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-8">
                <div>
                  <p className="text-sm font-semibold text-brand-100">搜索后仍不确定？</p>
                  <h3 className="mt-2 text-2xl font-bold">把材料用途发来，我们直接判断翻译路径</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                    说明文件类型、目标语种、提交机构和交付时间，我们会按真实项目边界给出报价建议。
                  </p>
                </div>
                <Link href={`/${normalized}/quote?source=search&category=${encodeURIComponent(query)}`} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 sm:mt-0">
                  提交询价
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <h3 className="text-xl font-bold text-brand-900">没有找到匹配内容</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                可以换成更短的词，例如“证件翻译”“合同”“报价”“跨境电商”，或直接提交询价让我们判断服务路径。
              </p>
              <Link href={`/${normalized}/quote`} className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500">
                提交询价
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
