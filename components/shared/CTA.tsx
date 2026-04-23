import Link from "next/link";
import type { Locale } from "@/lib/site-data";

export function CTA({ locale, title = "有文件需要翻译？", subtitle = "提交文件或描述需求，30 分钟内获得专属项目经理响应和精准报价。" }: { locale: Locale; title?: string; subtitle?: string }) {
  return (
    <section className="bg-brand-900 py-16 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/${locale}/quote`} className="rounded bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500">获取报价</Link>
          <a href="tel:400-869-9562" className="rounded border border-slate-600 px-6 py-3 font-semibold text-slate-100 hover:border-slate-300">400-869-9562</a>
        </div>
      </div>
    </section>
  );
}
