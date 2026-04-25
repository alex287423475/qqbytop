import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { buildSeoMetadata } from "@/lib/seo";
import { services, type Locale } from "@/lib/site-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return buildSeoMetadata({
    locale,
    path: "/services",
    title: "翻译服务",
    description: "北京全球博译翻译服务总览：专业文档翻译、法律合规翻译、跨境电商合规翻译、技术文档本地化与证件翻译。",
    keywords: services.flatMap((service) => [service.title, service.shortTitle, service.badge]),
  });
}

const serviceDecisionRows = [
  ["只需要读懂内容", "标准翻译", "内部参考、邮件、普通说明材料", "控制成本，重点保证准确完整"],
  ["需要提交机构或客户", "专业翻译 + 审校", "合同、证件、公证、投标、认证材料", "关注格式、盖章、术语和责任表达"],
  ["需要直接上线或对外发布", "本地化 / 母语润色", "官网、Listing、帮助中心、营销材料", "关注目标市场表达和转化"],
  ["涉及法律、专利、合规风险", "行业专家审校", "专利、诉讼、POA、法规、技术规范", "先识别风险，再安排译审流程"],
];

const serviceAssurances = [
  ["先判断用途", "报价前确认接收机构、文件用途、是否盖章和交付格式。"],
  ["再匹配译员", "按法律、技术、电商、制造等行业匹配译员和审校资源。"],
  ["最后可验收", "交付前检查术语、数字、漏译、格式和可提交性。"],
];

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pageUrl = `https://qqbytop.com/${locale}/services`;
  const serviceListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#service-list`,
    name: "北京全球博译翻译服务",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${pageUrl}/${service.slug}`,
      name: service.title,
      description: service.summary,
    })),
  };

  return (
    <>
      <JsonLd data={serviceListJsonLd} />
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">翻译服务</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold text-brand-900">把翻译服务拆成清晰、可报价、可验收的交付模块</h1>
              <p className="mt-5 max-w-2xl leading-8 text-slate-600">按文件用途、行业风险、格式复杂度和交付时间选择服务级别，减少模糊报价和返工。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {serviceAssurances.map(([title, text]) => (
                <div key={title} className="border border-slate-200 bg-white p-4">
                  <h2 className="font-bold text-brand-900">{title}</h2>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="先按用途选择服务级别" subtitle="同样是翻译，内部阅读、机构提交、对外发布和风险文件的交付标准完全不同。" />
          <div className="mt-10 overflow-hidden border border-slate-200">
            <div className="grid bg-slate-50 px-5 py-3 text-sm font-semibold text-brand-900 md:grid-cols-[0.8fr_0.9fr_1.2fr_1.2fr]">
              <span>使用目标</span>
              <span className="hidden md:block">建议服务</span>
              <span className="hidden md:block">常见材料</span>
              <span className="hidden md:block">判断重点</span>
            </div>
            {serviceDecisionRows.map(([goal, level, files, focus]) => (
              <div key={goal} className="grid gap-2 border-t border-slate-200 px-5 py-4 text-sm md:grid-cols-[0.8fr_0.9fr_1.2fr_1.2fr] md:items-center">
                <p className="font-bold text-brand-900">{goal}</p>
                <p className="text-brand-600">{level}</p>
                <p className="leading-6 text-slate-600">{files}</p>
                <p className="leading-6 text-slate-600">{focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="按材料类型进入服务" subtitle="每个服务页都说明适用场景、交付流程、报价口径和常见问题。" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className="group flex h-full flex-col border border-slate-200 bg-white p-8 transition hover:border-brand-600 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">{service.badge}</span>
                    <h2 className="mt-5 text-2xl font-bold text-brand-900">{service.title}</h2>
                  </div>
                  <span className="text-sm font-semibold text-brand-600 group-hover:text-brand-500">查看</span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{service.hero}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {service.scenarios.slice(0, 3).map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-6 border-t border-slate-100 pt-5 text-sm font-semibold text-brand-600">{service.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} />
    </>
  );
}
