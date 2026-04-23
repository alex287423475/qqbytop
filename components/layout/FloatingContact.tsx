"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { contact, getQqHref, getWhatsappHref } from "@/lib/contact";
import type { Locale } from "@/lib/site-data";

export function FloatingContact({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const whatsappHref = getWhatsappHref(locale);
  const qqHref = getQqHref();

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(contact.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
        <div className="w-72 overflow-hidden rounded border border-slate-200 bg-white text-sm shadow-2xl">
          <div className="bg-brand-900 px-4 py-3 text-white">
            <p className="font-semibold">立即咨询 QQBY</p>
            <p className="mt-1 text-xs text-slate-300">扫码、电话或提交需求，项目经理会尽快响应。</p>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded bg-slate-50 p-3 text-center">
              <Image src={contact.wechatQr} alt="微信咨询二维码" width={176} height={176} className="mx-auto h-44 w-44" priority />
              <p className="mt-2 text-xs leading-5 text-slate-600">{contact.wechatHint}</p>
            </div>

            <div className="rounded bg-trust-600 px-4 py-3 text-center text-white">
              <p className="text-xs opacity-90">电话咨询</p>
              <p className="mt-1 text-lg font-bold tracking-wide">{contact.phone}</p>
            </div>

            <button
              type="button"
              onClick={copyPhone}
              className="w-full rounded border border-slate-200 px-3 py-2 text-center font-semibold text-brand-900 hover:bg-slate-50"
            >
              {copied ? "电话已复制" : "复制电话"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <Link className="rounded bg-brand-600 px-3 py-2 text-center font-semibold text-white hover:bg-brand-500" href={`/${locale}/quote`}>
                提交需求
              </Link>
              <a className="rounded border border-slate-200 px-3 py-2 text-center font-semibold text-brand-900 hover:bg-slate-50" href={contact.emailHref}>
                发邮件
              </a>
            </div>

            {(whatsappHref || qqHref) && (
              <div className="grid grid-cols-2 gap-2">
                {whatsappHref && (
                  <a className="rounded bg-green-600 px-3 py-2 text-center font-semibold text-white hover:bg-green-500" href={whatsappHref} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                )}
                {qqHref && (
                  <a className="rounded bg-sky-600 px-3 py-2 text-center font-semibold text-white hover:bg-sky-500" href={qqHref} target="_blank" rel="noreferrer">
                    QQ 咨询
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="h-11 rounded bg-brand-900 px-4 text-sm font-semibold text-white shadow-xl hover:bg-brand-800"
        aria-label={open ? "收起联系面板" : "展开联系面板"}
      >
        {open ? "收起联系" : "联系我们"}
      </button>
    </aside>
  );
}
