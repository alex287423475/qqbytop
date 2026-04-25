import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/site-data";

export const siteBaseUrl = "https://qqbytop.com";
export const siteName = "北京全球博译翻译公司";
export const defaultOgImage = "/brand/qqby-og.svg";

export const siteKeywords = [
  "北京翻译公司",
  "全球博译",
  "证件翻译",
  "合同翻译",
  "法律翻译",
  "跨境电商翻译",
  "技术文档翻译",
  "专利翻译",
  "本地化翻译",
];

export function normalizeLocale(locale: string): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : "zh";
}

export function buildLocalizedPath(locale: string, path = "") {
  const normalized = normalizeLocale(locale);
  const cleanPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${normalized}${cleanPath}`;
}

export function absoluteUrl(path: string) {
  return `${siteBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildLanguageAlternates(path = "") {
  return {
    zh: absoluteUrl(buildLocalizedPath("zh", path)),
    "x-default": absoluteUrl(buildLocalizedPath("zh", path)),
  };
}

export function buildSeoMetadata({
  locale,
  path = "",
  title,
  description,
  keywords = [],
  image = defaultOgImage,
  type = "website",
  noIndex = false,
}: {
  locale: string;
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const normalized = normalizeLocale(locale);
  const canonicalPath = buildLocalizedPath(normalized, path);
  const canonical = absoluteUrl(canonicalPath);
  const imageUrl = absoluteUrl(image);
  const shouldIndex = normalized === "zh" && !noIndex;

  return {
    title,
    description,
    keywords: Array.from(new Set([...siteKeywords, ...keywords])).join(", "),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      type,
      locale: "zh_CN",
      siteName,
      title,
      description,
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteName} - ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: shouldIndex
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: true,
        },
  };
}
