import type { MetadataRoute } from "next";
import { getAllArticles, getAllArticleSlugs } from "@/lib/articles";
import { diagnosticTools, industries, services } from "@/lib/site-data";

const baseUrl = "https://www.qqbytop.com";
const indexedLocales = ["zh"] as const;

function parseLastModified(date: string | undefined) {
  if (!date) return new Date();
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/services", "/industries", "/tools", "/about", "/pricing", "/quote", "/blog"];
  const toolPages = diagnosticTools.map((tool) => tool.href);
  const servicePages = services.map((service) => `/services/${service.slug}`);
  const industryPages = industries.map((industry) => `/industries/${industry.slug}`);
  const articleDateMap = new Map(getAllArticles("zh").map((article) => [article.slug, article.date]));
  const blogPages = getAllArticleSlugs()
    .filter((article) => indexedLocales.includes(article.locale as (typeof indexedLocales)[number]))
    .map((article) => ({
      locale: article.locale,
      path: `/blog/${article.slug}`,
    }));

  const genericEntries = [...staticPages, ...servicePages, ...industryPages];

  return genericEntries.flatMap((path) =>
    indexedLocales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: (path === "" ? "weekly" : "monthly") as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: path === "" ? 1 : path.startsWith("/services") ? 0.9 : 0.7,
    })),
  ).concat(
    toolPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: 0.8,
    })),
    blogPages.map((entry) => ({
      url: `${baseUrl}/${entry.locale}${entry.path}`,
      lastModified: parseLastModified(articleDateMap.get(entry.path.replace("/blog/", ""))),
      changeFrequency: "weekly" as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: 0.8,
    })),
  );
}
