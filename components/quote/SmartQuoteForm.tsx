"use client";

import { useState } from "react";

const serviceTypes = [
  ["standard", "标准翻译", "普通商务/内部阅读材料", 0.26],
  ["professional", "专业翻译 + 审校", "法律/技术/金融/医学材料", 0.32],
  ["premium", "高级翻译 + 母语润色", "营销/出版/官网内容", 0.4],
] as const;

export function SmartQuoteForm() {
  const [service, setService] = useState("standard");
  const [words, setWords] = useState(0);
  const unit = serviceTypes.find(([id]) => id === service)?.[3] ?? 0.26;
  const estimate = words > 0 ? Math.ceil(words * unit) : 0;

  return (
    <form className="space-y-7" action={`mailto:info@qqbytop.com`} method="post" encType="text/plain">
      <fieldset>
        <legend className="font-bold text-brand-900">选择服务级别</legend>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {serviceTypes.map(([id, label, desc]) => (
            <label key={id} className={`cursor-pointer border p-5 ${service === id ? "border-brand-600 bg-brand-100" : "border-slate-200"}`}>
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
          <select name="language_pair" className="mt-2 w-full border border-slate-300 px-4 py-3">
            <option>中 → 英</option>
            <option>英 → 中</option>
            <option>中 → 日</option>
            <option>中 → 韩</option>
            <option>其他</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-brand-900">文件格式</span>
          <select name="file_format" className="mt-2 w-full border border-slate-300 px-4 py-3">
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
          <input type="number" name="word_count" min={0} value={words || ""} onChange={(event) => setWords(Number(event.target.value))} className="w-full border border-slate-300 px-4 py-3" />
          <div className="min-w-40 bg-slate-50 px-5 py-3 text-center">
            <span className="block text-xs text-slate-500">预估费用</span>
            <strong className="text-2xl text-brand-600">{estimate ? `¥${estimate.toLocaleString()}` : "待计算"}</strong>
          </div>
        </div>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <input name="name" required placeholder="您的姓名" className="border border-slate-300 px-4 py-3" />
        <input name="contact" required placeholder="手机 / 邮箱 / 微信" className="border border-slate-300 px-4 py-3" />
      </div>
      <textarea name="notes" rows={4} placeholder="请说明用途、截止时间、是否需要盖章或格式还原" className="w-full border border-slate-300 px-4 py-3" />
      <button className="w-full rounded bg-brand-600 px-6 py-4 font-semibold text-white hover:bg-brand-500">提交询价，30 分钟内响应</button>
    </form>
  );
}
