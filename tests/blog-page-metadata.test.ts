import test from "node:test";
import assert from "node:assert/strict";

import { buildBlogCollectionSummary, buildBlogHref, buildBlogPageMetadata } from "../lib/blog-page.ts";

test("buildBlogHref includes category and page query parameters only when needed", () => {
  assert.equal(buildBlogHref("zh", "all", 1), "/zh/blog");
  assert.equal(buildBlogHref("zh", "法律合规", 1), "/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84");
  assert.equal(buildBlogHref("zh", "all", 2), "/zh/blog?page=2");
  assert.equal(buildBlogHref("zh", "法律合规", 2), "/zh/blog?category=%E6%B3%95%E5%BE%8B%E5%90%88%E8%A7%84&page=2");
});

test("buildBlogCollectionSummary reports the current visible range", () => {
  assert.equal(buildBlogCollectionSummary("zh", 7, 12, 12), "显示第 7-12 篇，共 12 篇");
  assert.equal(buildBlogCollectionSummary("en", 1, 6, 12), "Showing 1-6 of 12 articles");
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
