import type { Metadata } from "next";
import { BusinessToolFooter, BusinessToolHeader } from "@/components/diagnose-tools/BusinessToolChrome";
import { EssayDiagnosisForm } from "@/components/diagnose-tools/EssayDiagnosisForm";

export const metadata: Metadata = {
  title: "留学文书诊断工具 | PS / SOP 初稿结构与表达检查",
  description:
    "免费诊断 PS、SOP、Motivation Letter 初稿中的主题、结构、申请匹配、经历说服力和英文表达问题。默认不保存完整正文，不提交查重系统。",
  alternates: {
    canonical: "/tools/study-abroad-essay-check",
  },
  openGraph: {
    title: "留学文书诊断工具 | 全球博译",
    description: "粘贴留学文书初稿，获取结构化诊断报告和修改优先级。",
    url: "https://qqbytop.com/tools/study-abroad-essay-check",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function StudyAbroadEssayCheckPage() {
  const requestHref = "/tools/study-abroad-essay-check/request";

  return (
    <div className="tool-with-main-nav">
      <BusinessToolHeader quoteSource="study-abroad-essay-tool" ctaHref={requestHref} ctaLabel="提交文书需求" />
      <EssayDiagnosisForm />
      <BusinessToolFooter requestHref={requestHref} />
    </div>
  );
}
