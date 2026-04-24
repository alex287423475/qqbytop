import test from "node:test";
import assert from "node:assert/strict";

import { buildArticleListing, normalizeArticleCategories } from "../lib/article-listing.ts";

const sampleArticles = [
  { slug: "a", title: "A", description: "", date: "2026-04-06", category: "翻译价格", categories: ["翻译价格"] },
  { slug: "b", title: "B", description: "", date: "2026-04-05", category: "证件翻译", categories: ["证件翻译"] },
  { slug: "c", title: "C", description: "", date: "2026-04-04", category: "法律翻译", categories: ["法律翻译", "法律合规"] },
  { slug: "d", title: "D", description: "", date: "2026-04-03", category: "专业翻译", categories: ["专业翻译"] },
  { slug: "e", title: "E", description: "", date: "2026-04-02", category: "跨境电商", categories: ["跨境电商"] },
  { slug: "f", title: "F", description: "", date: "2026-04-01", category: "法律翻译", categories: ["法律翻译"] },
  { slug: "g", title: "G", description: "", date: "2026-03-31", category: "法律合规", categories: ["法律合规"] },
  { slug: "h", title: "H", description: "", date: "2026-03-30", category: "技术翻译", categories: ["技术翻译"] },
];

test("normalizeArticleCategories keeps unique ordered categories", () => {
  assert.deepEqual(normalizeArticleCategories("翻译价格"), ["翻译价格"]);
  assert.deepEqual(normalizeArticleCategories(["法律翻译", "法律合规", "法律翻译"]), ["法律翻译", "法律合规"]);
  assert.deepEqual(normalizeArticleCategories(undefined), []);
});

test("buildArticleListing paginates all articles by 6 per page", () => {
  const listing = buildArticleListing(sampleArticles, { page: "2", pageSize: 6 });

  assert.equal(listing.pagination.page, 2);
  assert.equal(listing.pagination.totalPages, 2);
  assert.equal(listing.pagination.totalItems, 8);
  assert.deepEqual(
    listing.articles.map((article) => article.slug),
    ["g", "h"],
  );
});

test("buildArticleListing filters by category and clamps invalid pages", () => {
  const listing = buildArticleListing(sampleArticles, { category: "法律翻译", page: "99", pageSize: 6 });

  assert.equal(listing.activeCategory, "法律翻译");
  assert.equal(listing.pagination.page, 1);
  assert.equal(listing.pagination.totalPages, 1);
  assert.deepEqual(
    listing.articles.map((article) => article.slug),
    ["c", "f"],
  );
});

test("buildArticleListing exposes category facets with counts in preferred order", () => {
  const listing = buildArticleListing(sampleArticles, {});

  assert.deepEqual(listing.facets.slice(0, 6), [
    { label: "全部", value: "all", count: 8 },
    { label: "翻译价格", value: "翻译价格", count: 1 },
    { label: "证件翻译", value: "证件翻译", count: 1 },
    { label: "法律翻译", value: "法律翻译", count: 2 },
    { label: "专业翻译", value: "专业翻译", count: 1 },
    { label: "跨境电商", value: "跨境电商", count: 1 },
  ]);
  assert.equal(listing.facets.find((facet) => facet.value === "法律合规")?.count, 2);
  assert.equal(listing.facets.at(-1)?.value, "技术翻译");
});
