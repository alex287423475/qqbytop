"use client";

import { useState } from "react";
import { contact } from "@/lib/contact";

const navItems = [
  { href: "/zh/services", label: "翻译服务" },
  { href: "/zh/industries", label: "行业方案" },
  { href: "/zh/tools", label: "诊断工具", active: true },
  { href: "/zh/about", label: "关于我们" },
  { href: "/zh/pricing", label: "价格说明" },
  { href: "/zh/blog", label: "专业资讯" },
];

export function BusinessToolHeader({ quoteSource }: { quoteSource: string }) {
  const [open, setOpen] = useState(false);
  const quoteHref = `/zh/quote?source=${encodeURIComponent(quoteSource)}`;

  return (
    <header className="main-site-nav" aria-label="全球博译主站导航">
      <div className="main-site-nav-inner">
        <a className="main-site-logo" href="/zh" aria-label="全球博译首页">
          <img src="/brand/qqby-logo-pro.svg" alt="全球博译 Pro Compliance" />
        </a>
        <nav className="main-site-links" aria-label="主导航">
          {navItems.map((item) => (
            <a key={item.href} className={item.active ? "active" : undefined} href={item.href} aria-current={item.active ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="main-site-phone" href={contact.phoneHref} aria-label={`拨打咨询电话 ${contact.phone}`}>
          <span>咨询电话</span>
          <strong>{contact.phone}</strong>
        </a>
        <a className="main-site-cta" href={quoteHref}>
          获取报价
        </a>
        <button
          className="main-site-menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="mainSiteMobileNav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "关闭" : "菜单"}
        </button>
      </div>
      <nav id="mainSiteMobileNav" className="main-site-mobile-links" aria-label="移动端主导航" hidden={!open}>
        {navItems.map((item) => (
          <a key={item.href} className={item.active ? "active" : undefined} href={item.href} aria-current={item.active ? "page" : undefined}>
            {item.label}
          </a>
        ))}
        <a href={contact.phoneHref}>咨询电话：{contact.phone}</a>
        <a href={quoteHref}>获取报价</a>
      </nav>
    </header>
  );
}

export function BusinessToolFooter() {
  return (
    <footer className="site-footer essay-tool-footer">
      <div>
        <p className="eyebrow">Study Abroad Essay Check</p>
        <strong>留学文书诊断</strong>
        <p>服务方向：PS / SOP 诊断、文书润色、结构重写、英文简历优化与申请材料包审核。</p>
        <p className="adsense-footer-note">
          本站可能使用 Google AdSense、统计分析和第三方 Cookie。请阅读隐私政策与广告 Cookie 政策了解数据使用方式。
        </p>
      </div>
      <div className="footer-links">
        <a href={contact.emailHref}>{contact.email}</a>
        <a href="/zh/about">关于我们</a>
        <a href="/contact">联系我们</a>
        <a href="/privacy-policy">隐私政策</a>
        <a href="/advertising-cookie-policy">广告与 Cookie</a>
        <a href="/terms">服务条款</a>
        <a href="/zh/quote?source=study-abroad-essay-tool">提交需求</a>
      </div>
    </footer>
  );
}
