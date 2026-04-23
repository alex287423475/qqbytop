"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/site-data";

export function FloatingContact({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2">
          <a className="rounded bg-trust-600 px-4 py-2 text-sm font-semibold text-white shadow-lg" href="tel:400-869-9562">
            电话咨询
          </a>
          <Link className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg" href={`/${locale}/quote`}>
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
