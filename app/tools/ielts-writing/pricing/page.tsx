import type { Metadata } from "next";
import { IeltsWritingPricing } from "@/components/ielts-writing/IeltsWritingExperience";

export const metadata: Metadata = {
  title: "雅思写作深度诊断套餐 | 写作点数独立计费",
  description: "雅思写作 AI 深度诊断套餐。写作点数只用于写作报告，不与口语点数共享。",
  alternates: {
    canonical: "/tools/ielts-writing/pricing",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function IeltsWritingPricingPage() {
  return <IeltsWritingPricing />;
}
