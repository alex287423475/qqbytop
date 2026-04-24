import { SmartQuoteForm } from "@/components/quote/SmartQuoteForm";
import { buildQuotePrefill } from "@/lib/quote-page";
import { locales, type Locale } from "@/lib/site-data";

export const metadata = {
  title: "获取翻译报价",
  description: "在线提交翻译需求，30 分钟内获得项目经理响应和报价建议。",
};

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string; category?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const normalized = locales.includes(locale as Locale) ? (locale as Locale) : "zh";
  const prefill = buildQuotePrefill({
    locale: normalized,
    source: query.source,
    category: query.category,
  });

  return (
    <>
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-brand-100">{prefill.panelEyebrow}</p>
              <h1 className="mt-3 text-4xl font-bold">获取翻译报价</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                填写信息或说明项目需求，30 分钟内获得项目经理响应。我们会结合用途、语种、审校深度和交付边界来判断报价。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-100">{prefill.panelEyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold text-white">{prefill.panelTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{prefill.panelDescription}</p>
              {(prefill.category || prefill.source) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {prefill.source && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-brand-100">
                      来源：{prefill.source}
                    </span>
                  )}
                  {prefill.category && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-brand-100">
                      分类：{prefill.category}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="border border-slate-200 p-6 shadow-sm sm:p-8">
              <SmartQuoteForm prefill={prefill} />
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-brand-900">系统已带入的默认值</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">服务级别</dt>
                    <dd className="text-right font-medium text-slate-800">{prefill.serviceType}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">翻译方向</dt>
                    <dd className="text-right font-medium text-slate-800">{prefill.languagePair}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">文件格式</dt>
                    <dd className="text-right font-medium text-slate-800">{prefill.fileFormat}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-600">
                <p className="font-semibold text-brand-900">提交后我们会重点确认</p>
                <ul className="mt-3 space-y-2 leading-7">
                  <li>用途与交付对象</li>
                  <li>是否需要审校、润色或盖章</li>
                  <li>是否涉及术语表、格式还原、图文对应</li>
                  <li>交付时间与版本要求</li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <span>端到端加密传输</span>
            <span>NDA 保密协议</span>
            <span>30 分钟内响应</span>
          </div>
        </div>
      </section>
    </>
  );
}
