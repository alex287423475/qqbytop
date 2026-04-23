import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { industries, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "行业翻译方案",
  description: "QQBY 行业翻译方案：法律、跨境电商、科技、制造业专属翻译解决方案。",
};

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">行业方案</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">不同行业的翻译需求，不能用同一套方法处理</h1>
          <p className="mt-5 max-w-2xl leading-8 text-slate-600">我们为重点行业配置专属译员、术语库、审校规则和交付模板。</p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-2">
          {industries.map((industry) => (
            <Link key={industry.slug} href={`/${locale}/industries/${industry.slug}`} className="border border-slate-200 p-8 hover:border-brand-600 hover:shadow-lg">
              <span className="text-sm font-semibold text-brand-600">{industry.badge}</span>
              <h2 className="mt-4 text-2xl font-bold text-brand-900">{industry.title}</h2>
              <p className="mt-4 leading-7 text-slate-600">{industry.summary}</p>
              <p className="mt-5 text-sm font-semibold text-brand-600">查看行业方案</p>
            </Link>
          ))}
        </div>
      </section>
      <CTA locale={locale as Locale} title="没有看到你的行业？" subtitle="金融、医疗、能源、教育、游戏等行业也可以按项目定制行业术语和交付流程。" />
    </>
  );
}
