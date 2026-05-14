import type { Metadata } from "next";
import Link from "next/link";
import { GaokaoEssayFooter } from "@/components/gaokao-essay/GaokaoEssayFooter";
import { GAOKAO_ESSAY_COMPANY_NAME, GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";

export const metadata: Metadata = {
  title: "高考英语作文诊断数据与隐私安全",
  robots: {
    index: false,
    follow: false,
  },
};

const rules = [
  {
    title: "作文用途边界",
    body: "用户提交的作文文本仅用于本次诊断、报告生成、额度核验和售后异常复核，不用于公开展示，不作为可识别个人身份的营销素材。",
  },
  {
    title: "支付与售后信息",
    body: "邮箱或手机号仅用于报告找回、订单异常核验、额度补发和退款处理，不用于电话营销，也不向无关第三方披露。",
  },
  {
    title: "AI 调用边界",
    body: "系统仅向模型服务传递完成诊断所需的最小文本内容，不主动发送支付敏感信息、完整联系方式或人工客服私聊内容给大模型。",
  },
  {
    title: "重复提交保护",
    body: "系统会使用内容 hash 识别同一作文的重复提交，减少重复诊断、重复扣减额度和反复暴露手稿内容的风险。",
  },
];

export default function GaokaoEssayPrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-5 py-12">
        <Link className="text-sm font-semibold text-blue-700 hover:text-blue-900" href={GAOKAO_ESSAY_TOOL_BASE_PATH}>
          返回诊断工具
        </Link>
        <div className="mt-6 border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Privacy</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">数据与隐私安全</h1>
          <p className="mt-4 leading-7 text-slate-600">
            {GAOKAO_ESSAY_COMPANY_NAME} 仅在高考英语作文诊断工具的服务履约范围内处理必要数据。核心原则是最小化收集、限定用途、异常可追溯。
          </p>
          <div className="mt-8 grid gap-4">
            {rules.map((rule) => (
              <article key={rule.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-bold text-slate-950">{rule.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{rule.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <GaokaoEssayFooter />
    </main>
  );
}
