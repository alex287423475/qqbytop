import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IeltsWritingTopics } from "@/components/ielts-writing/IeltsWritingExperience";
import { writingTopics } from "@/lib/ielts-writing/constants";

type Props = {
  params: Promise<{
    topicSlug: string;
  }>;
};

export async function generateStaticParams() {
  return writingTopics.map((topic) => ({ topicSlug: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topicSlug } = await params;
  const topic = writingTopics.find((item) => item.slug === topicSlug);
  if (!topic) {
    return {
      title: "雅思写作题目不存在",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${topic.title} | 雅思写作题库与 AI 诊断`,
    description: `${topic.prompt} 查看写作思路、表达建议，并粘贴你的答案进行 AI 诊断。`,
    alternates: {
      canonical: `/tools/ielts-writing/topics/${topic.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function IeltsWritingTopicDetailPage({ params }: Props) {
  const { topicSlug } = await params;
  const topic = writingTopics.find((item) => item.slug === topicSlug);
  if (!topic) notFound();

  return <IeltsWritingTopics activeTopic={topic} />;
}
