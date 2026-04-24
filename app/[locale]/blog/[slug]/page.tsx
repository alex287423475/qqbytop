import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/JsonLd";
import { getArticle, getAllArticleSlugs, getAllArticles } from "@/lib/articles";
import { locales, type Locale } from "@/lib/site-data";

function buildArticleSchema(locale: string, article: Awaited<ReturnType<typeof getArticle>>) {
  if (!article) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    inLanguage: locale,
    keywords: article.keywords.join(", "),
    image: article.images.map((image) => `https://qqbytop.com${image}`),
    mainEntityOfPage: `https://qqbytop.com/${locale}/blog/${article.slug}`,
    author: {
      "@type": "Organization",
      name: "QQBY",
    },
    publisher: {
      "@type": "Organization",
      name: "QQBY",
    },
  };
}

function buildFaqSchema(article: Awaited<ReturnType<typeof getArticle>>) {
  if (!article || article.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function generateStaticParams() {
  return getAllArticleSlugs();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);

  if (!article) {
    return {
      title: "专业资讯",
      description: "QQBY 专业资讯文章。",
    };
  }

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: article.images,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const article = await getArticle(normalized, slug);

  if (!article) notFound();

  const related = getAllArticles(normalized)
    .filter((item) => item.slug !== slug && item.category === article.category)
    .slice(0, 3);

  const articleSchema = buildArticleSchema(normalized, article);
  const faqSchema = buildFaqSchema(article);

  return (
    <>
      {articleSchema && <JsonLd data={articleSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}

      <article className="mx-auto max-w-3xl px-5 py-16">
        <Link href={`/${normalized}/blog`} className="text-sm font-semibold text-brand-600">
          返回资讯列表
        </Link>
        <p className="mt-8 text-sm font-semibold text-brand-600">{article.category}</p>
        <h1 className="mt-3 text-4xl font-bold text-brand-900">{article.title}</h1>
        <p className="mt-4 text-sm text-slate-500">
          {article.date} · {article.readTime}
        </p>
        {article.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                {keyword}
              </span>
            ))}
          </div>
        )}
        <div className="prose-content mt-10" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      </article>

      {related.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-5">
            <h2 className="text-2xl font-bold text-brand-900">相关文章</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/${normalized}/blog/${item.slug}`} className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
                  <p className="text-sm text-brand-600">{item.category}</p>
                  <h3 className="mt-2 font-bold text-brand-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
