import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { pricing, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "价格说明",
  description: "QQBY 翻译服务价格说明：服务级别、语种系数、紧急通道、格式处理和报价原则。",
};

const priceFactors = [
  ["文件用途", "内部阅读、机构提交、平台申诉、法律审阅、对外发布对应不同审校深度。"],
  ["语种方向", "中英互译、中日/中韩、欧洲语种和小语种的译员成本不同。"],
  ["专业难度", "法律、专利、医学、技术、金融等文件需要专业译员或行业审校。"],
  ["格式复杂度", "扫描件、表格、图纸、PDF、SDLXLIFF、IDML 等格式会影响处理时间。"],
  ["交付时间", "加急项目需要重新安排译员和审校资源，会产生加急费用。"],
];

const quoteExamples = [
  ["个人证件翻译", "适合签证、留学、入职、银行或境外机构提交", "按页数、语种、是否盖章和模板要求评估"],
  ["合同与法律文件", "适合合同、章程、授权书、诉讼仲裁和公证材料", "按字数、法律风险、审校深度和交付格式评估"],
  ["技术手册本地化", "适合设备手册、SOP、API文档、软件帮助中心", "按字数、文件格式、术语库和导回验证评估"],
  ["跨境电商材料", "适合 POA、Listing、认证报告、说明书和包装标签", "按平台问题、SKU数量、材料链路和紧急度评估"],
];

const quoteChecklist = [
  "源文件或清晰截图",
  "源语言和目标语言",
  "文件用途和接收机构",
  "是否需要盖章、双语对照或原格式还原",
  "期望交付时间和是否可分批交付",
];

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const pageUrl = `https://qqbytop.com/${locale}/pricing`;
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#pricing-page`,
        url: pageUrl,
        name: "北京全球博译翻译价格说明",
        description: "翻译服务级别、语种系数、紧急通道和报价原则说明。",
      },
      {
        "@type": "OfferCatalog",
        "@id": `${pageUrl}#offer-catalog`,
        name: "北京全球博译翻译服务价格级别",
        itemListElement: pricing.tiers.map(([title, price, desc]) => ({
          "@type": "Offer",
          name: title,
          description: `${desc}，${price}`,
          priceSpecification: {
            "@type": "PriceSpecification",
            description: price,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: `https://qqbytop.com/${locale}` },
          { "@type": "ListItem", position: 2, name: "价格说明", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={pricingJsonLd} />
      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,0.95fr)_420px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-brand-600">价格说明</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">把价格拆清楚，报价才不会变成猜谜</h1>
            <p className="mt-5 max-w-2xl leading-8 text-slate-600">以下为基准价格和常见加价规则，最终报价以文件用途、语种、难度、格式和交期评估为准。</p>
          </div>
          <div className="border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold text-brand-600">快速判断</p>
            <h2 className="mt-3 text-2xl font-bold text-brand-900">想要准确报价，先发文件</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">只描述“翻译几页”通常不够准确。用途、格式、盖章和交期都会影响报价。</p>
            <Link href={`/${locale}/quote?source=pricing-hero`} className="mt-5 inline-flex w-full justify-center rounded bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500">
              提交文件获取报价
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="服务级别" subtitle="按用途和风险选择服务，不建议所有文件都按同一种单价处理。" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricing.tiers.map(([title, price, desc]) => (
              <div key={title} className="border border-slate-200 p-7">
                <h2 className="text-xl font-bold text-brand-900">{title}</h2>
                <p className="mt-4 text-3xl font-bold text-brand-600">{price}</p>
                <p className="mt-4 leading-7 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="价格由哪些因素决定" subtitle="如果两个文件字数相同，但用途、语种、格式和风险不同，报价也会不同。" />
          <div className="mt-10 grid gap-5 md:grid-cols-5">
            {priceFactors.map(([title, text]) => (
              <div key={title} className="border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">语种费率系数</h2>
            <div className="mt-6 divide-y divide-slate-200 border border-slate-200 bg-white">
              {pricing.languageRates.map(([name, rate]) => (
                <div key={name} className="flex justify-between gap-4 p-4">
                  <span>{name}</span>
                  <strong>{rate}</strong>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-900">紧急通道</h2>
            <div className="mt-6 divide-y divide-slate-200 border border-slate-200 bg-white">
              {pricing.urgency.map(([time, rate]) => (
                <div key={time} className="flex justify-between gap-4 p-4">
                  <span>{time}</span>
                  <strong>{rate}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="常见项目怎么评估" subtitle="下面不是固定报价，而是帮助你理解不同项目的报价口径。" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {quoteExamples.map(([title, desc, basis]) => (
              <div key={title} className="border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
                <p className="mt-4 border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-sm leading-7 text-brand-900">{basis}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-brand-600">询价前准备</p>
            <h2 className="mt-3 text-3xl font-bold text-brand-900">发来这些信息，报价会更准</h2>
            <p className="mt-4 leading-8 text-slate-600">不需要写正式需求书。把文件、用途、语种、接收要求和时间说明清楚，我们就能快速判断报价和交付方式。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quoteChecklist.map((item, index) => (
              <div key={item} className="flex gap-3 border border-slate-200 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{index + 1}</span>
                <p className="text-sm font-semibold leading-7 text-brand-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={typedLocale} title="需要准确报价？" subtitle="上传文件或说明用途，我们会按真实文件评估价格、交期和交付格式。" />
    </>
  );
}
