import type { Metadata } from "next";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "服务条款 | 全球博译",
  description: "全球博译官网服务条款，说明网站内容、诊断工具、咨询服务和责任边界。",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="legal-page-shell">
      <article className="legal-card">
        <p className="eyebrow">Terms of Service</p>
        <h1>服务条款</h1>
        <p>更新日期：2026-05-04</p>

        <h2>网站内容</h2>
        <p>
          本站内容用于介绍翻译、本地化、跨境合规语言服务和在线诊断工具。页面信息不构成法律、移民、招生或官方审核意见。
        </p>

        <h2>诊断工具边界</h2>
        <p>
          留学文书诊断、商务形象诊断等工具用于初步识别材料问题和服务需求。诊断结果仅供参考，不承诺录取、签证、平台审核或商业结果。
        </p>

        <h2>咨询与服务</h2>
        <p>
          用户提交需求后，我们会根据材料类型、语种、用途、时效和难度提供服务建议或报价。正式服务范围以双方确认的报价单、合同或书面沟通为准。
        </p>

        <h2>禁止行为</h2>
        <ul>
          <li>不得恶意刷接口、攻击网站或提交违法内容。</li>
          <li>不得将诊断结果冒充官方机构意见。</li>
          <li>不得未经授权复制、抓取或批量复用本站内容。</li>
        </ul>

        <h2>联系我们</h2>
        <p>
          如对本条款有疑问，请联系：<a href={contact.emailHref}>{contact.email}</a> 或{" "}
          <a href={contact.phoneHref}>{contact.phone}</a>。
        </p>
      </article>
    </main>
  );
}
