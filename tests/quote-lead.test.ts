import test from "node:test";
import assert from "node:assert/strict";

import { buildQuoteLeadTag, getQuoteSourceLabel } from "../lib/quote-lead.ts";

test("getQuoteSourceLabel maps known sources to readable labels", () => {
  assert.equal(getQuoteSourceLabel("blog"), "博客内容入口");
  assert.equal(getQuoteSourceLabel("pricing"), "价格页入口");
  assert.equal(getQuoteSourceLabel(""), "直接访问");
  assert.equal(getQuoteSourceLabel("custom"), "其他来源：custom");
});

test("buildQuoteLeadTag combines source and category", () => {
  assert.equal(buildQuoteLeadTag({ source: "blog", category: "法律合规" }), "博客内容入口 / 法律合规");
  assert.equal(buildQuoteLeadTag({ source: "pricing", category: "" }), "价格页入口");
});
