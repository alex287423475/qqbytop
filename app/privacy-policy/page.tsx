import type { Metadata } from "next";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "隐私政策 | 全球博译",
  description: "全球博译官网隐私政策，说明个人信息、Cookie、广告服务、联系表单和诊断工具数据的处理方式。",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page-shell">
      <article className="legal-card">
        <p className="eyebrow">Privacy Policy</p>
        <h1>隐私政策</h1>
        <p>更新日期：2026-05-04</p>
        <p>
          北京全球博译翻译服务有限公司重视用户隐私。本政策说明你访问本站、使用诊断工具、提交咨询或与我们联系时，本站可能处理的信息类型和用途。
        </p>

        <h2>我们可能收集的信息</h2>
        <ul>
          <li>你主动提交的姓名、电话、邮箱、微信、项目需求、文件类型和咨询备注。</li>
          <li>诊断工具运行所需的表单信息和文本内容。留学文书诊断默认不保存完整正文。</li>
          <li>浏览器、设备、页面访问、来源页面、IP 地址、Cookie 或类似标识符等技术信息。</li>
        </ul>

        <h2>信息用途</h2>
        <ul>
          <li>用于回复咨询、评估翻译或申请材料服务需求、提供报价和安排项目沟通。</li>
          <li>用于保障网站安全、排查错误、控制接口滥用和改进页面体验。</li>
          <li>用于在符合法律和平台政策的前提下展示广告、统计访问数据和衡量内容效果。</li>
        </ul>

        <h2>Google 产品、广告和 Cookie</h2>
        <p>
          本站可能使用 Google AdSense、Google Analytics 或其他 Google 产品。第三方供应商（包括 Google）可能使用 Cookie、Web beacon、IP 地址或其他标识符来投放广告、衡量广告效果和防止滥用。
          你可以阅读 <a href="/advertising-cookie-policy">广告与 Cookie 政策</a>，也可以访问{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            Google 广告技术说明
          </a>
          了解 Google 如何使用广告 Cookie。
        </p>

        <h2>第三方共享</h2>
        <p>
          我们不会出售你的个人信息。为完成咨询通知、邮件发送、网站托管、数据统计、广告展示或安全防护，可能会在必要范围内使用第三方服务。相关服务商应仅按服务目的处理数据。
        </p>

        <h2>用户选择</h2>
        <ul>
          <li>你可以通过浏览器设置限制或删除 Cookie。</li>
          <li>你可以拒绝提交非必要信息，但部分咨询或诊断功能可能无法完整使用。</li>
          <li>如需查询、更正或删除你提交的联系信息，可通过下方联系方式与我们沟通。</li>
        </ul>

        <h2>联系我们</h2>
        <p>
          电话：<a href={contact.phoneHref}>{contact.phone}</a>
          <br />
          邮箱：<a href={contact.emailHref}>{contact.email}</a>
          <br />
          地址：{contact.address}
        </p>
      </article>
    </main>
  );
}
