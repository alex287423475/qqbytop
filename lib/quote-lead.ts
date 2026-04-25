export type QuoteLeadContext = {
  source: string;
  category: string;
};

export type QuoteLeadAssessment = {
  sourceLabel: string;
  leadGroup: string;
  leadGroupBadge: string;
  priorityLabel: string;
  priorityBadge: string;
  followUpSuggestion: string;
  priorityReason: string;
  leadTag: string;
};

const HIGH_INTENT_BLOG_CATEGORIES = new Set([
  "翻译价格",
  "法律翻译",
  "法律合规",
  "技术翻译",
  "技术本地化",
  "跨境合规",
  "跨境电商",
]);

function clean(value: string) {
  return value.trim();
}

function normalizeSource(source: string) {
  return clean(source).toLowerCase();
}

function normalizeCategory(category: string) {
  return clean(category);
}

export function getQuoteSourceLabel(source: string) {
  const normalized = normalizeSource(source);

  switch (normalized) {
    case "blog":
      return "博客内容入口";
    case "pricing":
      return "价格页入口";
    case "service":
      return "服务页入口";
    case "industry":
      return "行业方案入口";
    case "direct":
    case "":
      return "直接访问";
    default:
      return source ? `其他来源：${clean(source)}` : "直接访问";
  }
}

export function getQuoteLeadGroup({ source }: QuoteLeadContext) {
  const normalized = normalizeSource(source);

  switch (normalized) {
    case "blog":
      return "博客线索";
    case "service":
      return "服务页线索";
    case "pricing":
      return "价格页线索";
    case "industry":
      return "行业方案线索";
    case "direct":
    case "":
      return "直接询价线索";
    default:
      return "其他来源线索";
  }
}

export function getQuoteLeadGroupBadge({ source }: QuoteLeadContext) {
  const normalized = normalizeSource(source);

  switch (normalized) {
    case "blog":
      return "📝";
    case "service":
      return "🧩";
    case "pricing":
      return "💰";
    case "industry":
      return "🏭";
    case "direct":
    case "":
      return "📞";
    default:
      return "📌";
  }
}

export function buildQuoteLeadTag({ source, category }: QuoteLeadContext) {
  const sourceLabel = getQuoteSourceLabel(source);
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory) {
    return `${sourceLabel} / ${normalizedCategory}`;
  }

  return sourceLabel;
}

export function getQuotePrioritySuggestion({ source, category }: QuoteLeadContext) {
  const normalizedSource = normalizeSource(source);
  const normalizedCategory = normalizeCategory(category);

  switch (normalizedSource) {
    case "service":
      return {
        priorityLabel: "高优先级",
        followUpSuggestion: "建议 10 分钟内首次跟进",
        priorityReason: "来自服务页入口，购买意图明确，通常已在比较交付能力与响应速度。",
      };
    case "pricing":
      return {
        priorityLabel: "高优先级",
        followUpSuggestion: "建议 10 分钟内首次跟进",
        priorityReason: "来自价格页入口，通常已进入预算确认或比价阶段，及时响应更容易促成转化。",
      };
    case "industry":
      return {
        priorityLabel: "中高优先级",
        followUpSuggestion: "建议 20 分钟内首次跟进",
        priorityReason: "来自行业方案入口，场景较明确，适合尽快确认行业背景、文件类型与交付标准。",
      };
    case "direct":
    case "":
      return {
        priorityLabel: "中高优先级",
        followUpSuggestion: "建议 20 分钟内首次跟进",
        priorityReason: "用户直接进入询价页，转化意图较强，建议优先确认项目范围和时间要求。",
      };
    case "blog":
      if (HIGH_INTENT_BLOG_CATEGORIES.has(normalizedCategory)) {
        return {
          priorityLabel: "中高优先级",
          followUpSuggestion: "建议 30 分钟内首次跟进",
          priorityReason: "来自高决策成本或高风险分类内容，用户通常已在评估专业能力和交付边界。",
        };
      }

      return {
        priorityLabel: "常规优先级",
        followUpSuggestion: "建议 2 小时内首次跟进",
        priorityReason: "来自内容阅读入口，建议先确认真实需求、文件类型和是否已进入采购阶段。",
      };
    default:
      return {
        priorityLabel: "常规优先级",
        followUpSuggestion: "建议 2 小时内首次跟进",
        priorityReason: "来源未标准化，建议先确认线索背景，再安排对应服务顾问跟进。",
      };
  }
}

export function getQuotePriorityBadge(priorityLabel: string) {
  switch (priorityLabel) {
    case "高优先级":
      return "🔥";
    case "中高优先级":
      return "🟡";
    case "常规优先级":
      return "⚪";
    default:
      return "📍";
  }
}

export function assessQuoteLead(context: QuoteLeadContext): QuoteLeadAssessment {
  const sourceLabel = getQuoteSourceLabel(context.source);
  const leadGroup = getQuoteLeadGroup(context);
  const leadGroupBadge = getQuoteLeadGroupBadge(context);
  const leadTag = buildQuoteLeadTag(context);
  const { priorityLabel, followUpSuggestion, priorityReason } = getQuotePrioritySuggestion(context);
  const priorityBadge = getQuotePriorityBadge(priorityLabel);

  return {
    sourceLabel,
    leadGroup,
    leadGroupBadge,
    priorityLabel,
    priorityBadge,
    followUpSuggestion,
    priorityReason,
    leadTag,
  };
}
