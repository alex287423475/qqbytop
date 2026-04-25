import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { normalizeArticleCategories } from "@/lib/article-listing";

export const articleLocales = ["zh", "en", "ja"] as const;
export type ArticleLocale = (typeof articleLocales)[number];

export type ArticleFaq = {
  q: string;
  a: string;
};

export type ArticleSection = {
  id: string;
  title: string;
  level: 2 | 3;
};

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  category: string;
  categories: string[];
  contentMode: string;
  date: string;
  locale: string;
  keywords: string[];
  readTime: string;
  faq: ArticleFaq[];
  images: string[];
  coverImage: string | null;
  coverAlt: string;
  sections: ArticleSection[];
};

export type Article = ArticleMeta & {
  contentHtml: string;
};

const articlesRoot = path.join(process.cwd(), "content", "articles");

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "details",
    "summary",
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), ["target"], ["rel"]],
    td: [...(defaultSchema.attributes?.td ?? []), ["colspan"], ["rowspan"]],
    th: [...(defaultSchema.attributes?.th ?? []), ["colspan"], ["rowspan"]],
  },
} as Parameters<typeof rehypeSanitize>[0];

function getLocaleDir(locale: string) {
  return path.join(articlesRoot, locale);
}

function estimateReadTime(content: string, locale: string) {
  if (locale === "zh") {
    const count = content.replace(/\s/g, "").length;
    return `${Math.max(1, Math.ceil(count / 400))} 分钟`;
  }

  const count = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(count / 200))} min`;
}

function normalizeFaq(value: unknown): ArticleFaq[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      q: typeof item.q === "string" ? item.q.trim() : "",
      a: typeof item.a === "string" ? item.a.trim() : "",
    }))
    .filter((item) => item.q && item.a);
}

function extractImageUrls(content: string) {
  return [...content.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)]
    .map((match) => match[1]?.trim())
    .filter((src): src is string => Boolean(src && src.startsWith("/")));
}

function stripHtml(input: string) {
  return input
    .replace(/<code[^>]*>.*?<\/code>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function attachHeadingAnchors(contentHtml: string) {
  const sections: ArticleSection[] = [];

  const html = contentHtml.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (match, level, inner) => {
    const title = stripHtml(inner);
    if (!title) return match;

    const numericLevel = Number(level) as 2 | 3;
    const id = `section-${sections.length + 1}`;
    sections.push({
      id,
      title,
      level: numericLevel,
    });

    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  return { contentHtml: html, sections };
}

function parseArticleFile(filePath: string, locale: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fallbackSlug = path.basename(path.dirname(filePath));
  const categories = normalizeArticleCategories(data.category);
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter((keyword): keyword is string => typeof keyword === "string" && keyword.trim().length > 0)
    : [];

  const meta: ArticleMeta = {
    title: typeof data.title === "string" ? data.title.trim() : "",
    slug: typeof data.slug === "string" ? data.slug.trim() : fallbackSlug,
    description: typeof data.description === "string" ? data.description.trim() : "",
    category: categories[0] || "",
    categories,
    contentMode: typeof data.contentMode === "string" ? data.contentMode.trim() : "",
    date: typeof data.date === "string" ? data.date.trim() : "",
    locale,
    keywords,
    readTime: estimateReadTime(content, locale),
    faq: normalizeFaq(data.faq),
    coverImage: typeof data.coverImage === "string" && data.coverImage.startsWith("/") ? data.coverImage : null,
    coverAlt: typeof data.coverAlt === "string" ? data.coverAlt : "",
    sections: [],
    images: Array.from(
      new Set([
        ...(typeof data.coverImage === "string" && data.coverImage.startsWith("/") ? [data.coverImage] : []),
        ...extractImageUrls(content),
      ]),
    ),
  };

  return { meta, content };
}

export function getAllArticles(locale: string): ArticleMeta[] {
  const localeDir = getLocaleDir(locale);
  if (!fs.existsSync(localeDir)) return [];

  return fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = path.join(localeDir, entry.name, "index.md");
      if (!fs.existsSync(filePath)) return null;
      return parseArticleFile(filePath, locale).meta;
    })
    .filter((article): article is ArticleMeta => article !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getArticle(locale: string, slug: string): Promise<Article | null> {
  const filePath = path.join(getLocaleDir(locale), slug, "index.md");
  if (!fs.existsSync(filePath)) return null;

  const { meta, content } = parseArticleFile(filePath, locale);
  const contentHtml = String(
    await remark()
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeStringify)
      .process(content),
  );
  const withAnchors = attachHeadingAnchors(contentHtml);

  return {
    ...meta,
    contentHtml: withAnchors.contentHtml,
    sections: withAnchors.sections,
  };
}

export function getAllArticleSlugs() {
  return articleLocales.flatMap((locale) =>
    getAllArticles(locale).map((article) => ({
      locale,
      slug: article.slug,
    })),
  );
}
