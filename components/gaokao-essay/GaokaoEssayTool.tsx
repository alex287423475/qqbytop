"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { captureMarketingAttribution } from "@/lib/gaokao-essay/attribution";
import { createImageDraft, createTextReport } from "@/lib/gaokao-essay/api";
import {
  formatCny,
  GAOKAO_ESSAY_IMAGE_OCR_ENABLED,
  GAOKAO_ESSAY_PRICING,
  GAOKAO_ESSAY_TOOL_BASE_PATH,
  GAOKAO_ESSAY_WORD_LIMITS,
} from "@/lib/gaokao-essay/constants";
import { sampleGaokaoEssay, sampleGaokaoTaskPrompt } from "@/lib/gaokao-essay/mock-data";
import { validateEssayText } from "@/lib/gaokao-essay/schemas";
import type { CreateReportRequest, MarketingAttribution } from "@/lib/gaokao-essay/types";
import { AiServiceNotice } from "./AiServiceNotice";
import { AiCorrectionDemo } from "./AiCorrectionDemo";
import { GaokaoEssayFooter } from "./GaokaoEssayFooter";
import { GaokaoEssaySinglePlanCompact } from "./GaokaoEssaySinglePlanDetails";
import { GaokaoEssaySupportAssistant } from "./GaokaoEssaySupportAssistant";

type InputMode = "text" | "image";

const TRUST_ITEMS = [
  "对标 2026 最新高考阅卷标准",
  "精准适配新高考 I/II 卷及自主命题卷",
  "秒级快速诊断 · 故障无忧退款",
];

const LOADING_STEPS = ["正在扫描句型结构...", "正在对比高分范文表达...", "正在提取核心提分点..."];

export function GaokaoEssayTool() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("text");
  const [essay, setEssay] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attribution, setAttribution] = useState<MarketingAttribution | null>(null);
  const validation = useMemo(() => validateEssayText(essay), [essay]);
  const progress = Math.min(100, Math.round((validation.wordCount / GAOKAO_ESSAY_WORD_LIMITS.max) * 100));

  useEffect(() => {
    setAttribution(captureMarketingAttribution(new URLSearchParams(window.location.search)));
  }, []);

  async function handleTextSubmit() {
    setTouched(true);
    if (!validation.valid || submitting) return;

    try {
      setSubmitting(true);
      const strategy = (new URLSearchParams(window.location.search).get("mock") || "instant") as CreateReportRequest["mock_strategy"];
      const { reportHref } = await createTextReport({
        text: validation.normalized,
        taskPrompt,
        strategy: ["instant", "delayed", "failed"].includes(strategy || "") ? strategy : "instant",
        attribution,
      });
      router.push(reportHref);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "报告创建失败，请稍后重试。");
      setSubmitting(false);
    }
  }

  async function handleImageSubmit() {
    if (!GAOKAO_ESSAY_IMAGE_OCR_ENABLED) {
      window.alert("当前图片识别暂未开放。请先用微信或手机相册提取文字，再粘贴到文本框。");
      return;
    }
    if (!file || submitting) return;

    try {
      setSubmitting(true);
      const { reviewHref } = await createImageDraft({ file, attribution });
      router.push(reviewHref);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "图片上传或识别启动失败。建议先用微信提取文字后粘贴。");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(245,158,11,0.20),transparent_30%)]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[minmax(0,1.12fr)_420px] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-blue-200/20 bg-blue-50/10 px-4 py-2 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/30">
              高考英语作文 AI 诊断
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
              粘贴作文文本，先看
              <span className="text-amber-300"> 扣分风险 </span>
              再决定是否解锁完整报告
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/80">
              为确保诊断 100% 精准，建议使用微信/手机相册的‘提取文字’功能，将手写作文转化为文本后粘贴于下方文本框。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {TRUST_ITEMS.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <AiServiceNotice />
          </div>
        </div>
      </section>

      <AiCorrectionDemo />

      <section className="px-5 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70 md:p-7">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100 pb-5">
              <ModeButton active={mode === "text"} onClick={() => setMode("text")}>
                粘贴作文文本
              </ModeButton>
              <ModeButton active={mode === "image"} onClick={() => setMode("image")}>
                图片识别 Beta
              </ModeButton>
            </div>

            {mode === "text" ? (
              <TextInputPanel
                essay={essay}
                taskPrompt={taskPrompt}
                touched={touched}
                progress={progress}
                submitting={submitting}
                validation={validation}
                onEssayChange={setEssay}
                onTaskPromptChange={setTaskPrompt}
                onTouched={() => setTouched(true)}
                onFillSample={() => {
                  setTaskPrompt(sampleGaokaoTaskPrompt);
                  setEssay(sampleGaokaoEssay);
                  setTouched(true);
                }}
                onSubmit={handleTextSubmit}
              />
            ) : (
              <ImageUploadPanel file={file} submitting={submitting} onFileChange={setFile} onSubmit={handleImageSubmit} onSwitchToText={() => setMode("text")} />
            )}
          </div>

          <aside className="space-y-6">
            <PricingCard />
            <FreeBoundaryCard />
            <GaokaoEssaySupportAssistant />
            <div className="grid gap-3">
              <Link className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-500 hover:shadow-md" href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/refund-policy`}>
                查看自助重试/退款规则
              </Link>
              <Link className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-500 hover:shadow-md" href={`${GAOKAO_ESSAY_TOOL_BASE_PATH}/my-reports`}>
                查看本机历史报告
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <GaokaoEssayFooter />
    </main>
  );
}

function ModeButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
        active ? "bg-slate-950 text-white shadow-lg shadow-slate-300" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}

function TextInputPanel({
  essay,
  taskPrompt,
  touched,
  progress,
  submitting,
  validation,
  onEssayChange,
  onTaskPromptChange,
  onTouched,
  onFillSample,
  onSubmit,
}: {
  essay: string;
  taskPrompt: string;
  touched: boolean;
  progress: number;
  submitting: boolean;
  validation: ReturnType<typeof validateEssayText>;
  onEssayChange: (value: string) => void;
  onTaskPromptChange: (value: string) => void;
  onTouched: () => void;
  onFillSample: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Step 01</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">作文正文</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {GAOKAO_ESSAY_WORD_LIMITS.min}-{GAOKAO_ESSAY_WORD_LIMITS.max} 个英文词。拍照作文请先用微信或相册提取文字后粘贴。
          </p>
        </div>
        <button type="button" className="w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-500 hover:text-amber-700" onClick={onFillSample}>
          试试这篇
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        推荐流程：拍照或保存作文图片后，在微信聊天或文件传输助手中<span className="font-bold text-blue-950">长按图片</span>，选择“<span className="font-bold text-blue-950">提取文字</span>”，<span className="font-bold text-blue-950">校对后复制</span>到这里。这样通常比网页 OCR 更快，也能减少手写误识别。
      </div>

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-bold text-slate-800">作文题目/任务要求（选填）</span>
        <textarea
          value={taskPrompt}
          onChange={(event) => onTaskPromptChange(event.target.value)}
          rows={3}
          maxLength={800}
          className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          placeholder="例如：假设你是李华，请写邮件邀请外教 Mr. Smith 参加学校端午节文化活动，内容包括时间地点、主要内容、邀请理由。"
        />
        <span className="mt-2 block text-xs leading-5 text-slate-500">不填也可生成通用诊断；填写后会重点检查要点完整、格式、语气和跑题风险。</span>
      </label>

      <label className="block">
        <span className="sr-only">高考英语作文正文</span>
        <textarea
          id="gaokao-essay-textarea"
          value={essay}
          onChange={(event) => onEssayChange(event.target.value)}
          onBlur={onTouched}
          rows={16}
          className="min-h-[380px] w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 p-5 text-base leading-8 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="请粘贴高考英语作文正文，例如书信、发言稿、投稿或看图作文。"
        />
      </label>

      <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              词数 <strong className="text-slate-950">{validation.wordCount}</strong>
            </span>
            <span>上限 {GAOKAO_ESSAY_WORD_LIMITS.max}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-gradient-to-r from-blue-700 to-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {touched && validation.errors.length > 0 ? (
            <div className="mt-3 space-y-1 text-sm font-semibold text-red-700">
              {validation.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!validation.valid || submitting}
          className="min-h-12 rounded-full bg-blue-700 px-7 py-3 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 motion-safe:animate-pulse disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:motion-safe:animate-none"
        >
          {submitting ? "生成中..." : "生成免费摘要"}
        </button>
      </div>

      {submitting ? <DiagnosisLoadingExperience /> : null}
    </>
  );
}

function ImageUploadPanel({
  file,
  submitting,
  onFileChange,
  onSubmit,
  onSwitchToText,
}: {
  file: File | null;
  submitting: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onSwitchToText: () => void;
}) {
  if (!GAOKAO_ESSAY_IMAGE_OCR_ENABLED) {
    return (
      <div className="grid gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Beta</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">图片识别暂时关闭</h2>
          <p className="mt-3 leading-7 text-slate-600">为了保证高峰期稳定性，网页图片 OCR 暂不开放。请使用微信或手机相册提取文字后，回到文本框粘贴诊断。</p>
        </div>
        <WeChatGuideSteps />
        <button type="button" onClick={onSwitchToText} className="min-h-12 rounded-full bg-blue-700 px-6 py-3 text-base font-bold text-white transition hover:bg-blue-800">
          返回文本输入
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Beta</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">图片识别</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">网页 OCR 适合不方便复制文字时使用。更推荐先用微信或手机相册提取文字后粘贴，速度更快且便于自行校对。</p>
      </div>

      <WeChatGuideSteps />

      <label className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-blue-500 hover:bg-blue-50">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0] || null)} />
        <span className="text-lg font-black text-slate-950">{file ? file.name : "选择或拍摄作文照片"}</span>
        <span className="mt-2 text-sm text-slate-500">{file ? `${Math.round(file.size / 1024)} KB，点击可重新选择` : "手机端会优先打开后置摄像头"}</span>
      </label>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        图片会由浏览器直传云存储，不经过 Next.js 或 FastAPI 服务器。识别完成后必须进入校对页，系统只会用你确认后的文本生成诊断。
      </div>

      <button
        type="button"
        disabled={!file || submitting}
        onClick={onSubmit}
        className="min-h-12 rounded-full bg-blue-700 px-6 py-3 text-base font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {submitting ? "上传并识别中..." : "上传图片并进入校对"}
      </button>
    </div>
  );
}

function DiagnosisLoadingExperience() {
  return (
    <div
      className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-slate-950 p-5 text-blue-50 shadow-xl shadow-blue-200/60"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 rounded-full border border-blue-300/30 bg-blue-400/10">
          <span className="absolute inset-2 rounded-full bg-amber-300 motion-safe:animate-pulse" />
          <span className="absolute inset-0 rounded-full border border-amber-200/60 opacity-70 motion-safe:animate-ping" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">AI 正在生成免费摘要</p>
          <div className="mt-1 text-xs font-semibold text-blue-100/80">{LOADING_STEPS[0]}</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {[68, 92, 78].map((width, index) => (
          <div key={width} className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-300 via-amber-300 to-blue-100 motion-safe:animate-pulse" style={{ width: `${width}%`, animationDelay: `${index * 160}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeChatGuideSteps() {
  return (
    <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
      <li className="rounded-xl bg-slate-50 p-3">1. 把作文照片发到微信“文件传输助手”或任意聊天。</li>
      <li className="rounded-xl bg-slate-50 p-3">2. 长按图片，选择“提取文字”。</li>
      <li className="rounded-xl bg-slate-50 p-3">3. 复制识别出的英文，先简单校对，再粘贴到文本框。</li>
    </ol>
  );
}

function PricingCard() {
  const [selectedProduct, setSelectedProduct] = useState<"single" | "group">("group");
  const [paymentHint, setPaymentHint] = useState("先生成免费摘要，系统拿到报告编号后才能进入付款页。");
  const products = [
    {
      id: "single" as const,
      badge: "独立解锁",
      title: "最后冲刺抢分包（20篇深度精诊特权）",
      price: formatCny(GAOKAO_ESSAY_PRICING.singlePriceCents),
      unit: "",
      description: "专为考前冲刺定制。包含 20 篇深度精改额度，并限时开放《2026 AI 演算母题库》特权。折合低至 4.9元/篇。对标 2026 最新高考阅卷标准，秒出万字级诊断报告。闭眼冲刺，不留死角。",
      highlights: ["逐句定位扣分点", "两版范文", "AI 演算母题库"],
    },    {
      id: "group" as const,
      badge: "推荐",
      title: "同学组队价",
      price: formatCny(GAOKAO_ESSAY_PRICING.groupPriceCents),
      unit: "/ 人",
      description: "发起拼团，分享给同学立享 ￥53 特惠！3 人成团，每人皆可获得【最后冲刺抢分包（20篇额度）】及【2026 AI 演算母题库】。",
      highlights: ["同享 20 篇", "立省 46 元", "极速成团"],
    },
  ];

  function handlePricingClick(productId: "single" | "group") {
    setSelectedProduct(productId);
    setPaymentHint("已记录你的解锁偏好。请先粘贴作文并生成免费摘要，报告页会提供对应付款入口。");
    document.getElementById("gaokao-essay-textarea")?.focus();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-amber-100/60" />
      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Unlock</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">选择完整报告解锁方式</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">首页只记录偏好；生成报告后进入真实付款页。</p>
      </div>
      <div className="relative mt-5 grid gap-4">
        {products.map((product) => {
          const selected = selectedProduct === product.id;
          const isGroup = product.id === "group";
          return (
            <button
              key={product.id}
              type="button"
              aria-pressed={selected}
              onClick={() => handlePricingClick(product.id)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                selected ? "border-2 border-blue-700 bg-gradient-to-br from-blue-50 via-white to-amber-50 shadow-lg shadow-amber-100" : "border-slate-200 bg-white hover:border-blue-500 hover:shadow-md"
              }`}
            >
              {selected ? <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-amber-400 to-blue-700" /> : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${isGroup ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-600"}`}>
                    {product.badge}
                  </span>
                  <h3 className={`mt-3 text-base font-black ${selected ? "text-blue-950" : "text-slate-800"}`}>{product.title}</h3>
                </div>
                <span className={`mt-1 h-5 w-5 rounded-full border ${selected ? "border-blue-700 bg-blue-700 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" : "border-slate-300 bg-white"}`}>
                  {selected ? <span className="mx-auto mt-1 block h-2 w-2 rounded-full bg-white" /> : null}
                </span>
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className={`text-5xl font-black tracking-tight ${selected ? "text-blue-950" : "text-slate-950"}`}>{product.price}</span>
                {product.unit ? <span className="pb-2 text-sm font-black text-blue-700">{product.unit}</span> : null}
              </div>
              <p className={`mt-3 text-sm leading-6 ${selected ? "text-blue-950" : "text-slate-600"}`}>{product.description}</p>
              {product.id === "single" ? <GaokaoEssaySinglePlanCompact /> : null}
              {product.id === "group" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.highlights.map((item) => (
                    <span key={item} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${selected ? "bg-white/80 text-blue-800" : "bg-slate-50 text-slate-500"}`}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              <div
                className={`mt-4 flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-black transition ${
                  selected ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-200 group-hover:bg-amber-400" : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-slate-950"
                }`}
              >
                {product.id === "single" ? "立即开通 20 篇提分权限" : "发起组队，即刻开通抢分包"}
              </div>
            </button>
          );
        })}
      </div>
      <PaymentTrustBadges />
      <p className="mt-3 text-xs leading-5 text-slate-500">{paymentHint}</p>
    </div>
  );
}

function PaymentTrustBadges() {
  const badges = [
    { icon: "盾", text: "微信/支付宝担保交易" },
    { icon: "退", text: "不满意支持自助退款" },
    { icon: "记", text: "诊断与订单全程留痕" },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {badges.map((badge) => (
          <div key={badge.text} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-400 shadow-sm">
              {badge.icon}
            </span>
            <span>{badge.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FreeBoundaryCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70">
      <h2 className="text-lg font-black text-slate-950">为什么值得解锁</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
        <li className="rounded-xl bg-slate-50 p-3">
          免费摘要只告诉你哪里可能丢分；完整报告会把问题<span className="font-bold text-blue-600">定位到句子</span>，并给出<span className="font-bold text-blue-600">可直接模仿</span>的改写路径。
        </li>
        <li className="rounded-xl bg-slate-50 p-3">
          99 元抢分包包含 20 篇深度精诊额度，覆盖<span className="font-bold text-amber-600">逐句精改</span>、逻辑诊断、稳妥版范文和<span className="font-bold text-amber-600">两版范文</span>，适合考前集中补短板。
        </li>
        <li className="rounded-xl bg-slate-50 p-3">
          考前抢分利器：无需苦等老师批改，AI 引擎<span className="font-bold text-blue-600">秒级出具</span>上万字深度诊断，效果<span className="font-bold text-amber-600">等同名师1对1</span> 精批指导。
        </li>
      </ul>
    </div>
  );
}
