"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { contact, getQqHref, getWhatsappHref } from "@/lib/contact";
import type { Locale } from "@/lib/site-data";

export function FloatingContact({ locale }: { locale: Locale }) {
<<<<<<< ours
  const [open, setOpen] = useState(false);
  const [showWechat, setShowWechat] = useState(false);
=======
  const [open, setOpen] = useState(true);
>>>>>>> theirs
  const whatsappHref = getWhatsappHref(locale);
  const qqHref = getQqHref();

  return (
<<<<<<< ours
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 space-y-2 rounded border border-slate-200 bg-white p-3 text-sm shadow-2xl">
          {showWechat && (
            <div className="mb-3 rounded bg-slate-50 p-3 text-center">
              <Image src={contact.wechatQr} alt="微信咨询二维码" width={160} height={160} className="mx-auto h-40 w-40" />
              <p className="mt-2 text-xs leading-5 text-slate-600">{contact.wechatHint}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowWechat((value) => !value)}
            className="block w-full rounded bg-emerald-600 px-4 py-2 text-left font-semibold text-white hover:bg-emerald-500"
          >
            微信扫码咨询
          </button>
          {whatsappHref && (
            <a className="block rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500" href={whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
          <a className="block rounded bg-trust-600 px-4 py-2 font-semibold text-white hover:bg-trust-600/90" href={contact.phoneHref}>
            电话咨询
          </a>
          {qqHref && (
            <a className="block rounded bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500" href={qqHref} target="_blank" rel="noreferrer">
              QQ 咨询
            </a>
          )}
          <Link className="block rounded bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500" href={`/${locale}/quote`}>
            提交需求
          </Link>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="h-12 rounded bg-brand-900 px-4 text-sm font-semibold text-white shadow-xl"
        aria-label="联系 QQBY"
      >
        联系我们
      </button>
    </div>
=======
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

            <a className="block rounded bg-trust-600 px-4 py-3 text-center font-semibold text-white hover:bg-trust-600/90" href={contact.phoneHref}>
              电话咨询：{contact.phone}
            </a>

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
>>>>>>> theirs
  );
}
