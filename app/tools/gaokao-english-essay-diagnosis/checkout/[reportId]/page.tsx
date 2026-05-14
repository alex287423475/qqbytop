import type { Metadata } from "next";
import Link from "next/link";
import { AiServiceNotice } from "@/components/gaokao-essay/AiServiceNotice";
import { GaokaoEssayCheckoutMock } from "@/components/gaokao-essay/GaokaoEssayCheckoutMock";
import { GaokaoEssayFooter } from "@/components/gaokao-essay/GaokaoEssayFooter";
import { GAOKAO_ESSAY_PRODUCT_TYPES, GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";
import type { ProductType } from "@/lib/gaokao-essay/types";

export const metadata: Metadata = {
  title: "解锁高考英语作文完整报告 | 支付占位页",
  robots: {
    index: false,
    follow: false,
  },
};

function normalizeProductType(value: string | string[] | undefined): ProductType {
  const product = Array.isArray(value) ? value[0] : value;
  if (product === GAOKAO_ESSAY_PRODUCT_TYPES.singlePack || product === GAOKAO_ESSAY_PRODUCT_TYPES.legacySingle) {
    return GAOKAO_ESSAY_PRODUCT_TYPES.singlePack;
  }
  return GAOKAO_ESSAY_PRODUCT_TYPES.groupPack;
}

export default async function GaokaoEssayCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<{ product?: string | string[] }>;
}) {
  const { reportId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialProductType = normalizeProductType(resolvedSearchParams.product);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-10">
        <AiServiceNotice />
        <section className="border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-blue-700">报告 {reportId.slice(0, 18)}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">解锁完整报告</h1>
          <p className="mt-3 leading-7 text-slate-600">
            选择单人解锁或同学组队价。三人同行特惠，解锁 100% 完整深度诊断与提分方案。
          </p>

          <GaokaoEssayCheckoutMock reportId={reportId} initialProductType={initialProductType} />

          <Link className="mt-6 inline-flex bg-slate-950 px-5 py-3 font-semibold text-white" href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${reportId}`}>
            返回报告
          </Link>
        </section>
      </div>
      <GaokaoEssayFooter />
    </main>
  );
}
