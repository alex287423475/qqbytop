"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { localeNames, locales, nav, type Locale } from "@/lib/site-data";

export function Header({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function localized(href: string) {
    return `/${locale}${href}`;
  }

  function switchLocale(nextLocale: string) {
    const parts = pathname.split("/");
    if (locales.includes(parts[1] as Locale)) {
      parts[1] = nextLocale;
      return parts.join("/") || `/${nextLocale}`;
    }
    return `/${nextLocale}`;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <span className="text-xl font-bold text-brand-900">QQBY<span className="text-brand-600">.</span></span>
          <span className="hidden text-sm text-slate-500 sm:inline">全球博译翻译</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={localized(item.href)}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(localized(item.href)) ? "text-brand-600" : "text-slate-600 hover:text-brand-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <select
            className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-600"
            value={locale}
            onChange={(event) => {
              window.location.href = switchLocale(event.target.value);
            }}
            aria-label="切换语言"
          >
            {locales.map((item) => (
              <option key={item} value={item}>{localeNames[item]}</option>
            ))}
          </select>
          <Link href={`/${locale}/quote`} className="hidden rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 sm:inline-flex">
            获取报价
          </Link>
          <button className="rounded p-2 text-slate-700 lg:hidden" onClick={() => setOpen(!open)} aria-label="打开导航">
            {open ? "关闭" : "菜单"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {nav.map((item) => (
              <Link key={item.href} href={localized(item.href)} onClick={() => setOpen(false)} className="py-2 text-base font-medium text-slate-700">
                {item.label}
              </Link>
            ))}
            <Link href={`/${locale}/quote`} onClick={() => setOpen(false)} className="rounded bg-brand-600 px-4 py-3 text-center font-semibold text-white">
              获取报价
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
