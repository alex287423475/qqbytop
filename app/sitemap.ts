import type { MetadataRoute } from "next";
import { industries, posts, services } from "@/lib/site-data";

const baseUrl = "https://qqbytop.com";
const indexedLocales = ["zh"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/services", "/industries", "/about", "/pricing", "/quote", "/blog"];
  const servicePages = services.map((service) => `/services/${service.slug}`);
  const industryPages = industries.map((industry) => `/industries/${industry.slug}`);
  const blogPages = posts.map((post) => `/blog/${post.slug}`);

  return [...staticPages, ...servicePages, ...industryPages, ...blogPages].flatMap((path) =>
    indexedLocales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : path.startsWith("/services") ? 0.9 : 0.7,
    })),
  );
}
