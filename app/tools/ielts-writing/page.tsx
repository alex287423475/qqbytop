import type { Metadata } from "next";
import { IeltsWritingHome } from "@/components/ielts-writing/IeltsWritingExperience";

export const metadata: Metadata = {
  title: "雅思写作 AI 诊断工具 | 免费基础报告与深度批改",
  description: "粘贴 IELTS Writing Task 1 / Task 2 作文，获取免费基础报告，并可解锁逐句批改、四项评分和 Band 7+ 改写建议。",
  alternates: {
    canonical: "/tools/ielts-writing",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function IeltsWritingPage() {
  return <IeltsWritingHome />;
}
