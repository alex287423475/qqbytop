import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export const articleLocales = ["zh", "en", "ja"] as const;
export type ArticleLocale = (typeof articleLocales)[number];

export type ArticleFaq = {
  q: string;
  a: string;
};

export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  locale: string;
  keywords: string[];
  readTime: string;
  faq: ArticleFaq[];
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

function parseArticleFile(filePath: string, locale: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fallbackSlug = path.basename(path.dirname(filePath));
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter((keyword): keyword is string => typeof keyword === "string" && keyword.trim().length > 0)
    : [];

  const meta: ArticleMeta = {
    title: typeof data.title === "string" ? data.title.trim() : "",
    slug: typeof data.slug === "string" ? data.slug.trim() : fallbackSlug,
    description: typeof data.description === "string" ? data.description.trim() : "",
    category: typeof data.category === "string" ? data.category.trim() : "",
    date: typeof data.date === "string" ? data.date.trim() : "",
    locale,
    keywords,
    readTime: estimateReadTime(content, locale),
    faq: normalizeFaq(data.faq),
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

  return {
    ...meta,
    contentHtml,
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
