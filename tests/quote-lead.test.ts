import test from "node:test";
import assert from "node:assert/strict";

import {
  assessQuoteLead,
  buildQuoteLeadTag,
  getQuoteLeadGroup,
  getQuoteLeadGroupBadge,
  getQuotePriorityBadge,
  getQuotePrioritySuggestion,
  getQuoteSourceLabel,
} from "../lib/quote-lead.ts";

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

test("getQuoteLeadGroup separates leads by source", () => {
  assert.equal(getQuoteLeadGroup({ source: "blog", category: "" }), "博客线索");
  assert.equal(getQuoteLeadGroup({ source: "service", category: "" }), "服务页线索");
  assert.equal(getQuoteLeadGroup({ source: "direct", category: "" }), "直接询价线索");
  assert.equal(getQuoteLeadGroupBadge({ source: "blog", category: "" }), "📝");
  assert.equal(getQuoteLeadGroupBadge({ source: "pricing", category: "" }), "💰");
});

test("getQuotePrioritySuggestion upgrades high intent blog categories", () => {
  const highIntent = getQuotePrioritySuggestion({
    source: "blog",
    category: "法律合规",
  });
  const standard = getQuotePrioritySuggestion({
    source: "blog",
    category: "证件翻译",
  });

  assert.equal(highIntent.priorityLabel, "中高优先级");
  assert.equal(highIntent.followUpSuggestion, "建议 30 分钟内首次跟进");
  assert.match(highIntent.priorityReason, /高决策成本或高风险分类/);

  assert.equal(standard.priorityLabel, "常规优先级");
  assert.equal(standard.followUpSuggestion, "建议 2 小时内首次跟进");
});

test("assessQuoteLead returns a full lead operation summary", () => {
  const assessment = assessQuoteLead({
    source: "service",
    category: "技术翻译",
  });

  assert.deepEqual(assessment, {
    sourceLabel: "服务页入口",
    leadGroup: "服务页线索",
    leadGroupBadge: "🧩",
    priorityLabel: "高优先级",
    priorityBadge: "🔥",
    followUpSuggestion: "建议 10 分钟内首次跟进",
    priorityReason: "来自服务页入口，购买意图明确，通常已在比较交付能力与响应速度。",
    leadTag: "服务页入口 / 技术翻译",
  });
});

test("getQuotePriorityBadge maps priority labels to visual markers", () => {
  assert.equal(getQuotePriorityBadge("高优先级"), "🔥");
  assert.equal(getQuotePriorityBadge("中高优先级"), "🟡");
  assert.equal(getQuotePriorityBadge("常规优先级"), "⚪");
});
