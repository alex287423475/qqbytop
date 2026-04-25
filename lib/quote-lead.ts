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
  recommendedOpening: string;
  followUpFocus: string;
  recommendedOwner: string;
  ownerReason: string;
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

const COMPLIANCE_CATEGORIES = new Set([
  "法律翻译",
  "法律合规",
  "跨境合规",
]);

const DELIVERY_HEAVY_CATEGORIES = new Set([
  "技术翻译",
  "技术本地化",
  "专业翻译",
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

function getBlogOpening(category: string, isHighIntent: boolean) {
  if (category) {
    if (isHighIntent) {
      return `您好，看到您是从“${category}”相关文章进入询价页的，我先帮您确认文件类型、用途和交付时间，方便尽快给您更准确的建议和报价。`;
    }

    return `您好，看到您刚浏览了“${category}”相关内容，我这边先帮您快速判断一下是否需要专业翻译，以及大概的交付方式和报价区间。`;
  }

  return "您好，看到您是从博客内容进入询价页的，我先帮您确认一下文件类型、目标语种和使用场景，方便尽快给您建议。";
}

export function getQuoteFollowUpGuide({ source, category }: QuoteLeadContext) {
  const normalizedSource = normalizeSource(source);
  const normalizedCategory = normalizeCategory(category);
  const isHighIntentBlog = normalizedSource === "blog" && HIGH_INTENT_BLOG_CATEGORIES.has(normalizedCategory);

  switch (normalizedSource) {
    case "service":
      return {
        recommendedOpening:
          "您好，看到您是从服务页提交需求的，我先帮您确认一下文件类型、语种方向和交付时间，这样可以尽快给您准确报价。",
        followUpFocus: "优先确认文件类型、目标语种、用途、是否加急，以及客户最在意的是质量、时效还是保密要求。",
      };
    case "pricing":
      return {
        recommendedOpening:
          "您好，看到您在价格页提交了需求，我先帮您快速确认字数、文件格式和用途，这样可以更快给您对应的报价区间。",
        followUpFocus: "优先确认预算敏感度、稿件字数、是否需要盖章/认证、是否有历史参考译文，以及对交付周期的要求。",
      };
    case "industry":
      return {
        recommendedOpening:
          "您好，看到您是从行业方案页进入的，我先了解一下您的行业背景和文件场景，再给您匹配更合适的处理方式。",
        followUpFocus: "优先确认所属行业、文件应用场景、术语要求、是否涉及法规或合规审查，以及是否需要长期协作。",
      };
    case "direct":
    case "":
      return {
        recommendedOpening:
          "您好，已收到您的询价需求。我先帮您确认一下文件类型、语种和使用用途，方便尽快给您安排报价和交付建议。",
        followUpFocus: "优先确认项目范围、文件类型、使用国家/地区、时间要求，以及客户当前最急需解决的点。",
      };
    case "blog":
      return {
        recommendedOpening: getBlogOpening(normalizedCategory, isHighIntentBlog),
        followUpFocus: isHighIntentBlog
          ? "优先确认客户当前遇到的风险点、文件用途、是否已有现成材料，以及希望先解决报价、质量还是交付边界。"
          : "优先确认客户是在前期了解，还是已经准备提交文件；再确认文件类型、使用场景和是否需要先做样稿或初步判断。",
      };
    default:
      return {
        recommendedOpening:
          "您好，已收到您的询价信息。我先帮您确认一下文件类型、用途和交付时间，这样我们可以更快给到合适建议。",
        followUpFocus: "优先确认来源背景、文件类型、使用场景和时间要求，再决定由哪类顾问继续跟进。",
      };
  }
}

export function getQuoteOwnerRecommendation({ source, category }: QuoteLeadContext) {
  const normalizedSource = normalizeSource(source);
  const normalizedCategory = normalizeCategory(category);

  if (COMPLIANCE_CATEGORIES.has(normalizedCategory)) {
    return {
      recommendedOwner: "合规顾问优先",
      ownerReason: "当前分类涉及合规、法律或风险判断，先由合规顾问介入更容易快速识别边界和关键风险。",
    };
  }

  if (DELIVERY_HEAVY_CATEGORIES.has(normalizedCategory)) {
    return {
      recommendedOwner: "项目经理优先",
      ownerReason: "当前分类更依赖术语、流程和交付管理，先由项目经理确认范围和资源安排更稳妥。",
    };
  }

  switch (normalizedSource) {
    case "pricing":
    case "service":
      return {
        recommendedOwner: "销售顾问优先",
        ownerReason: "线索已接近报价或成交环节，先由销售顾问快速确认预算、时效和成交条件更合适。",
      };
    case "industry":
      return {
        recommendedOwner: "项目经理优先",
        ownerReason: "行业方案线索通常需要先判断场景、术语和交付要求，由项目经理承接更容易切入。",
      };
    case "direct":
    case "":
      return {
        recommendedOwner: "销售顾问优先",
        ownerReason: "直接询价通常购买意图更强，先由销售顾问接住线索，必要时再转项目经理或合规顾问。",
      };
    case "blog":
      return {
        recommendedOwner: "销售顾问优先",
        ownerReason: "博客线索需要先判断客户所处阶段和真实需求，先由销售顾问做初筛最有效率。",
      };
    default:
      return {
        recommendedOwner: "销售顾问优先",
        ownerReason: "来源未标准化，先由销售顾问完成初筛，再根据需求深度转交更合适的角色。",
      };
  }
}

export function assessQuoteLead(context: QuoteLeadContext): QuoteLeadAssessment {
  const sourceLabel = getQuoteSourceLabel(context.source);
  const leadGroup = getQuoteLeadGroup(context);
  const leadGroupBadge = getQuoteLeadGroupBadge(context);
  const leadTag = buildQuoteLeadTag(context);
  const { priorityLabel, followUpSuggestion, priorityReason } = getQuotePrioritySuggestion(context);
  const priorityBadge = getQuotePriorityBadge(priorityLabel);
  const { recommendedOpening, followUpFocus } = getQuoteFollowUpGuide(context);
  const { recommendedOwner, ownerReason } = getQuoteOwnerRecommendation(context);

  return {
    sourceLabel,
    leadGroup,
    leadGroupBadge,
    priorityLabel,
    priorityBadge,
    followUpSuggestion,
    priorityReason,
    recommendedOpening,
    followUpFocus,
    recommendedOwner,
    ownerReason,
    leadTag,
  };
}
