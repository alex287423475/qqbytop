import type { MetadataRoute } from "next";
import { getAllArticleSlugs } from "@/lib/articles";
import { industries, services } from "@/lib/site-data";

const baseUrl = "https://qqbytop.com";
const indexedLocales = ["zh"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/services", "/industries", "/about", "/pricing", "/quote", "/blog", "/search"];
  const servicePages = services.map((service) => `/services/${service.slug}`);
  const industryPages = industries.map((industry) => `/industries/${industry.slug}`);
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
    blogPages.map((entry) => ({
      url: `${baseUrl}/${entry.locale}${entry.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: 0.8,
    })),
  );
}
