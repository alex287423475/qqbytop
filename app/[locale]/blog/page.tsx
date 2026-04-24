import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { locales, type Locale } from "@/lib/site-data";

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
    title: "翻訳、コンプライアンス、ローカライズを整理して解説",
    description: "QQBY による翻訳価格、法務対応、技術ローカライズの実務記事。",
    empty: "この言語ではまだ記事が公開されていません。",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";

  return {
    title: blogCopy[normalized].eyebrow,
    description: blogCopy[normalized].description,
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const articles = getAllArticles(normalized);
  const categories = Array.from(new Set(articles.map((article) => article.category).filter(Boolean)));

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">{blogCopy[normalized].eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">{blogCopy[normalized].title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{blogCopy[normalized].description}</p>
          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category} className="rounded-full bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
              {blogCopy[normalized].empty}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article key={article.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-600 hover:shadow-lg">
                  {article.coverImage && (
                    <Link href={`/${normalized}/blog/${article.slug}`} className="block border-b border-slate-100 bg-slate-50">
                      <img src={article.coverImage} alt={article.coverAlt || article.title} className="aspect-[1200/630] w-full object-cover" />
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
        </div>
      </section>
    </>
  );
}
