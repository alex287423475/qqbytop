import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "广告与 Cookie 政策 | 全球博译",
  description: "说明全球博译官网使用 Cookie、Google AdSense 和第三方广告技术的方式。",
  alternates: { canonical: "/advertising-cookie-policy" },
  robots: { index: true, follow: true },
};

export default function AdvertisingCookiePolicyPage() {
  return (
    <main className="legal-page-shell">
      <article className="legal-card">
        <p className="eyebrow">Advertising & Cookies</p>
        <h1>广告与 Cookie 政策</h1>
        <p>更新日期：2026-05-04</p>

        <h2>Cookie 的用途</h2>
        <p>
          Cookie 和类似技术可用于保持网站功能、分析访问情况、衡量页面表现、控制滥用请求，并在未来根据 Google AdSense 等广告服务展示广告。
        </p>

        <h2>Google AdSense 与第三方广告</h2>
        <p>
          第三方供应商（包括 Google）可能使用 Cookie 根据用户对本站或其他网站的访问记录投放广告。Google 的广告 Cookie 可帮助其及合作伙伴向用户展示个性化或非个性化广告。
        </p>
        <p>
          你可以访问{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            Google 广告技术说明
          </a>
          ，了解广告 Cookie 和广告个性化设置。本站也会按照适用地区要求，通过 Google AdSense Privacy & messaging 或其他合规方式提供同意、拒绝或管理偏好的入口。
        </p>

        <h2>用户如何管理 Cookie</h2>
        <ul>
          <li>你可以在浏览器设置中删除或阻止 Cookie。</li>
          <li>部分 Cookie 被阻止后，网站诊断、表单提交或统计功能可能受影响。</li>
          <li>来自欧盟、英国、瑞士或其他有同意要求地区的用户，应根据页面提示管理广告和 Cookie 偏好。</li>
        </ul>

        <h2>相关页面</h2>
        <ul>
          <li>
            <a href="/privacy-policy">隐私政策</a>
          </li>
          <li>
            <a href="/terms">服务条款</a>
          </li>
          <li>
            <a href="/contact">联系我们</a>
          </li>
        </ul>
      </article>
    </main>
  );
}
