import type { Metadata } from "next";
import { GaokaoEssayReportView } from "@/components/gaokao-essay/GaokaoEssayReportView";

export const metadata: Metadata = {
  title: "高考英语作文诊断报告 | AI 免费摘要",
  description: "高考英语作文 AI 诊断报告页。真实用户报告页应保持 noindex，避免作文正文被搜索引擎收录。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GaokaoEssayReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <GaokaoEssayReportView reportId={reportId} />;
}
