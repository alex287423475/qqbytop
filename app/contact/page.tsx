import type { Metadata } from "next";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "联系我们 | 全球博译",
  description: "联系北京全球博译翻译服务有限公司，咨询翻译、本地化、跨境合规和申请材料服务。",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <main className="legal-page-shell">
      <article className="legal-card">
        <p className="eyebrow">Contact</p>
        <h1>联系我们</h1>
        <p>北京全球博译翻译服务有限公司，为企业和个人客户提供专业翻译、本地化、跨境合规语言服务与申请材料支持。</p>

        <h2>联系方式</h2>
        <p>
          电话：<a href={contact.phoneHref}>{contact.phone}</a>
          <br />
          邮箱：<a href={contact.emailHref}>{contact.email}</a>
          <br />
          地址：{contact.address}
        </p>

        <h2>常见咨询内容</h2>
        <ul>
          <li>文档翻译、证件翻译、合同和法律材料翻译。</li>
          <li>跨境电商、独立站、包装、说明书和合规材料翻译。</li>
          <li>留学文书、英文简历、推荐信和申请材料包审核。</li>
        </ul>

        <h2>隐私与广告政策</h2>
        <p>
          提交信息前，你可以阅读 <a href="/privacy-policy">隐私政策</a>、{" "}
          <a href="/advertising-cookie-policy">广告与 Cookie 政策</a> 和 <a href="/terms">服务条款</a>。
        </p>
      </article>
    </main>
  );
}
