import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts } from "@/lib/site-data";

export function generateStaticParams() {
  return posts.flatMap((post) => ["zh", "en", "ja"].map((locale) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return {
    title: post?.title ?? "专业资讯",
    description: post?.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = posts.filter((item) => item.slug !== slug && item.category === post.category).slice(0, 3);

  return (
    <>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <Link href={`/${locale}/blog`} className="text-sm font-semibold text-brand-600">返回资讯列表</Link>
        <p className="mt-8 text-sm font-semibold text-brand-600">{post.category}</p>
        <h1 className="mt-3 text-4xl font-bold text-brand-900">{post.title}</h1>
        <p className="mt-4 text-sm text-slate-500">{post.date} · {post.readTime}</p>
        <div className="prose-content mt-10">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
      {related.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-5">
            <h2 className="text-2xl font-bold text-brand-900">相关文章</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/${locale}/blog/${item.slug}`} className="bg-white p-6">
                  <p className="text-sm text-brand-600">{item.category}</p>
                  <h3 className="mt-2 font-bold text-brand-900">{item.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
