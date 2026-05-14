import type { Metadata } from "next";
import { GaokaoEssayReviewClient } from "@/components/gaokao-essay/GaokaoEssayReviewClient";

export const metadata: Metadata = {
  title: "图片识别校对页 | 高考英语作文诊断",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GaokaoEssayReviewPage({ params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  return <GaokaoEssayReviewClient draftId={draftId} />;
}
