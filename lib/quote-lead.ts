export type QuoteLeadContext = {
  source: string;
  category: string;
};

function clean(value: string) {
  return value.trim();
}

export function getQuoteSourceLabel(source: string) {
  const normalized = clean(source).toLowerCase();

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
      return source ? `其他来源：${source}` : "直接访问";
  }
}

export function buildQuoteLeadTag({ source, category }: QuoteLeadContext) {
  const sourceLabel = getQuoteSourceLabel(source);
  const normalizedCategory = clean(category);

  if (normalizedCategory) {
    return `${sourceLabel} / ${normalizedCategory}`;
  }

  return sourceLabel;
}
