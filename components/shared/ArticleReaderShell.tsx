"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ArticleFaq, ArticleSection } from "@/lib/articles";

type RelatedArticleCard = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  categories: string[];
  coverImage: string | null;
  coverAlt: string;
};

type ReaderCopy = {
  quickOverview: string;
  articleUpdated: string;
  readTime: string;
  contentModeLabel: string;
  factSource: string;
  articleOutline: string;
  articleFaq: string;
  jumpToQuote: string;
  quoteCardButton: string;
  quoteCardTitle: string;
  quoteCardText: string;
  callNow: string;
  backToList: string;
  relatedArticles: string;
  relatedDescription: string;
  closePreview: string;
  imagePreviewHint: string;
  openOutline: string;
  closeOutline: string;
  currentSectionLabel: string;
};

type ArticleReaderShellProps = {
  locale: string;
  slug: string;
  article: {
    title: string;
    description: string;
    date: string;
    readTime: string;
    contentMode: string;
    contentHtml: string;
    faq: ArticleFaq[];
    sections: ArticleSection[];
  };
  quoteHref: string;
  copy: ReaderCopy;
  related: RelatedArticleCard[];
};

type LightboxState = {
  src: string;
  alt: string;
};

function getImageTypeLabel(src: string, alt: string) {
  const target = `${src} ${alt}`.toLowerCase();

  if (target.includes("cover")) return "封面图";
  if (target.includes("evidence-chain")) return "证据链图";
  if (target.includes("risk-matrix")) return "风险矩阵图";
  if (target.includes("workflow-map")) return "流程图";
  if (target.includes("table") || target.includes("表")) return "对照图";

  return "示意图";
}

