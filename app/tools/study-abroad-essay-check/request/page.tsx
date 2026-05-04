import type { Metadata } from "next";
import { BusinessToolFooter, BusinessToolHeader } from "@/components/diagnose-tools/BusinessToolChrome";
import { StudyAbroadLeadRequestForm } from "@/components/diagnose-tools/StudyAbroadLeadRequestForm";

export const metadata: Metadata = {
  title: "留学文书需求表单 | 全球博译",
  description: "提交 PS、SOP、英文简历、推荐信和申请材料包审核需求，由全球博译顾问跟进。",
  alternates: { canonical: "/tools/study-abroad-essay-check/request" },
  robots: { index: false, follow: true },
};

export default async function StudyAbroadEssayRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="business-tool-page essay-request-page">
      <BusinessToolHeader
        quoteSource="study-abroad-essay-request"
        ctaHref="/tools/study-abroad-essay-check/request"
        ctaLabel="提交文书需求"
      />
      <section className="business-tool-main essay-request-shell">
        <div className="essay-request-intro">
          <p className="eyebrow">Study Abroad Essay Request</p>
          <h1>留学文书需求表单</h1>
          <p>
            这里不是通用翻译报价入口。请留下申请阶段、目标专业、文书类型和截止时间，顾问会按文书润色、结构重写、SOP/PS 重构、英文简历优化或材料包审核来跟进。
          </p>
        </div>
        <StudyAbroadLeadRequestForm initialService={query.service} />
      </section>
      <BusinessToolFooter requestHref="/tools/study-abroad-essay-check/request" />
    </main>
  );
}
