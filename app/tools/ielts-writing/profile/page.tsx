import type { Metadata } from "next";
import { IeltsWritingProfile } from "@/components/ielts-writing/IeltsWritingExperience";

export const metadata: Metadata = {
  title: "我的雅思写作诊断档案 | 历史报告与点数",
  description: "查看雅思写作 AI 诊断历史、写作深度点数和高频错题。真实用户中心应登录后访问。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function IeltsWritingProfilePage() {
  return <IeltsWritingProfile />;
}
