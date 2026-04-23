import Link from "next/link";
import { posts } from "@/lib/site-data";

export const metadata = {
  title: "专业资讯",
  description: "QQBY 专业资讯：跨境电商、法律合规、技术本地化和翻译质量方法论。",
};

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const categories = Array.from(new Set(posts.map((post) => post.category)));

  return (
    <>
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold text-brand-600">专业资讯</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">把翻译、合规和本地化讲清楚</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => <span key={category} className="bg-white px-3 py-1 text-sm text-slate-600">{category}</span>)}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="border border-slate-200 p-6 hover:border-brand-600 hover:shadow-lg">
              <p className="text-sm font-semibold text-brand-600">{post.category}</p>
              <h2 className="mt-3 text-xl font-bold text-brand-900"><Link href={`/${locale}/blog/${post.slug}`}>{post.title}</Link></h2>
              <p className="mt-4 leading-7 text-slate-600">{post.excerpt}</p>
              <p className="mt-5 text-xs text-slate-500">{post.date} · {post.readTime}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
