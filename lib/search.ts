import { getAllArticles } from "@/lib/articles";
import { about, industries, pricing, services, type Locale } from "@/lib/site-data";

export type SearchResultType = "page" | "service" | "industry" | "article";

export type SearchResult = {
  type: SearchResultType;
  title: string;
  href: string;
  description: string;
  category: string;
  keywords: string[];
  score: number;
};

export const searchTypeLabels: Record<SearchResultType, string> = {
  page: "页面",
  service: "服务",
  industry: "行业",
  article: "文章",
};

function cleanText(value: unknown): string {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(cleanText).filter(Boolean).join(" ");
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalize(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(query: string) {
  const normalized = normalize(query);
  if (!normalized) return [];

  const tokens = normalized
    .split(/[\s,，;；|/]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.length > 0 ? Array.from(new Set(tokens)) : [normalized];
}

function buildSnippet(text: string, tokens: string[]) {
  const plain = cleanText(text);
  if (!plain) return "";
  if (tokens.length === 0) return plain.slice(0, 120);

  const lower = plain.toLowerCase();
  const firstIndex = tokens
    .map((token) => lower.indexOf(token))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (firstIndex === undefined) return plain.slice(0, 140);

  const start = Math.max(0, firstIndex - 48);
  const end = Math.min(plain.length, firstIndex + 120);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < plain.length ? "..." : "";

  return `${prefix}${plain.slice(start, end)}${suffix}`;
}

function scoreField(value: string, tokens: string[], weight: number) {
  const normalized = normalize(value);
  if (!normalized) return 0;

  return tokens.reduce((score, token) => {
    if (normalized === token) return score + weight * 3;
    if (normalized.startsWith(token)) return score + weight * 2;
    if (normalized.includes(token)) return score + weight;
    return score;
  }, 0);
}

function scoreResult(result: Omit<SearchResult, "score">, tokens: string[]) {
  return (
    scoreField(result.title, tokens, 12) +
    scoreField(result.category, tokens, 6) +
    scoreField(result.keywords.join(" "), tokens, 8) +
    scoreField(result.description, tokens, 4)
  );
}

function staticPages(locale: Locale): Omit<SearchResult, "score">[] {
  return [
    {
      type: "page",
      title: "首页",
      href: `/${locale}`,
      description: "北京全球博译翻译公司官网首页，查看专业翻译、本地化、跨境合规语言服务和询价入口。",
      category: "网站页面",
      keywords: ["翻译公司", "北京全球博译", "QQBY", "询价"],
    },
    {
      type: "page",
      title: "翻译服务",
      href: `/${locale}/services`,
      description: "浏览文档翻译、法律合规翻译、跨境电商翻译和技术本地化服务。",
      category: "网站页面",
      keywords: ["翻译服务", "服务项目", "报价"],
    },
    {
      type: "page",
      title: "行业方案",
      href: `/${locale}/industries`,
      description: "按法律、跨境电商、科技、制造等行业查看翻译解决方案。",
      category: "网站页面",
      keywords: ["行业方案", "解决方案", "翻译场景"],
    },
    {
      type: "page",
      title: "价格说明",
      href: `/${locale}/pricing`,
      description: cleanText(pricing.principles) || "查看翻译报价原则、服务级别和常见报价问题。",
      category: "网站页面",
      keywords: ["翻译价格", "报价", "费用"],
    },
    {
      type: "page",
      title: "关于我们",
      href: `/${locale}/about`,
      description: about.intro,
      category: "网站页面",
      keywords: ["关于", "资质", "质量承诺", "北京全球博译"],
    },
    {
      type: "page",
      title: "专业资讯",
      href: `/${locale}/blog`,
      description: "阅读翻译价格、证件翻译、法律翻译、跨境电商、技术本地化和核心事实源文章。",
      category: "网站页面",
      keywords: ["SEO文章", "专业资讯", "核心事实源"],
    },
    {
      type: "page",
      title: "提交询价",
      href: `/${locale}/quote`,
      description: "提交文件类型、用途、语种和交付时间，获取翻译报价建议。",
      category: "网站页面",
      keywords: ["询价", "报价", "联系"],
    },
  ];
}

export function buildSearchIndex(locale: Locale): Omit<SearchResult, "score">[] {
  const pageItems = staticPages(locale);
  const serviceItems = services.map((service) => ({
    type: "service" as const,
    title: service.title,
    href: `/${locale}/services/${service.slug}`,
    description: cleanText([service.summary, service.hero, service.price, service.scenarios, service.capabilities]),
    category: "翻译服务",
    keywords: [service.shortTitle, service.badge, ...service.scenarios],
  }));

  const industryItems = industries.map((industry) => ({
    type: "industry" as const,
    title: industry.title,
    href: `/${locale}/industries/${industry.slug}`,
    description: cleanText([industry.summary, industry.pain, industry.scenarios, industry.capabilities, industry.faq]),
    category: "行业方案",
    keywords: [industry.badge, ...industry.relatedServices],
  }));

  const articleItems = getAllArticles(locale).map((article) => ({
    type: "article" as const,
    title: article.title,
    href: `/${locale}/blog/${article.slug}`,
    description: cleanText([article.description, article.category, article.categories, article.keywords]),
    category: article.category || "专业资讯",
    keywords: article.keywords,
  }));

  return [...pageItems, ...serviceItems, ...industryItems, ...articleItems];
}

export function searchSite(locale: Locale, query: string, type?: string): SearchResult[] {
  const tokens = tokenize(query);
  const normalizedType = type && ["page", "service", "industry", "article"].includes(type) ? type : "all";
  const index = buildSearchIndex(locale).filter((item) => normalizedType === "all" || item.type === normalizedType);

  if (tokens.length === 0) {
    return index.slice(0, 12).map((item) => ({
      ...item,
      description: buildSnippet(item.description, tokens) || item.description,
      score: 0,
    }));
  }

  return index
    .map((item) => {
      const score = scoreResult(item, tokens);
      return {
        ...item,
        description: buildSnippet(item.description, tokens) || item.description,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-Hans-CN"))
    .slice(0, 50);
}
