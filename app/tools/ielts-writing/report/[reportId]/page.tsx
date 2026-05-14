import type { Metadata } from "next";
import { IeltsWritingReport } from "@/components/ielts-writing/IeltsWritingExperience";

export const metadata: Metadata = {
  title: "雅思写作诊断报告 | AI 预估分与扣分点",
  description: "雅思写作 AI 诊断报告示例。用户真实报告页应设置 noindex，避免作文内容被搜索引擎收录。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function IeltsWritingReportPage() {
  return <IeltsWritingReport />;
}
