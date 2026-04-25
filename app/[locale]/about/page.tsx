import Image from "next/image";
import { CTA } from "@/components/shared/CTA";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { contact, getQqHref, getWhatsappHref } from "@/lib/contact";
import { about, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "关于我们",
  description: "了解北京全球博译翻译服务有限公司的服务理念、发展历程、价值观和联系信息。",
};

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const whatsappHref = getWhatsappHref(typedLocale);
  const qqHref = getQqHref();

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">关于 QQBY</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">
            让专业翻译成为企业出海和跨境合作的确定性基础设施
          </h1>
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
              <p>
                电话：
                <a className="font-semibold text-brand-700 hover:text-brand-600" href={contact.phoneHref}>
                  {contact.phone}
                </a>
              </p>
              <p>
                邮箱：
                <a className="font-semibold text-brand-700 hover:text-brand-600" href={contact.emailHref}>
                  {contact.email}
                </a>
              </p>
              <p>地址：{contact.address}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500" href={contact.wechatQr} target="_blank" rel="noreferrer">
                微信扫码咨询
              </a>
              {whatsappHref && (
                <a className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500" href={whatsappHref} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              {qqHref && (
                <a className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500" href={qqHref} target="_blank" rel="noreferrer">
                  QQ 咨询
                </a>
              )}
            </div>

            <div className="mt-6 inline-block border border-slate-200 bg-white p-3">
              <Image src={contact.wechatQr} alt="微信咨询二维码" width={132} height={132} className="h-32 w-32" />
              <p className="mt-2 text-center text-xs text-slate-500">{contact.wechatHint}</p>
            </div>
          </div>

          <div id="quality-commitment" className="scroll-mt-24 bg-slate-50 p-8">
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

      <CTA locale={typedLocale} />
    </>
  );
}
