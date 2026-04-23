"use client";

import { useState } from "react";

export function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2">
          <a className="rounded bg-trust-600 px-4 py-2 text-sm font-semibold text-white shadow-lg" href="tel:400-869-9562">电话咨询</a>
          <a className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg" href="/zh/quote">提交需求</a>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="h-12 rounded bg-brand-900 px-4 text-sm font-semibold text-white shadow-xl" aria-label="联系 QQBY">
        联系我们
      </button>
    </div>
  );
}
