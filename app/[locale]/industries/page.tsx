import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { buildSeoMetadata } from "@/lib/seo";
import { industries, type Locale } from "@/lib/site-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return buildSeoMetadata({
    locale,
    path: "/industries",
    title: "行业翻译方案",
    description: "北京全球博译行业翻译方案：法律、跨境电商、科技、制造业等行业的专业翻译、本地化与合规交付方案。",
    keywords: industries.flatMap((industry) => [industry.title, industry.badge]),
  });
}

const industryMethod = [
  ["行业风险", "先判断文件会影响审批、交易、平台审核还是现场执行。"],
  ["材料链路", "把合同、证据、说明书、认证报告、界面文案放到同一交付逻辑里处理。"],
  ["复用资产", "为长期项目沉淀术语库、风格指南、QA规则和批量交付模板。"],
];

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pageUrl = `https://qqbytop.com/${locale}/industries`;
  const industryListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#industry-list`,
    name: "北京全球博译行业翻译方案",
    itemListElement: industries.map((industry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${pageUrl}/${industry.slug}`,
      name: industry.title,
      description: industry.summary,
    })),
  };

  return (
    <>
      <JsonLd data={industryListJsonLd} />
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">行业方案</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold text-brand-900">不同行业的翻译需求，不能用同一套方法处理</h1>
              <p className="mt-5 max-w-2xl leading-8 text-slate-600">我们按行业配置译员、术语库、审校规则和交付模板，让译文能被平台、机构、客户或现场团队真正使用。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {industryMethod.map(([title, text]) => (
                <div key={title} className="border border-slate-200 bg-white p-4">
                  <h2 className="font-bold text-brand-900">{title}</h2>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="按行业风险进入方案" subtitle="行业页重点说明高频材料、常见风险、交付标准和可关联的服务模块。" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {industries.map((industry) => (
              <Link key={industry.slug} href={`/${locale}/industries/${industry.slug}`} className="group flex h-full flex-col border border-slate-200 bg-white p-8 transition hover:border-brand-600 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-brand-600">{industry.badge}</span>
                    <h2 className="mt-4 text-2xl font-bold text-brand-900">{industry.title}</h2>
                  </div>
                  <span className="text-sm font-semibold text-brand-600 group-hover:text-brand-500">查看</span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{industry.summary}</p>
                <div className="mt-6 border-l-4 border-accent-600 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-brand-900">核心风险</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{industry.pain}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {industry.scenarios.map((item) => (
                    <span key={item.title} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.title}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="行业方案不是模板页" subtitle="我们把行业需求拆成风险判断、材料清单、术语资产和验收标准，方便长期项目复用。" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["材料清单", "先列出同一业务链路下常见文件，避免只翻译单份材料却漏掉配套证据。"],
              ["术语与禁用词", "把产品、法规、平台规则和客户内部叫法沉淀成可复用资产。"],
              ["验收口径", "明确格式、数字、术语、图表、标签、盖章和提交版本的检查标准。"],
            ].map(([title, text]) => (
              <div key={title} className="border border-slate-200 bg-white p-6">
                <h2 className="font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} title="没有看到你的行业？" subtitle="金融、医疗、能源、教育、游戏等行业也可以按项目定制行业术语和交付流程。" />
    </>
  );
}
