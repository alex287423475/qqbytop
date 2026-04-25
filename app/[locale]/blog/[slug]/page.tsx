import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleReaderShell } from "@/components/shared/ArticleReaderShell";
import { JsonLd } from "@/components/shared/JsonLd";
import { getArticle, getAllArticleSlugs, getAllArticles } from "@/lib/articles";
import { locales, type Locale } from "@/lib/site-data";

type BlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const copy = {
  zh: {
    blogLabel: "专业资讯",
    backToList: "返回资讯列表",
    articleUpdated: "更新于",
    readTime: "阅读时长",
    keywordLabel: "关键词",
    contentModeLabel: "内容模式",
    factSource: "核心事实源",
    quickOverview: "文章概览",
    articleOutline: "目录导航",
    jumpToQuote: "提交询价",
    callNow: "电话咨询",
    articleFaq: "常见问题",
    relatedArticles: "相关文章",
    relatedDescription: "继续阅读同一主题下的相关内容，快速完成判断、比价和项目准备。",
    quoteCardTitle: "需要根据这篇内容继续判断项目吗？",
    quoteCardText: "把文件类型、用途和交付时间发给我们，我们会按场景帮您判断服务级别和报价口径。",
    quoteCardButton: "带着当前主题询价",
    articleMetaTitle: "文章信息",
    descriptionLabel: "摘要",
    closePreview: "关闭预览",
    imagePreviewHint: "点击图片可放大查看",
  },
  en: {
    blogLabel: "Insights",
    backToList: "Back to blog",
    articleUpdated: "Updated",
    readTime: "Read time",
    keywordLabel: "Keywords",
    contentModeLabel: "Content mode",
    factSource: "Core fact source",
    quickOverview: "Overview",
    articleOutline: "On this page",
    jumpToQuote: "Request a quote",
    callNow: "Call us",
    articleFaq: "FAQ",
    relatedArticles: "Related articles",
    relatedDescription: "Continue with related reading in the same theme and move faster from research to execution.",
    quoteCardTitle: "Need to turn this article into a live project?",
    quoteCardText: "Send us the file type, usage, and target deadline. We will help scope the work and quote the right service level.",
    quoteCardButton: "Quote this topic",
    articleMetaTitle: "Article details",
    descriptionLabel: "Summary",
    closePreview: "Close preview",
    imagePreviewHint: "Click an image to enlarge it",
  },
  ja: {
    blogLabel: "専門情報",
    backToList: "記事一覧へ戻る",
    articleUpdated: "更新日",
    readTime: "読了目安",
    keywordLabel: "キーワード",
    contentModeLabel: "コンテンツ種別",
    factSource: "コア事実ソース",
    quickOverview: "記事概要",
    articleOutline: "目次",
    jumpToQuote: "見積もり相談",
    callNow: "電話で相談",
    articleFaq: "よくある質問",
    relatedArticles: "関連記事",
    relatedDescription: "同じテーマの関連記事を続けて読み、判断や依頼準備をスムーズに進められます。",
    quoteCardTitle: "この記事を案件判断につなげますか？",
    quoteCardText: "文書種別、用途、納期を共有いただければ、適切なサービス区分と見積もり基準をご案内します。",
    quoteCardButton: "このテーマで相談する",
    articleMetaTitle: "記事情報",
    descriptionLabel: "概要",
    closePreview: "プレビューを閉じる",
    imagePreviewHint: "画像をクリックすると拡大表示されます",
  },
} as const;

function getUiCopy(locale: Locale) {
  return copy[locale] ?? copy.zh;
}

function getBaseUrl() {
  return "https://qqbytop.com";
}

