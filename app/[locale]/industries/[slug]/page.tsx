import Link from "next/link";
import { notFound } from "next/navigation";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getIndustry, getService, industries, type Locale } from "@/lib/site-data";

export function generateStaticParams() {
  return industries.flatMap((industry) => ["zh", "en", "ja"].map((locale) => ({ locale, slug: industry.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustry(slug);

  return {
    title: industry?.title ?? "行业翻译方案",
    description: industry?.summary,
  };
}

const industryOperatingModels: Record<string, string[]> = {
  legal: ["先识别接收机构和用途", "建立法律术语与定义条款表", "语言审校和法律语义审校分离", "按提交版本整理盖章或双语文件"],
  ecommerce: ["先判断平台问题和材料清单", "重构申诉逻辑或卖点顺序", "同步翻译证据链和合规说明", "按平台可提交版本交付"],
  technology: ["先锁定变量、标签和代码结构", "建立产品术语库和禁用词表", "翻译后做导回与格式验证", "保留版本差异和 QA 记录"],
  manufacturing: ["先梳理产品线和工艺术语", "区分 Warning / Caution / Notice", "保持编号、表格、图注和步骤结构", "按批次交付并复用术语库"],
};

export default async function IndustryDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const operatingModel = industryOperatingModels[industry.slug] ?? industryOperatingModels.technology;
  const pageUrl = `https://qqbytop.com/${locale}/industries/${industry.slug}`;
  const industryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#industry-service`,
        name: industry.title,
        description: industry.summary,
        serviceType: "行业翻译方案",
        provider: {
          "@type": "Organization",
          name: "北京全球博译翻译公司",
          url: "https://qqbytop.com",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${industry.title}关联服务`,
          itemListElement: industry.relatedServices.map((serviceSlug) => {
            const service = getService(serviceSlug);
            return {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service?.title ?? serviceSlug,
                url: `https://qqbytop.com/${locale}/services/${serviceSlug}`,
              },
            };
          }),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: industry.faq.map((item) => ({
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
          { "@type": "ListItem", position: 2, name: "行业方案", item: `https://qqbytop.com/${locale}/industries` },
          { "@type": "ListItem", position: 3, name: industry.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={industryJsonLd} />
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,0.95fr)_360px] lg:items-end">
          <div>
            <span className="rounded-full border border-brand-500/40 px-4 py-1.5 text-sm text-brand-100">{industry.badge}</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold sm:text-5xl">{industry.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{industry.summary}</p>
          </div>
          <div className="border border-slate-700 bg-slate-800/70 p-6">
            <p className="text-sm font-semibold text-brand-100">行业痛点</p>
            <p className="mt-4 leading-8 text-slate-200">{industry.pain}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="高频材料场景" subtitle="行业方案先看材料链路，再决定译员、审校、术语和交付格式。" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {industry.scenarios.map((item) => (
              <div key={item.title} className="border border-slate-200 p-6">
                <h3 className="font-bold text-brand-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="行业处理方法" subtitle="同一个行业的文件要保持术语、逻辑和交付口径一致，不能每份文件单独处理。" />
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {operatingModel.map((item, index) => (
              <li key={item} className="border border-slate-200 bg-white p-5">
                <span className="text-sm font-bold text-brand-600">0{index + 1}</span>
                <p className="mt-3 font-semibold leading-7 text-brand-900">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="专属能力" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {industry.capabilities.map((item) => (
              <div key={item.title} className="bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-bold text-brand-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-brand-100">脱敏项目反馈</p>
              <h2 className="mt-3 text-3xl font-bold">{industry.caseStudy.title}</h2>
              <p className="mt-4 text-slate-300">{industry.caseStudy.client}</p>
            </div>
            <div className="border border-slate-700 bg-slate-800/70 p-6">
              <p className="text-sm font-semibold text-brand-100">交付结果</p>
              <p className="mt-4 leading-8 text-slate-200">{industry.caseStudy.result}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="常用关联服务" subtitle="如果你已经明确材料类型，可以直接进入对应服务页查看报价口径和交付流程。" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {industry.relatedServices.map((serviceSlug) => {
              const service = getService(serviceSlug);
              if (!service) return null;

              return (
                <Link key={serviceSlug} href={`/${locale}/services/${serviceSlug}`} className="bg-white p-6 hover:shadow-lg">
                  <p className="text-sm font-semibold text-brand-600">{service.badge}</p>
                  <h3 className="mt-3 font-bold text-brand-900">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{service.summary}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-5">
          <SectionHeader title="常见问题" />
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {industry.faq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-semibold text-brand-900">{item.q}</summary>
                <p className="mt-3 leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} title={`获取${industry.title}`} />
    </>
  );
}
