"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { unlockReport, unlockReportWithCredit } from "@/lib/gaokao-essay/api";
import { formatCny, GAOKAO_ESSAY_PRICING, GAOKAO_ESSAY_PRODUCT_TYPES, GAOKAO_ESSAY_TOOL_BASE_PATH } from "@/lib/gaokao-essay/constants";
import { isValidPayerContact, loadPayerContact, normalizePayerContact, savePayerContact } from "@/lib/gaokao-essay/identity";
import type { ProductType } from "@/lib/gaokao-essay/types";
import { AiServiceNotice } from "./AiServiceNotice";
import { GaokaoEssaySinglePlanFull } from "./GaokaoEssaySinglePlanDetails";
import { GaokaoEssaySupportAssistant } from "./GaokaoEssaySupportAssistant";

const PRODUCTS = [
  {
    type: GAOKAO_ESSAY_PRODUCT_TYPES.singlePack,
    title: "最后冲刺抢分包（20篇深度精诊特权）",
    description: "专为考前冲刺定制。包含 20 篇深度精改额度，并限时开放《2026 AI 演算母题库》特权。折合低至 4.9元/篇。对标 2026 最新高考阅卷标准，秒出万字级诊断报告。闭眼冲刺，不留死角。",
    priceLabel: formatCny(GAOKAO_ESSAY_PRICING.singlePriceCents),
  },
  {
    type: GAOKAO_ESSAY_PRODUCT_TYPES.groupPack,
    title: "同学组队价",
    description: "发起拼团，分享给同学立享 ￥53 特惠！3 人成团，每人皆可获得【最后冲刺抢分包（20篇额度）】及【2026 AI 演算母题库】。",
    priceLabel: `${formatCny(GAOKAO_ESSAY_PRICING.groupPriceCents)} / 人`,
  },
] satisfies Array<{
  type: ProductType;
  title: string;
  description: string;
  priceLabel: string;
}>;

function normalizeProductType(value: ProductType): ProductType {
  return value === GAOKAO_ESSAY_PRODUCT_TYPES.singlePack || value === GAOKAO_ESSAY_PRODUCT_TYPES.legacySingle
    ? GAOKAO_ESSAY_PRODUCT_TYPES.singlePack
    : GAOKAO_ESSAY_PRODUCT_TYPES.groupPack;
}

export function GaokaoEssayCheckoutMock({
  reportId,
  initialProductType = GAOKAO_ESSAY_PRODUCT_TYPES.groupPack,
}: {
  reportId: string;
  initialProductType?: ProductType;
}) {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>(() => normalizeProductType(initialProductType));
  const [message, setMessage] = useState("当前为支付占位流程；接入真实商户后会跳转到微信/支付宝收银台。");
  const [payerContact, setPayerContact] = useState(() => loadPayerContact());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isGroup = productType === GAOKAO_ESSAY_PRODUCT_TYPES.groupPack;
  const selectedProduct = useMemo(() => PRODUCTS.find((product) => product.type === productType) ?? PRODUCTS[1], [productType]);

  function selectProduct(nextProductType: ProductType) {
    const normalized = normalizeProductType(nextProductType);
    setProductType(normalized);
    const nextUrl = `${GAOKAO_ESSAY_TOOL_BASE_PATH}/checkout/${reportId}?product=${normalized}`;
    window.history.replaceState(null, "", nextUrl);
  }

  async function handleMockPay() {
    const normalizedContact = normalizePayerContact(payerContact);
    if (!isValidPayerContact(normalizedContact)) {
      setMessage("请先填写邮箱或手机号，仅用于报告找回和订单异常处理。");
      return;
    }

    setIsSubmitting(true);
    try {
      savePayerContact(normalizedContact);
      const report = await unlockReport(reportId, productType, normalizedContact);
      if (!report) {
        setMessage("没有找到这份报告，请返回重新生成。");
        return;
      }
      router.push(`${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${reportId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "支付状态同步失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreditUnlock() {
    const normalizedContact = normalizePayerContact(payerContact);
    if (!isValidPayerContact(normalizedContact)) {
      setMessage("请先填写购买 20 篇抢分包时使用的邮箱或手机号。");
      return;
    }

    setIsSubmitting(true);
    try {
      savePayerContact(normalizedContact);
      const report = await unlockReportWithCredit(reportId, normalizedContact);
      if (!report) {
        setMessage("没有找到这份报告，请返回重新生成。");
        return;
      }
      router.push(`${GAOKAO_ESSAY_TOOL_BASE_PATH}/report/${reportId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "额度解锁失败，请确认账号仍有可用篇数。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">解锁方式</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {PRODUCTS.map((product) => {
            const selected = product.type === productType;
            return (
              <button
                key={product.type}
                type="button"
                aria-pressed={selected}
                onClick={() => selectProduct(product.type)}
                className={`border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  selected ? "border-2 border-blue-700 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-400"
                }`}
              >
                <span className={`text-lg font-bold ${selected ? "text-blue-800" : "text-slate-600"}`}>{product.title}</span>
                <p className={`mt-3 text-4xl font-bold ${selected ? "text-blue-950" : "text-slate-950"}`}>{product.priceLabel}</p>
                <p className={`mt-3 text-sm leading-6 ${selected ? "text-blue-950" : "text-slate-600"}`}>{product.description}</p>
                <span className={`mt-4 inline-flex text-xs font-semibold ${selected ? "text-blue-700" : "text-slate-400"}`}>
                  {selected ? "已选择" : "点击选择"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">{selectedProduct.title}</h3>
            <p className="mt-2 text-3xl font-bold text-blue-700">{selectedProduct.priceLabel}</p>
          </div>
          <Link className="text-sm font-semibold text-blue-700 hover:text-blue-900" href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/refund-policy`}>
            退款规则
          </Link>
        </div>

        {isGroup ? (
          <div className="border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            三人同学组队价要求每名真实成员提交自己的作文、生成自己的报告并完成组队价支付；成团后每人各自获得 20 篇深度精诊额度，不共享作文、报告、订单或个人信息。
          </div>
        ) : null}

        {!isGroup ? <GaokaoEssaySinglePlanFull /> : null}

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">报告找回联系方式</span>
          <input
            value={payerContact}
            onChange={(event) => setPayerContact(event.target.value)}
            placeholder="邮箱或手机号"
            className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          <span className="block text-xs leading-5 text-slate-500">仅用于报告找回、订单异常和自助退款处理，不用于电话营销。</span>
        </label>

        <AiServiceNotice compact />
        <GaokaoEssaySupportAssistant reportId={reportId} compact />
        <p className="text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={handleMockPay}
          disabled={isSubmitting}
          className="w-full bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "正在同步支付状态..." : isGroup ? "发起组队，即刻开通抢分包" : "立即开通 20 篇提分权限"}
        </button>
        <button
          type="button"
          onClick={handleCreditUnlock}
          disabled={isSubmitting}
          className="w-full border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          已有 20 篇额度？用 1 篇解锁当前报告
        </button>
      </div>
    </div>
  );
}
