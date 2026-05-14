import type { Metadata } from "next";
import { BusinessToolFooter, BusinessToolHeader } from "@/components/diagnose-tools/BusinessToolChrome";
import { IeltsSpeakingTool } from "@/components/ielts-speaking/IeltsSpeakingTool";

export const metadata: Metadata = {
  title: "雅思口语 AI 诊断工具 | 当季题库录音练习与深度扣分报告",
  description:
    "围绕雅思口语 Part 1、Part 2、Part 3 当季题库录音练习，生成免费基础报告，并可解锁四项预估分、扣分证据、逐句建议和 7 天训练计划。",
  alternates: {
    canonical: "/tools/ielts-speaking",
  },
  openGraph: {
    title: "雅思口语 AI 诊断工具 | QQBYTOP",
    description: "录音回答一道雅思口语题，先看免费基础报告，再决定是否解锁深度扣分原因。",
    url: "https://qqbytop.com/tools/ielts-speaking",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function IeltsSpeakingPage() {
  return (
    <div className="tool-with-main-nav ielts-tool">
      <BusinessToolHeader
        quoteSource="ielts-speaking-tool"
        ctaHref="/tools/ielts-speaking#pricing"
        ctaLabel="查看诊断包"
      />
      <IeltsSpeakingTool />
      <BusinessToolFooter
        requestHref="/tools/ielts-speaking#pricing"
        eyebrow="IELTS Speaking Diagnostic"
        title="雅思口语 AI 诊断"
        description="服务方向：当季雅思口语题库练习、AI 预估分、发音与流利度诊断、深度扣分报告和考前训练计划。"
      />
    </div>
  );
}
