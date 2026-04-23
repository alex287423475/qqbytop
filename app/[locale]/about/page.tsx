import { CTA } from "@/components/shared/CTA";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { about, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "关于我们",
  description: "了解北京全球博译翻译服务有限公司的服务理念、发展历程、价值观和联系信息。",
};

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">关于 QQBY</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">让专业翻译成为企业出海和跨境合作的确定性基础设施</h1>
          <p className="mt-5 max-w-2xl leading-8 text-slate-600">{about.intro}</p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="我们的价值观" />
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {about.values.map(([title, text]) => (
              <div key={title} className="border border-slate-200 p-6">
                <h2 className="font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="发展历程" />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {about.timeline.map(([year, event]) => (
              <div key={year} className="bg-white p-6">
                <strong className="text-2xl text-brand-600">{year}</strong>
                <p className="mt-3 text-sm leading-7 text-slate-600">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">联系信息</h2>
            <div className="mt-6 space-y-4 leading-7 text-slate-600">
              <p>电话：400-869-9562</p>
              <p>邮箱：info@qqbytop.com</p>
              <p>地址：北京市昌平区回龙观东大街336号院1号楼5层511</p>
            </div>
          </div>
          <div className="bg-slate-50 p-8">
            <h2 className="text-2xl font-bold text-brand-900">资质与承诺</h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              <li>ISO 质量管理流程</li>
              <li>NDA 保密协议覆盖</li>
              <li>项目经理全程跟进</li>
              <li>交付后合理修改支持</li>
            </ul>
          </div>
        </div>
      </section>
      <CTA locale={locale as Locale} />
    </>
  );
}
