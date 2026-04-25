import type { ReactNode } from "react";
import { LiveChatScript } from "@/components/layout/LiveChatScript";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://qqbytop.com"),
  title: {
    default: "北京全球博译翻译 | 跨境合规翻译 · 技术本地化 · 专利文档翻译",
    template: "%s | QQBY 全球博译",
  },
  description:
    "北京全球博译翻译服务有限公司提供跨境电商合规翻译、法律合规翻译、技术文档本地化与专业文档翻译服务。",
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
