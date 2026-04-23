import { notFound } from "next/navigation";
import { CTA } from "@/components/shared/CTA";
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

export default async function IndustryDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  return (
    <>
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <span className="rounded-full border border-brand-500/40 px-4 py-1.5 text-sm text-brand-100">{industry.badge}</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold sm:text-5xl">{industry.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{industry.summary}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl border-l-4 border-accent-600 pl-6">
            <h2 className="text-2xl font-bold text-brand-900">行业痛点</h2>
            <p className="mt-4 leading-8 text-slate-600">{industry.pain}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
          <SectionHeader title="专属能力" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {industry.capabilities.map((item) => (
              <div key={item.title} className="bg-white p-6">
                <h3 className="font-bold text-brand-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="bg-brand-900 p-8 text-white">
            <p className="text-sm font-semibold text-brand-100">客户案例</p>
            <h2 className="mt-3 text-3xl font-bold">{industry.caseStudy.title}</h2>
            <p className="mt-4 text-slate-300">{industry.caseStudy.client}</p>
            <p className="mt-5 max-w-3xl leading-8 text-slate-200">{industry.caseStudy.result}</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="常用关联服务" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {industry.relatedServices.map((slug) => {
              const service = getService(slug);
              if (!service) return null;
              return (
                <a key={slug} href={`/${locale}/services/${slug}`} className="bg-white p-6 hover:shadow-lg">
                  <h3 className="font-bold text-brand-900">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{service.summary}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} title={`获取${industry.title}`} />
    </>
  );
}
