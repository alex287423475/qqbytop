import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildBreadcrumbJsonLd, buildSeoMetadata, buildWebPageJsonLd } from "@/lib/seo";
import { diagnosticTools, type Locale } from "@/lib/site-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return buildSeoMetadata({
    locale,
    path: "/tools",
    title: "翻译与合规诊断工具",
    description: "全球博译诊断工具集合，提供跨境产品文案合规翻译诊断、Amazon Listing 翻译质量诊断、包装文案风险检查和海外商务第一印象诊断。",
    keywords: ["诊断工具", "Amazon Listing 翻译质量诊断", "跨境文案合规诊断", "包装文案风险检查", "翻译合规自测工具"],
  });
}

export default async function DiagnosticToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pageTitle = "诊断工具";
  const pageDescription = "把常见的翻译、合规和海外商务展示问题做成可直接使用的在线诊断工具。";
  const pageJsonLd = buildWebPageJsonLd({
    locale,
    path: "/tools",
    name: pageTitle,
    description: pageDescription,
    type: "CollectionPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    locale,
    items: [{ name: pageTitle, path: "/tools" }],
  });
  const toolListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "全球博译诊断工具",
    itemListElement: diagnosticTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      description: tool.summary,
      url: tool.externalHref || `https://qqbytop.com/${locale}${tool.href}`,
    })),
  };
  const primaryTools = diagnosticTools.filter((tool) => tool.priority === "primary");
  const secondaryTools = diagnosticTools.filter((tool) => tool.priority !== "primary");

  return (
    <>
      <JsonLd data={pageJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={toolListJsonLd} />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">翻译与合规诊断工具</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold text-brand-900">先筛查翻译和合规风险，再决定是否需要人工审校</h1>
              <p className="mt-5 max-w-2xl leading-8 text-slate-600">
                面向 Amazon Listing、Shopify 产品页、包装、说明书、独立站广告语和海外商务展示，先给出免费风险诊断，再把高意向需求导向人工翻译、合规审校和本地化改写服务。
              </p>
            </div>
            <div className="border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-brand-900">主力入口：跨境产品文案诊断</h2>
              <p className="mt-3 leading-7 text-slate-600">
                当前优先承接跨境电商和品牌出海场景：翻译腔、平台敏感词、功效声明、包装警示和转化表达会被拆成可跟进的风险报告。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-brand-600">主推工具</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-900">先从最容易成交的产品文案诊断开始</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              多个入口共用同一套诊断引擎，只是默认场景不同，方便分别承接 SEO 搜索词和客户真实问题。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {primaryTools.map((tool) => (
              <ToolCard key={tool.slug} locale={locale as Locale} tool={tool} prominent={tool.slug === "product-copy-compliance"} />
            ))}
          </div>

          <div className="mt-14 mb-8">
            <p className="text-sm font-semibold text-brand-600">辅助入口</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-900">补充承接商务形象和英文个人品牌需求</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {secondaryTools.map((tool) => (
              <ToolCard key={tool.slug} locale={locale as Locale} tool={tool} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ToolCard({ locale, tool, prominent = false }: { locale: Locale; tool: (typeof diagnosticTools)[number]; prominent?: boolean }) {
  const href = tool.externalHref || `/${locale}${tool.href}`;

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col border bg-white p-8 transition hover:border-brand-600 hover:shadow-lg ${
        prominent ? "border-brand-300 shadow-lg shadow-brand-100/60 md:col-span-2" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">{tool.badge}</span>
          <h2 className="mt-5 text-2xl font-bold text-brand-900">{tool.title}</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {tool.status === "available" ? "已上线" : "规划中"}
        </span>
      </div>
      <p className="mt-5 leading-7 text-slate-600">{tool.summary}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {tool.useCases.map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {item}
          </span>
        ))}
      </div>
      <p className="mt-auto border-t border-slate-100 pt-6 text-sm font-semibold text-brand-600 group-hover:text-brand-500">
        {tool.cta || "进入工具"}
      </p>
    </Link>
  );
}