export function ArticleReaderShell({ locale, article, quoteHref, copy, related }: ArticleReaderShellProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState(article.sections[0]?.id ?? "");
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);

  const outlineItems = useMemo(() => article.sections.filter((section) => section.level === 2), [article.sections]);
  const hasOutline = outlineItems.length > 1;

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const images = Array.from(root.querySelectorAll("img"));
    images.forEach((image, index) => {
      image.classList.add("article-content-image");
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-label", `${copy.imagePreviewHint}: ${image.alt || article.title}`);

      if (image.dataset.captionReady === "true") return;
      image.dataset.captionReady = "true";

      const altText = image.alt?.trim();
      if (!altText) return;

      const caption = document.createElement("span");
      caption.className = "article-image-caption";
      caption.innerHTML = [
        `<span class="article-image-caption-label">图 ${index + 1} · ${getImageTypeLabel(image.currentSrc || image.src, altText)}</span>`,
        `<span class="article-image-caption-text">${altText}</span>`,
      ].join("");

      image.insertAdjacentElement("afterend", caption);
    });

    const handleClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!root.contains(target)) return;

      setLightbox({
        src: target.currentSrc || target.src,
        alt: target.alt || article.title,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!root.contains(target)) return;
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      setLightbox({
        src: target.currentSrc || target.src,
        alt: target.alt || article.title,
      });
    };

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);

    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
    };
  }, [article.title, copy.imagePreviewHint]);

  useEffect(() => {
    if (!hasOutline) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.2, 0.4, 0.7],
      },
    );

    const elements = article.sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [article.sections, hasOutline]);

  useEffect(() => {
    if (!mobileOutlineOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOutlineOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOutlineOpen]);

  useEffect(() => {
    if (!lightbox) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [lightbox]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-brand-600">摘要</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{article.description}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-600">{copy.quickOverview}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {hasOutline ? `共 ${outlineItems.length} 个主要章节，可在右侧目录中快速定位。` : copy.imagePreviewHint}
                  </p>
                </div>
              </div>

              <div
                ref={contentRef}
                className="prose-content mt-8"
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
              />
            </article>

            {article.faq.length > 0 && (
              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-brand-900">{copy.articleFaq}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {article.faq.length}
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {article.faq.map((item) => (
                    <details key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-brand-900">
                        {item.q}
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8 rounded-3xl bg-brand-900 p-6 text-white shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold text-brand-100">{copy.jumpToQuote}</p>
                  <h2 className="mt-2 text-2xl font-bold">{copy.quoteCardTitle}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{copy.quoteCardText}</p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <Link
                    href={quoteHref}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-100"
                  >
                    {copy.quoteCardButton}
                  </Link>
                  <a href="tel:400-869-9562" className="text-sm font-medium text-brand-100 transition hover:text-white">
                    {copy.callNow}: 400-869-9562
                  </a>
                </div>
              </div>
            </section>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-brand-900">{copy.quickOverview}</h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">{copy.articleUpdated}</dt>
                    <dd className="text-right font-medium text-brand-900">{article.date}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">{copy.readTime}</dt>
                    <dd className="text-right font-medium text-brand-900">{article.readTime}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">{copy.contentModeLabel}</dt>
                    <dd className="text-right font-medium text-brand-900">
                      {article.contentMode === "fact-source" ? copy.factSource : article.contentMode || "-"}
                    </dd>
                  </div>
                </dl>
              </section>

              {hasOutline && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-brand-900">{copy.articleOutline}</h2>
                  <nav className="mt-4">
                    <ul className="space-y-2">
                      {outlineItems.map((section) => {
                        const isActive = section.id === activeSection;
                        return (
                          <li key={section.id}>
                            <a
                              href={`#${section.id}`}
                              className={`block rounded-xl border px-3 py-2 text-sm leading-6 transition ${
                                isActive
                                  ? "border-brand-200 bg-brand-50 font-semibold text-brand-700"
                                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-brand-600"
                              } ${section.level === 3 ? "ml-4" : ""}`}
                            >
                              {section.title}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </section>
              )}

              <section className="rounded-3xl border border-brand-100 bg-brand-50/60 p-6 shadow-sm">
                <p className="text-sm font-semibold text-brand-600">{copy.jumpToQuote}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  继续沿着这篇文章的主题推进，我们会按当前分类预填询价上下文，减少来回沟通。
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href={quoteHref}
                    className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500"
                  >
                    {copy.quoteCardButton}
                  </Link>
                  <Link
                    href={`/${locale}/blog`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-600 hover:text-brand-600"
                  >
                    {copy.backToList}
                  </Link>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-brand-900">{copy.relatedArticles}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy.relatedDescription}</p>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${locale}/blog/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {item.coverImage && (
                    <div className="overflow-hidden border-b border-slate-200 bg-slate-100">
                      <img
                        src={item.coverImage}
                        alt={item.coverAlt || item.title}
                        className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.categories.slice(0, 2).map((category) => (
                        <span key={category} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          {category}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-brand-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                    <div className="mt-5 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{item.date}</span>
                      <span>{item.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasOutline && (
        <>
          <button
            type="button"
            className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-brand-800 lg:hidden"
            aria-expanded={mobileOutlineOpen}
            aria-controls="article-mobile-outline"
            onClick={() => setMobileOutlineOpen(true)}
          >
            <span>{copy.openOutline}</span>
            {activeSection && (
              <span className="max-w-[10rem] truncate rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-brand-100">
                {outlineItems.find((section) => section.id === activeSection)?.title ?? activeSection}
              </span>
            )}
          </button>

          {mobileOutlineOpen && (
            <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setMobileOutlineOpen(false)}>
              <div
                id="article-mobile-outline"
                className="absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border border-slate-200 bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label={copy.articleOutline}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-600">{copy.currentSectionLabel}</p>
                    <h2 className="mt-1 text-lg font-bold text-brand-900">
                      {outlineItems.find((section) => section.id === activeSection)?.title ?? copy.articleOutline}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-brand-700"
                    onClick={() => setMobileOutlineOpen(false)}
                  >
                    {copy.closeOutline}
                  </button>
                </div>

                <nav className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {outlineItems.map((section) => {
                      const isActive = section.id === activeSection;
                      return (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            className={`block rounded-2xl border px-4 py-3 text-sm leading-6 transition ${
                              isActive
                                ? "border-brand-200 bg-brand-50 font-semibold text-brand-700"
                                : "border-slate-200 text-slate-600 hover:border-brand-100 hover:bg-slate-50 hover:text-brand-600"
                            } ${section.level === 3 ? "ml-4" : ""}`}
                            onClick={() => setMobileOutlineOpen(false)}
                          >
                            {section.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            {copy.closePreview}
          </button>
          <div className="max-h-[90vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[82vh] w-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            />
            <p className="mt-3 text-center text-sm text-slate-200">{lightbox.alt}</p>
          </div>
        </div>
      )}
    </>
  );
}
