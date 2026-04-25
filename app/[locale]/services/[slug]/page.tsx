import Link from "next/link";
import { notFound } from "next/navigation";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { buildSeoMetadata } from "@/lib/seo";
import { getService, industries, services, type Locale } from "@/lib/site-data";

export function generateStaticParams() {
  return services.flatMap((service) => ["zh", "en", "ja"].map((locale) => ({ locale, slug: service.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const service = getService(slug);

  return buildSeoMetadata({
    locale,
    path: `/services/${slug}`,
    title: service?.title ?? "翻译服务",
    description: service?.summary ?? "北京全球博译翻译服务详情页，说明适用材料、交付流程、报价口径和常见问题。",
    keywords: service ? [service.title, service.shortTitle, service.badge, ...service.scenarios] : ["翻译服务"],
  });
}

const serviceEnhancements: Record<string, { suitable: string[]; deliverables: string[]; checks: string[] }> = {
  "document-translation": {
    suitable: ["个人证件、证明、公证材料", "商务合同、标书、说明文档", "论文摘要、医学或工程资料"],
    deliverables: ["目标语译文", "按需保留原格式", "可选双语对照稿", "术语与修改说明"],
    checks: ["姓名、数字、日期和专有名词", "页眉页脚、表格和图片说明", "漏译、错译和格式偏移"],
  },
  "legal-compliance": {
    suitable: ["合同、章程、授权书", "诉讼仲裁和证据材料", "专利、商标、合规说明"],
    deliverables: ["法律语义审校稿", "定义条款和核心术语表", "可提交盖章件", "审校意见说明"],
    checks: ["权利义务和责任边界", "shall/may/must 等义务动词", "管辖、赔偿、期限和金额"],
  },
  "cross-border-ecommerce": {
    suitable: ["POA 申诉信和平台沟通", "Listing、A+、广告文案", "认证报告、标签、说明书"],
    deliverables: ["可提交申诉版本", "本地化 Listing 文案", "合规证据链翻译", "平台语言风险提示"],
    checks: ["根因、纠正措施和预防机制", "平台禁用表达和模板化语气", "消费者可理解的卖点排序"],
  },
  "technical-localization": {
    suitable: ["软件 UI、帮助中心、API 文档", "设备手册、SOP、质量体系", "SDLXLIFF、Markdown、XML、IDML"],
    deliverables: ["可导回目标文件", "术语库和禁用词表", "标签与变量保护报告", "QA 检查记录"],
    checks: ["变量、占位符和代码块", "术语一致性和版本一致性", "图表编号、步骤和警示语"],
  },
};

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const enhancement = serviceEnhancements[service.slug] ?? serviceEnhancements["document-translation"];
  const relatedIndustries = industries.filter((industry) => industry.relatedServices.includes(service.slug));
  const pageUrl = `https://qqbytop.com/${locale}/services/${service.slug}`;
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: service.title,
        description: service.summary,
        serviceType: service.shortTitle,
        provider: {
          "@type": "Organization",
          name: "北京全球博译翻译公司",
          url: "https://qqbytop.com",
        },
        areaServed: ["CN", "Global"],
        offers: {
          "@type": "Offer",
          priceSpecification: {
            "@type": "PriceSpecification",
            description: service.price,
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: service.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: `https://qqbytop.com/${locale}` },
          { "@type": "ListItem", position: 2, name: "翻译服务", item: `https://qqbytop.com/${locale}/services` },
          { "@type": "ListItem", position: 3, name: service.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={serviceJsonLd} />
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,0.9fr)_360px] lg:items-end">
          <div>
            <span className="rounded-full border border-brand-500/40 px-4 py-1.5 text-sm text-brand-100">{service.badge}</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold sm:text-5xl">{service.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{service.hero}</p>
          </div>
          <div className="border border-slate-700 bg-slate-800/70 p-6">
            <p className="text-sm font-semibold text-brand-100">报价口径</p>
            <p className="mt-3 text-2xl font-bold">{service.price}</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">正式报价会结合文件用途、语种、字数、格式复杂度和交付时间确认。</p>
            <Link href={`/${locale}/quote?source=service-${service.slug}`} className="mt-6 inline-flex w-full justify-center rounded bg-white px-5 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50">
              提交文件评估
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="适合哪些材料" subtitle="先判断材料用途，再决定是否需要盖章、审校、格式还原或行业专家介入。" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.scenarios.map((item) => (
              <div key={item} className="border border-slate-200 p-5 font-semibold text-brand-900">{item}</div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {enhancement.suitable.map((item) => (
              <div key={item} className="bg-slate-50 p-5 text-sm leading-7 text-slate-700">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="服务能力" subtitle="不是只把文字翻成另一种语言，而是把译文做成可提交、可复核、可继续使用的交付件。" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {service.capabilities.map((item) => (
              <div key={item.title} className="bg-white p-6">
                <h3 className="font-bold text-brand-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {relatedIndustries.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-5">
            <SectionHeader title="适用行业方案" subtitle="如果你的文件属于特定行业，可以从行业页继续查看风险点和材料链路。" />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {relatedIndustries.map((industry) => (
                <Link key={industry.slug} href={`/${locale}/industries/${industry.slug}`} className="border border-slate-200 bg-white p-6 hover:border-brand-600 hover:shadow-lg">
                  <p className="text-sm font-semibold text-brand-600">{industry.badge}</p>
                  <h3 className="mt-3 text-xl font-bold text-brand-900">{industry.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{industry.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-2">
          <div>
            <SectionHeader title="交付物" subtitle="根据材料用途组合交付，不强行增加不必要的服务项。" />
            <div className="mt-8 space-y-3">
              {enhancement.deliverables.map((item) => (
                <div key={item} className="border border-slate-200 bg-white px-5 py-4 font-semibold text-brand-900">{item}</div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader title="验收重点" subtitle="交付前把最容易影响使用的细节单独检查。" />
            <div className="mt-8 space-y-3">
              {enhancement.checks.map((item) => (
                <div key={item} className="border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="交付流程" subtitle={service.price} />
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {service.workflow.map((step, index) => (
              <li key={step} className="border-l-4 border-brand-600 bg-white p-5 shadow-sm">
                <span className="text-sm font-bold text-brand-600">0{index + 1}</span>
                <p className="mt-2 font-semibold text-brand-900">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-5">
          <SectionHeader title="常见问题" />
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {service.faq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-semibold text-brand-900">{item.q}</summary>
                <p className="mt-3 leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} title={`需要${service.shortTitle}？`} />
    </>
  );
}
