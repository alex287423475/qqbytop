"use client";

import { FormEvent, useMemo, useState } from "react";
import type { QuotePrefill, QuoteServiceType } from "@/lib/quote-page";

const serviceTypes = [
  ["standard", "标准翻译", "适合普通商务材料、内部阅读材料", 0.26],
  ["professional", "专业翻译 + 审校", "适合法律、技术、金融、医学等专业材料", 0.32],
  ["premium", "高级翻译 + 母语润色", "适合营销、出版、官网内容与高要求公开材料", 0.4],
] as const;

type ServiceType = (typeof serviceTypes)[number][0];
type SubmitState = "idle" | "submitting" | "success" | "error";

type SmartQuoteFormProps = {
  prefill?: QuotePrefill;
};

export function SmartQuoteForm({ prefill }: SmartQuoteFormProps) {
  const [service, setService] = useState<ServiceType>((prefill?.serviceType as QuoteServiceType) || "standard");
  const [languagePair, setLanguagePair] = useState(prefill?.languagePair || "中 -> 英");
  const [fileFormat, setFileFormat] = useState(prefill?.fileFormat || "Word / PDF / PPT / Excel");
  const [notes, setNotes] = useState(prefill?.notes || "");
  const [words, setWords] = useState(0);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const unit = serviceTypes.find(([id]) => id === service)?.[3] ?? 0.26;
  const estimate = words > 0 ? Math.ceil(words * unit) : 0;
  const estimateText = useMemo(() => (estimate ? `约${estimate.toLocaleString()}元` : "待计算"), [estimate]);
  const isLocked = status === "submitting" || status === "success";

  function resetForNewQuote() {
    setStatus("idle");
    setMessage("");
    setWords(0);
    setService((prefill?.serviceType as QuoteServiceType) || "standard");
    setLanguagePair(prefill?.languagePair || "中 -> 英");
    setFileFormat(prefill?.fileFormat || "Word / PDF / PPT / Excel");
    setNotes(prefill?.notes || "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocked) return;

    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          estimated_fee: estimate,
          service_type: service,
          source: prefill?.source || "",
          category: prefill?.category || "",
        }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "提交失败，请稍后再试。");
      }

      setStatus("success");
      setMessage(data.message || "需求已提交，我们会尽快联系您。");
      form.reset();
      setWords(0);
      setService((prefill?.serviceType as QuoteServiceType) || "standard");
      setLanguagePair(prefill?.languagePair || "中 -> 英");
      setFileFormat(prefill?.fileFormat || "Word / PDF / PPT / Excel");
      setNotes(prefill?.notes || "");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "提交失败，请稍后再试。");
    }
  }

  return (
    <form className="space-y-7" onSubmit={handleSubmit}>
      <input type="hidden" name="source" value={prefill?.source || ""} />
      <input type="hidden" name="category" value={prefill?.category || ""} />

      <fieldset disabled={isLocked}>
        <legend className="font-bold text-brand-900">选择服务级别</legend>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {serviceTypes.map(([id, label, desc]) => (
            <label
              key={id}
              className={`cursor-pointer border p-5 ${service === id ? "border-brand-600 bg-brand-100" : "border-slate-200"} ${
                isLocked ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              <input className="sr-only" type="radio" name="service_type" value={id} checked={service === id} onChange={() => setService(id)} />
              <span className="block font-semibold text-brand-900">{label}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-brand-900">翻译方向</span>
          <select
            name="language_pair"
            value={languagePair}
            onChange={(event) => setLanguagePair(event.target.value)}
            disabled={isLocked}
            className="mt-2 w-full border border-slate-300 px-4 py-3 disabled:bg-slate-50"
          >
            <option>中 -&gt; 英</option>
            <option>英 -&gt; 中</option>
            <option>中 -&gt; 日</option>
            <option>中 -&gt; 韩</option>
            <option>其他</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-brand-900">文件格式</span>
          <select
            name="file_format"
            value={fileFormat}
            onChange={(event) => setFileFormat(event.target.value)}
            disabled={isLocked}
            className="mt-2 w-full border border-slate-300 px-4 py-3 disabled:bg-slate-50"
          >
            <option>Word / PDF / PPT / Excel</option>
            <option>SDLXLIFF / XLIFF</option>
            <option>IDML / XML / HTML</option>
            <option>其他</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-brand-900">预估字数</span>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row">
          <input
            type="number"
            name="word_count"
            min={0}
            value={words || ""}
            onChange={(event) => setWords(Number(event.target.value))}
            disabled={isLocked}
            className="w-full border border-slate-300 px-4 py-3 disabled:bg-slate-50"
          />
          <div className="min-w-40 bg-slate-50 px-5 py-3 text-center">
            <span className="block text-xs text-slate-500">预估费用</span>
            <strong className="text-2xl text-brand-600">{estimateText}</strong>
          </div>
        </div>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <input name="name" required disabled={isLocked} placeholder="您的姓名" className="border border-slate-300 px-4 py-3 disabled:bg-slate-50" />
        <input
          name="contact"
          required
          disabled={isLocked}
          placeholder="手机 / 邮箱 / 微信"
          className="border border-slate-300 px-4 py-3 disabled:bg-slate-50"
        />
      </div>
      <textarea
        name="notes"
        rows={5}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        disabled={isLocked}
        placeholder="请说明用途、截止时间、是否需要盖章或格式还原"
        className="w-full border border-slate-300 px-4 py-3 disabled:bg-slate-50"
      />

      {message && (
        <p className={`rounded px-4 py-3 text-sm ${status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </p>
      )}

      <button
        disabled={isLocked}
        className="w-full rounded bg-brand-600 px-6 py-4 font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {status === "submitting" ? "正在提交..." : status === "success" ? "已提交，请等待客服联系" : "提交询价，30 分钟内响应"}
      </button>

      {status === "success" && (
        <button type="button" onClick={resetForNewQuote} className="w-full border border-brand-600 px-6 py-3 font-semibold text-brand-600 hover:bg-brand-100">
          继续提交新需求
        </button>
      )}
    </form>
  );
}
