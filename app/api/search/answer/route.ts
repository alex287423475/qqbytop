import { NextRequest, NextResponse } from "next/server";
import { callConfiguredModel } from "@/lib/ai-runtime";
import { searchSite, searchTypeLabels, type SearchResult } from "@/lib/search";
import { locales, type Locale } from "@/lib/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchAnswerInput = {
  query?: string;
  locale?: string;
  type?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SearchAnswerInput;
  const query = String(body.query || "").trim();
  const locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : "zh";
  const type = typeof body.type === "string" ? body.type : "all";

  if (!query) {
    return NextResponse.json({ message: "请输入搜索问题。" }, { status: 400 });
  }

  const results = searchSite(locale, query, type).slice(0, 6);
  if (results.length === 0) {
    return NextResponse.json({
      answer: "我没有在站内内容里找到足够匹配的资料。建议换成更短的关键词，或直接提交询价，让我们按文件类型、用途和交付时间判断服务路径。",
      sources: [],
      provider: "none",
      model: "none",
      degraded: true,
    });
  }

  const fallback = () => buildFallbackAnswer(query, results);
  const context = results.map(formatResultForPrompt).join("\n\n");
  const system = [
    "你是北京全球博译翻译公司网站的站内搜索助手。",
    "你只能基于提供的站内搜索结果回答，不要编造站外信息、价格承诺或保证性结论。",
    "回答要简洁、务实，优先告诉客户应确认哪些事项、适合看哪些页面、何时应该提交询价。",
    "不要输出 Markdown 链接，不要把 URL 写进正文；推荐页面会由界面单独展示。",
    "必须使用中文回答。输出 2-4 个短段落或项目符号。",
  ].join("\n");
  const user = [`客户问题：${query}`, "站内搜索结果：", context, "请基于以上结果给出答案，并在最后提醒用户可点击下方推荐页面继续查看。"].join("\n\n");

  try {
    const answer = await callConfiguredModel("modelC", system, user, {
      temperature: 0.2,
      maxTokens: 700,
      fallback,
    });

    return NextResponse.json({
      answer: answer.content || fallback(),
      sources: results.map(toSource),
      provider: answer.provider,
      model: answer.model,
      degraded: answer.provider === "mock" || !answer.content,
    });
  } catch (error) {
    return NextResponse.json({
      answer: fallback(),
      sources: results.map(toSource),
      provider: "fallback",
      model: "fallback",
      degraded: true,
      message: error instanceof Error ? error.message : "AI answer failed.",
    });
  }
}

function formatResultForPrompt(result: SearchResult, index: number) {
  return [
    `【资料 ${index + 1}】`,
    `类型：${searchTypeLabels[result.type]}`,
    `标题：${result.title}`,
    `分类：${result.category}`,
    `链接：${result.href}`,
    `摘要：${result.description}`,
    result.keywords.length ? `关键词：${result.keywords.slice(0, 8).join("、")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toSource(result: SearchResult) {
  return {
    type: result.type,
    typeLabel: searchTypeLabels[result.type],
    title: result.title,
    href: result.href,
    category: result.category,
    description: result.description,
  };
}

function buildFallbackAnswer(query: string, results: SearchResult[]) {
  const top = results[0];
  const service = results.find((result) => result.type === "service");
  const article = results.find((result) => result.type === "article");
  const quoteHint = query.includes("报价") || query.includes("多少钱") || query.includes("价格") ? "如果你已经有文件或字数，建议直接提交询价，报价会比通用说明更准确。" : "如果涉及具体接收机构、文件用途或紧急交付，建议提交询价让项目团队判断。";

  return [
    `根据站内内容，“${query}”最相关的是《${top.title}》。你可以先从用途、语种、文件格式、是否需要盖章或合规审校这几个点判断需求。`,
    service ? `如果你要找服务入口，优先查看《${service.title}》，它更适合了解交付范围、流程和报价口径。` : "",
    article ? `如果你想先了解注意事项，可以继续阅读《${article.title}》，再决定是否提交文件评估。` : "",
    quoteHint,
  ]
    .filter(Boolean)
    .join("\n\n");
}
