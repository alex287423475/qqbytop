import { notFound } from "next/navigation";
import { CTA } from "@/components/shared/CTA";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getService, services, type Locale } from "@/lib/site-data";

export function generateStaticParams() {
  return services.flatMap((service) => ["zh", "en", "ja"].map((locale) => ({ locale, slug: service.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  return {
    title: service?.title ?? "翻译服务",
    description: service?.summary,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <>
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <span className="rounded-full border border-brand-500/40 px-4 py-1.5 text-sm text-brand-100">{service.badge}</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold sm:text-5xl">{service.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{service.hero}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="典型需求场景" subtitle="先判断文件用途，再选择翻译、审校和格式处理策略。" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.scenarios.map((item) => (
              <div key={item} className="border border-slate-200 p-5 font-semibold text-brand-900">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="服务能力" />
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

      <section className="py-16">
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

      <section className="bg-slate-50 py-16">
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
