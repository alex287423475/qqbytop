import type { Metadata } from "next";
import { IeltsWritingTopics } from "@/components/ielts-writing/IeltsWritingExperience";

export const metadata: Metadata = {
  title: "雅思写作题库 | Task 1 / Task 2 题目与诊断入口",
  description: "雅思写作 Task 1 与 Task 2 高频题库，每个题目提供写作方向、表达建议和 AI 诊断入口。",
  alternates: {
    canonical: "/tools/ielts-writing/topics",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function IeltsWritingTopicsPage() {
  return <IeltsWritingTopics />;
}
