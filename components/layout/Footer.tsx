import Image from "next/image";
import Link from "next/link";
import { contact, getQqHref, getWhatsappHref } from "@/lib/contact";
import { industries, services, type Locale } from "@/lib/site-data";

export function Footer({ locale }: { locale: Locale }) {
  const whatsappHref = getWhatsappHref(locale);
  const qqHref = getQqHref();

  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/brand/qqby-logo-light.svg"
            alt="全球博译 Pro Compliance"
            width={220}
            height={52}
            className="h-12 w-auto"
          />
          <p className="mt-4 text-sm leading-7 text-slate-300">
            北京全球博译翻译服务有限公司，为企业客户提供专业翻译、本地化和跨境合规语言服务。
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">翻译服务</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {services.map((item) => (
              <li key={item.slug}>
                <Link className="hover:text-white" href={`/${locale}/services/${item.slug}`}>
                  {item.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">行业方案</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {industries.map((item) => (
              <li key={item.slug}>
                <Link className="hover:text-white" href={`/${locale}/industries/${item.slug}`}>
                  {item.title.replace("翻译方案", "")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">联系我们</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>
              <a className="hover:text-white" href={contact.phoneHref}>
                {contact.phone}
              </a>
            </p>
            <p>
              <a className="hover:text-white" href={contact.emailHref}>
                {contact.email}
              </a>
            </p>
            <p>{contact.address}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a className="rounded border border-slate-700 px-3 py-1.5 hover:border-white hover:text-white" href={contact.wechatQr} target="_blank" rel="noreferrer">
                微信
              </a>
              {whatsappHref && (
                <a className="rounded border border-slate-700 px-3 py-1.5 hover:border-white hover:text-white" href={whatsappHref} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              {qqHref && (
                <a className="rounded border border-slate-700 px-3 py-1.5 hover:border-white hover:text-white" href={qqHref} target="_blank" rel="noreferrer">
                  QQ
                </a>
              )}
            </div>
            <div className="inline-block rounded bg-white p-2">
              <Image src={contact.wechatQr} alt="微信咨询二维码" width={96} height={96} className="h-24 w-24" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-5 py-6 text-center text-xs text-slate-500">
        © 2026 北京全球博译翻译服务有限公司 版权所有
      </div>
    </footer>
  );
}
