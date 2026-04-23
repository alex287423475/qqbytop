import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { services, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "翻译服务",
  description: "QQBY 翻译服务总览：专业文档翻译、法律合规翻译、跨境电商合规翻译、技术文档本地化。",
};

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">翻译服务</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">把翻译服务拆成清晰、可报价、可验收的交付模块</h1>
          <p className="mt-5 max-w-2xl leading-8 text-slate-600">按文档用途、行业风险、格式复杂度和交付时间选择服务级别，减少模糊报价和返工。</p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-2">
          {services.map((service) => (
            <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className="border border-slate-200 p-8 hover:border-brand-600 hover:shadow-lg">
              <span className="bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">{service.badge}</span>
              <h2 className="mt-5 text-2xl font-bold text-brand-900">{service.title}</h2>
              <p className="mt-4 leading-7 text-slate-600">{service.hero}</p>
              <p className="mt-5 text-sm font-semibold text-brand-600">{service.price}</p>
            </Link>
          ))}
        </div>
      </section>
      <CTA locale={locale as Locale} />
    </>
  );
}
