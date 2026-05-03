import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildBreadcrumbJsonLd, buildSeoMetadata, buildWebPageJsonLd } from "@/lib/seo";
import { diagnosticTools, type Locale } from "@/lib/site-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return buildSeoMetadata({
    locale,
    path: "/tools",
    title: "诊断工具",
    description: "全球博译诊断工具集合，提供海外商务第一印象诊断、商务形象优化和后续更多翻译与合规自测工具。",
    keywords: ["诊断工具", "商务形象诊断", "海外商务第一印象诊断", "翻译合规自测工具"],
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
      url: `https://qqbytop.com/${locale}${tool.href}`,
    })),
  };

  return (
    <>
      <JsonLd data={pageJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={toolListJsonLd} />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">诊断工具</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold text-brand-900">先诊断问题，再决定是否需要人工服务</h1>
              <p className="mt-5 max-w-2xl leading-8 text-slate-600">
                这里会逐步收录适合客户自助使用的诊断工具，用来筛查海外商务展示、翻译交付和合规沟通中的高频问题。
              </p>
            </div>
            <div className="border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-brand-900">工具库会持续扩展</h2>
              <p className="mt-3 leading-7 text-slate-600">
                当前先上线第一印象诊断。后续可以继续补充合同翻译风险自测、跨境电商 Listing 合规检查、证件翻译材料清单等工具。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-6 md:grid-cols-2">
            {diagnosticTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/${locale}${tool.href}`}
                className="group flex h-full flex-col border border-slate-200 bg-white p-8 transition hover:border-brand-600 hover:shadow-lg"
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
                <p className="mt-auto border-t border-slate-100 pt-6 text-sm font-semibold text-brand-600 group-hover:text-brand-500">进入工具</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
