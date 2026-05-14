import type { Metadata } from "next";
import { GaokaoEssayAdminMock } from "@/components/gaokao-essay/admin/GaokaoEssayAdminMock";

export const metadata: Metadata = {
  title: "高考英语作文诊断后台",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GaokaoEssayAdminPage() {
  return <GaokaoEssayAdminMock />;
}
