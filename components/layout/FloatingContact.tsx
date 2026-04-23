"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { contact, getQqHref, getWhatsappHref } from "@/lib/contact";
import type { Locale } from "@/lib/site-data";

export function FloatingContact({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [showWechat, setShowWechat] = useState(false);
  const whatsappHref = getWhatsappHref(locale);
  const qqHref = getQqHref();

  return (
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
  );
}
