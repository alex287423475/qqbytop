import type { Metadata } from "next";
import Link from "next/link";
import { AiServiceNotice } from "@/components/gaokao-essay/AiServiceNotice";
import { GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";

export const metadata: Metadata = {
  title: "高考英语作文诊断自助重试与退款规则",
  description: "说明高考英语作文 AI 诊断工具的自动生成提示、智能申诉、重试和退款规则。",
};

export default function GaokaoEssayRefundPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <AiServiceNotice />
        <section className="border border-slate-200 bg-white p-6">
          <h1 className="text-3xl font-bold text-slate-950">自助重试与退款规则</h1>
          <div className="mt-6 space-y-4 leading-7 text-slate-700">
            <p>用户点击“智能申诉与重试”后，系统会自动同步支付状态、检查诊断任务，并在可恢复时重新入队。</p>
            <p>支付成功后超过配置阈值仍未生成完整报告时，后端按订单绑定的商户号发起退款，不重新轮询商户号。</p>
            <p>退款接口失败时，用户端显示“退款处理中”，后台保留异常列表并记录 support_actions。</p>
            <p>本规则不包含“拒绝售后”“不接受退款”“最终解释权”等排除消费者权利的表达。</p>
          </div>
          <Link className="mt-6 inline-flex bg-blue-700 px-5 py-3 font-semibold text-white" href={GAOKAO_ESSAY_TOOL_BASE_PATH}>
            返回工具
          </Link>
        </section>
      </div>
    </main>
  );
}
