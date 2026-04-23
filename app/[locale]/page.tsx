import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { home, services, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "北京全球博译翻译 | 跨境合规翻译 · 技术本地化 · 专利文档翻译",
  description: "QQBY 全球博译提供跨境电商合规翻译、法律合规翻译、技术文档本地化与专业文档翻译服务。",
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-brand-500/40 px-4 py-1.5 text-sm text-brand-100">{home.badge}</p>
            <h1 className="mt-6 text-4xl font-bold sm:text-6xl">{home.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{home.subtitle}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/quote`} className="rounded bg-brand-600 px-6 py-3 text-center font-semibold text-white hover:bg-brand-500">获取翻译报价</Link>
              <Link href={`/${locale}/services/technical-localization`} className="rounded border border-slate-600 px-6 py-3 text-center font-semibold text-slate-100 hover:border-slate-300">查看技术能力</Link>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {home.stats.map(([value, label]) => (
              <div key={label} className="border border-slate-700 bg-slate-800/50 p-5">
                <div className="text-3xl font-bold">{value}</div>
                <div className="mt-1 text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="翻译服务" subtitle="不同类型的文件需要不同的翻译策略。我们把服务拆成可评估、可交付、可复用的专业模块。" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className="border border-slate-200 p-7 transition hover:border-brand-600 hover:shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-brand-900">{service.title}</h3>
                  <span className="shrink-0 bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">{service.badge}</span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{service.summary}</p>
                <span className="mt-6 inline-flex text-sm font-semibold text-brand-600">了解详情</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader eyebrow="技术引擎" title="让每一份文件经过工业级处理流程" subtitle="把复杂文件从接收、保护、翻译、审校到导出拆成可检查的步骤，降低格式损坏和术语漂移风险。" />
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {home.techSteps.map(([title, text], index) => (
              <div key={title} className="bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{index + 1}</div>
                <h3 className="mt-5 font-bold text-brand-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="客户评价" subtitle="来自长期合作客户的真实反馈。" />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {home.testimonials.map(([name, title, quote]) => (
              <figure key={name} className="border border-slate-200 p-7">
                <blockquote className="leading-8 text-slate-700">“{quote}”</blockquote>
                <figcaption className="mt-6 text-sm text-slate-500">
                  <strong className="block text-brand-900">{name}</strong>
                  {title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} />
    </>
  );
}
