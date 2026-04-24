import test from "node:test";
import assert from "node:assert/strict";

import { buildQuotePrefill, inferQuoteServiceType } from "../lib/quote-page.ts";

test("inferQuoteServiceType maps higher-risk categories to stronger defaults", () => {
  assert.equal(inferQuoteServiceType("法律合规"), "professional");
  assert.equal(inferQuoteServiceType("技术翻译"), "professional");
  assert.equal(inferQuoteServiceType("跨境电商"), "premium");
  assert.equal(inferQuoteServiceType("证件翻译"), "standard");
});

test("buildQuotePrefill carries blog source and category into zh defaults", () => {
  const prefill = buildQuotePrefill({
    locale: "zh",
    source: "blog",
    category: "法律合规",
  });

  assert.equal(prefill.serviceType, "professional");
  assert.equal(prefill.languagePair, "中 -> 英");
  assert.equal(prefill.fileFormat, "Word / PDF / PPT / Excel");
  assert.equal(prefill.panelEyebrow, "来自博客线索");
  assert.match(prefill.notes, /我从博客文章进入询价页/);
  assert.match(prefill.notes, /当前关注分类：法律合规/);
});
