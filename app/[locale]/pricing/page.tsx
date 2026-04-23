import { CTA } from "@/components/shared/CTA";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { pricing, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "价格说明",
  description: "QQBY 翻译服务价格说明：服务级别、语种系数、紧急通道和报价原则。",
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">价格说明</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">价格清晰到每一分钱</h1>
          <p className="mt-5 max-w-2xl leading-8 text-slate-600">以下为基准价格和常见加价规则，最终报价以文件用途、语种、难度、格式和交期评估为准。</p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="定价原则" />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {pricing.principles.map((item) => <div key={item} className="border border-slate-200 p-5 font-semibold text-brand-900">{item}</div>)}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">语种费率系数</h2>
            <div className="mt-6 divide-y divide-slate-200 bg-white">
              {pricing.languageRates.map(([name, rate]) => <div key={name} className="flex justify-between p-4"><span>{name}</span><strong>{rate}</strong></div>)}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-900">紧急通道</h2>
            <div className="mt-6 divide-y divide-slate-200 bg-white">
              {pricing.urgency.map(([time, rate]) => <div key={time} className="flex justify-between p-4"><span>{time}</span><strong>{rate}</strong></div>)}
            </div>
          </div>
        </div>
      </section>
      <CTA locale={locale as Locale} title="需要准确报价？" subtitle="上传文件或说明用途，我们会按真实文件评估价格、交期和交付格式。" />
    </>
  );
}
