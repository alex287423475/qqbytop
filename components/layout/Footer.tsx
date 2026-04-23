import Link from "next/link";
import { industries, services, type Locale } from "@/lib/site-data";

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-xl font-bold">QQBY<span className="text-brand-500">.</span></div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            北京全球博译翻译服务有限公司，为企业客户提供专业翻译、本地化和跨境合规语言服务。
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">翻译服务</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {services.map((item) => (
              <li key={item.slug}><Link className="hover:text-white" href={`/${locale}/services/${item.slug}`}>{item.shortTitle}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">行业方案</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {industries.map((item) => (
              <li key={item.slug}><Link className="hover:text-white" href={`/${locale}/industries/${item.slug}`}>{item.title.replace("翻译方案", "")}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">联系我们</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p><a className="hover:text-white" href="tel:400-869-9562">400-869-9562</a></p>
            <p><a className="hover:text-white" href="mailto:info@qqbytop.com">info@qqbytop.com</a></p>
            <p>北京市昌平区回龙观东大街336号院1号楼5层511</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-5 py-6 text-center text-xs text-slate-500">
        © 2026 北京全球博译翻译服务有限公司 版权所有
      </div>
    </footer>
  );
}
