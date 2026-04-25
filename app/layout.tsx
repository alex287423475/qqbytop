import type { ReactNode } from "react";
import { LiveChatScript } from "@/components/layout/LiveChatScript";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://qqbytop.com"),
  applicationName: "全球博译",
  authors: [{ name: "北京全球博译翻译公司", url: "https://qqbytop.com" }],
  creator: "北京全球博译翻译公司",
  publisher: "北京全球博译翻译公司",
  category: "translation services",
  title: {
    default: "北京全球博译翻译 | 跨境合规翻译 · 技术本地化 · 专利文档翻译",
    template: "%s | QQBY 全球博译",
  },
  description:
    "北京全球博译翻译服务有限公司提供跨境电商合规翻译、法律合规翻译、技术文档本地化与专业文档翻译服务。",
  keywords: "北京翻译公司, 全球博译, 证件翻译, 合同翻译, 法律翻译, 跨境电商翻译, 技术文档翻译, 专利翻译",
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://qqbytop.com/zh",
    siteName: "北京全球博译翻译公司",
    title: "北京全球博译翻译 | 跨境合规翻译 · 技术本地化 · 专利文档翻译",
    description:
      "北京全球博译翻译服务有限公司提供跨境电商合规翻译、法律合规翻译、技术文档本地化与专业文档翻译服务。",
    images: [
      {
        url: "/brand/qqby-og.svg",
        width: 1200,
        height: 630,
        alt: "北京全球博译翻译公司",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "北京全球博译翻译 | 跨境合规翻译 · 技术本地化 · 专利文档翻译",
    description:
      "北京全球博译翻译服务有限公司提供跨境电商合规翻译、法律合规翻译、技术文档本地化与专业文档翻译服务。",
    images: ["/brand/qqby-og.svg"],
  },
  icons: {
    icon: "/favicon.ico?v=20260425",
    shortcut: "/favicon.ico?v=20260425",
    apple: "/brand/qqby-icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <LiveChatScript />
      </body>
    </html>
  );
}
