import { SmartQuoteForm } from "@/components/quote/SmartQuoteForm";

export const metadata = {
  title: "获取翻译报价",
  description: "在线提交翻译需求，30 分钟内获得专属项目经理响应和精准报价。",
};

export default function QuotePage() {
  return (
    <>
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h1 className="text-4xl font-bold">获取翻译报价</h1>
          <p className="mt-4 text-slate-300">填写信息或说明项目需求，30 分钟内获得专属项目经理响应。</p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-5">
          <div className="border border-slate-200 p-6 shadow-sm sm:p-8">
            <SmartQuoteForm />
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
