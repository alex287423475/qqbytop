import type { Metadata } from "next";
import { GaokaoEssayMyReportsClient } from "@/components/gaokao-essay/GaokaoEssayMyReportsClient";

export const metadata: Metadata = {
  title: "我的高考英语作文诊断报告",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GaokaoEssayMyReportsPage() {
  return <GaokaoEssayMyReportsClient />;
}
