import type { Metadata } from "next";
import { GaokaoEssayTool } from "@/components/gaokao-essay/GaokaoEssayTool";

export const metadata: Metadata = {
  title: "高考英语作文 AI 诊断 | 免费摘要与完整报告解锁",
  description: "面向高考英语作文的 AI 自动诊断工具。支持文本输入、图片识别校对、预估分、风险摘要、完整报告解锁和自助重试退款闭环。",
  alternates: {
    canonical: "/tools/gaokao-english-essay-diagnosis",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GaokaoEnglishEssayDiagnosisPage() {
  return <GaokaoEssayTool />;
}