function buildArticleSchema(locale: string, article: Awaited<ReturnType<typeof getArticle>>) {
  if (!article) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: locale,
    keywords: article.keywords.join(", "),
    image: article.images.map((image) => `${getBaseUrl()}${image}`),
    mainEntityOfPage: `${getBaseUrl()}/${locale}/blog/${article.slug}`,
    author: {
      "@type": "Organization",
      name: "北京全球博译翻译公司",
    },
    publisher: {
      "@type": "Organization",
      name: "北京全球博译翻译公司",
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

function buildBreadcrumbSchema(locale: string, article: Awaited<ReturnType<typeof getArticle>>) {
  if (!article) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "QQBY",
        item: `${getBaseUrl()}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "专业资讯",
        item: `${getBaseUrl()}/${locale}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${getBaseUrl()}/${locale}/blog/${article.slug}`,
      },
    ],
  };
}

export function generateStaticParams() {
  return getAllArticleSlugs();
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const article = await getArticle(normalized, slug);

  if (!article) {
    return {
      title: "专业资讯",
      description: "QQBY 专业资讯文章。",
    };
  }

  const canonical = `${getBaseUrl()}/${normalized}/blog/${article.slug}`;
  const ogImages = article.images.length > 0 ? article.images.map((image) => `${getBaseUrl()}${image}`) : undefined;

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: canonical,
      images: ogImages,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const ui = getUiCopy(normalized);
  const article = await getArticle(normalized, slug);

  if (!article) notFound();

  const related = getAllArticles(normalized)
    .filter((item) => item.slug !== slug && item.categories.some((category) => article.categories.includes(category)))
    .slice(0, 3);

  const articleSchema = buildArticleSchema(normalized, article);
  const faqSchema = buildFaqSchema(article);
  const breadcrumbSchema = buildBreadcrumbSchema(normalized, article);
  const quoteHref = `/${normalized}/quote?source=blog&category=${encodeURIComponent(article.category || article.categories[0] || "")}`;

  return (
    <>
      {articleSchema && <JsonLd data={articleSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link href={`/${normalized}`} className="font-medium text-slate-500 hover:text-brand-600">
              QQBY
            </Link>
            <span>/</span>
            <Link href={`/${normalized}/blog`} className="font-medium text-slate-500 hover:text-brand-600">
              {ui.blogLabel}
            </Link>
            <span>/</span>
            <span className="text-slate-700">{article.title}</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <Link href={`/${normalized}/blog`} className="text-sm font-semibold text-brand-600">
                {ui.backToList}
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {article.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-brand-100 bg-white px-3 py-1 text-sm font-medium text-brand-700"
                  >
                    {category}
                  </span>
                ))}
                {article.contentMode === "fact-source" && (
                  <span className="rounded-full bg-brand-900 px-3 py-1 text-sm font-semibold text-white">
                    {ui.factSource}
                  </span>
                )}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
                {article.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{article.description}</p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-sm text-slate-500">{ui.articleUpdated}</dt>
                  <dd className="mt-2 text-sm font-semibold text-brand-900">{article.date}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-sm text-slate-500">{ui.readTime}</dt>
                  <dd className="mt-2 text-sm font-semibold text-brand-900">{article.readTime}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-sm text-slate-500">{ui.contentModeLabel}</dt>
                  <dd className="mt-2 text-sm font-semibold text-brand-900">
                    {article.contentMode === "fact-source" ? ui.factSource : article.contentMode || "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-brand-600">{ui.articleMetaTitle}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{article.description}</p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={quoteHref}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  {ui.jumpToQuote}
                </Link>
                <a
                  href="tel:400-869-9562"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-600 hover:text-brand-600"
                >
                  400-869-9562
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {article.coverImage && (
        <section className="mx-auto max-w-7xl px-5 pt-10 sm:pt-14">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={article.coverImage}
              alt={article.coverAlt || article.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </section>
      )}

      <ArticleReaderShell
        locale={normalized}
        slug={slug}
        quoteHref={quoteHref}
        article={{
          title: article.title,
          description: article.description,
          date: article.date,
          readTime: article.readTime,
          contentMode: article.contentMode,
          contentHtml: article.contentHtml,
          faq: article.faq,
          sections: article.sections,
        }}
        copy={{
          quickOverview: ui.quickOverview,
          articleUpdated: ui.articleUpdated,
          readTime: ui.readTime,
          contentModeLabel: ui.contentModeLabel,
          factSource: ui.factSource,
          articleOutline: ui.articleOutline,
          articleFaq: ui.articleFaq,
          jumpToQuote: ui.jumpToQuote,
          quoteCardButton: ui.quoteCardButton,
          quoteCardTitle: ui.quoteCardTitle,
          quoteCardText: ui.quoteCardText,
          callNow: ui.callNow,
          backToList: ui.backToList,
          relatedArticles: ui.relatedArticles,
          relatedDescription: ui.relatedDescription,
          closePreview: ui.closePreview,
          imagePreviewHint: ui.imagePreviewHint,
        }}
        related={related.map((item) => ({
          slug: item.slug,
          title: item.title,
          description: item.description,
          date: item.date,
          readTime: item.readTime,
          categories: item.categories,
          coverImage: item.coverImage,
          coverAlt: item.coverAlt,
        }))}
      />
    </>
  );
}
