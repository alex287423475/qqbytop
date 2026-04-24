import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBlogBreadcrumbSchema,
  buildBlogCollectionSchema,
  buildBlogCollectionSummary,
  buildBlogCurrentRange,
  buildBlogHref,
  buildBlogPageMetadata,
} from "../lib/blog-page.ts";

test("buildBlogHref includes category and page query parameters only when needed", () => {
  assert.equal(buildBlogHref("zh", "all", 1), "/zh/blog");
  assert.equal(buildBlogHref("zh", "法律合规", 1), "/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84");
  assert.equal(buildBlogHref("zh", "all", 2), "/zh/blog?page=2");
  assert.equal(buildBlogHref("zh", "法律合规", 2), "/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84&page=2");
});

test("buildBlogCollectionSummary and current range are localized", () => {
  assert.equal(buildBlogCollectionSummary("zh", 7, 12, 12), "显示第 7-12 篇，共 12 篇");
  assert.equal(buildBlogCollectionSummary("en", 1, 6, 12), "Showing 1-6 of 12 articles");
  assert.equal(buildBlogCollectionSummary("ja", 1, 6, 12), "12 件中 1-6 件を表示");
  assert.equal(buildBlogCurrentRange("zh", 7, 12, 12), "当前显示 7-12 / 12");
  assert.equal(buildBlogCurrentRange("en", 7, 12, 12), "Currently showing 7-12 / 12");
});

test("buildBlogPageMetadata includes canonical and category-aware title", () => {
  const metadata = buildBlogPageMetadata({
    locale: "zh",
    category: "法律合规",
    page: 2,
  });

  assert.equal(metadata.title, "法律合规相关文章 - 第 2 页 | QQBY 专业资讯");
  assert.equal(metadata.description, "查看 QQBY 在法律合规分类下的专业资讯文章，第 2 页。");
  assert.equal(metadata.alternates?.canonical, "/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84&page=2");
  assert.equal(metadata.openGraph?.url, "/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84&page=2");
});

test("buildBlogCollectionSchema creates a collection page item list", () => {
  const schema = buildBlogCollectionSchema({
    locale: "zh",
    category: "法律合规",
    page: 1,
    startItem: 1,
    totalItems: 2,
    articles: [
      {
        title: "涉外合同翻译最常见的五个风险",
        slug: "contract-translation-risks",
        description: "",
        category: "法律合规",
        categories: ["法律合规"],
        date: "2026-04-16",
        locale: "zh",
        keywords: [],
        readTime: "6 分钟",
        faq: [],
        images: [],
        coverImage: null,
        coverAlt: "",
      },
    ],
  });

  assert.equal(schema["@type"], "CollectionPage");
  assert.equal(schema.mainEntity["@type"], "ItemList");
  assert.equal(schema.mainEntity.itemListElement[0].position, 1);
  assert.equal(schema.mainEntity.itemListElement[0].url, "https://qqbytop.com/zh/blog/contract-translation-risks");
});

test("buildBlogBreadcrumbSchema includes home, blog, and active category", () => {
  const schema = buildBlogBreadcrumbSchema({
    locale: "zh",
    category: "法律合规",
    page: 1,
  });

  assert.equal(schema["@type"], "BreadcrumbList");
  assert.equal(schema.itemListElement.length, 3);
  assert.equal(schema.itemListElement[2].name, "法律合规");
  assert.equal(schema.itemListElement[2].item, "https://qqbytop.com/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84");
});
