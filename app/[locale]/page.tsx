import Link from "next/link";
import Image from "next/image";
import { CTA } from "@/components/shared/CTA";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getAllArticles } from "@/lib/articles";
import { home, services, type Locale } from "@/lib/site-data";

const searchSuggestions = ["证件翻译", "合同翻译报价", "跨境电商 POA", "SDLXLIFF", "专利翻译", "电气设备手册"];

const scenarioEntries = [
  {
    title: "个人证件与公证材料",
    text: "用于签证、留学、移民、入职、银行或境外机构提交的证件、证明和公证材料。",
    href: "/search?q=证件翻译需要注意什么",
    label: "查看证件翻译答案",
  },
  {
    title: "合同与法律合规文件",
    text: "合同、章程、授权书、诉讼仲裁材料和跨境合规说明，重点处理权责边界。",
    href: "/services/legal-compliance",
    label: "查看法律合规翻译",
  },
  {
    title: "跨境电商申诉与Listing",
    text: "亚马逊、Shopify、TikTok Shop、独立站相关 POA、Listing、本地化和合规资料。",
    href: "/services/cross-border-ecommerce",
    label: "查看电商翻译",
  },
  {
    title: "技术手册与工程文档",
    text: "设备说明书、SDLXLIFF、API文档、专利说明书和质量体系文件，保护格式和术语。",
    href: "/services/technical-localization",
    label: "查看技术本地化",
  },
];

const audienceEntries = [
  {
    title: "个人材料",
    text: "证件、成绩单、无犯罪证明、银行流水、签证或移民材料，重点确认接收机构格式和是否需要盖章。",
    href: "/search?q=证件翻译需要注意什么",
    cta: "先看办理要点",
  },
  {
    title: "企业项目",
    text: "合同、技术手册、投标文件、跨境电商申诉、专利和合规材料，重点控制术语、格式、风险边界和交付计划。",
    href: "/quote?source=home-business",
    cta: "提交项目需求",
  },
];

export const metadata = {
  title: "北京全球博译翻译 | 跨境合规翻译 · 技术本地化 · 专利文档翻译",
  description: "QQBY 全球博译提供跨境电商合规翻译、法律合规翻译、技术文档本地化与专业文档翻译服务。",
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const articles = getAllArticles(locale);
  const factSourceArticles = articles.filter((article) => article.contentMode === "fact-source").slice(0, 3);
  const featuredArticles = factSourceArticles.length ? factSourceArticles : articles.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Image
          src="/skin/image/banner1.jpg"
          alt="文件盖章与专业翻译交付场景"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/92 to-brand-900/66" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-brand-500/40 px-4 py-1.5 text-sm text-brand-100">{home.badge}</p>
              <h1 className="mt-6 text-4xl font-bold sm:text-6xl">{home.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{home.subtitle}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href={`/${locale}/quote?source=home-hero`} className="rounded bg-brand-600 px-6 py-3 text-center font-semibold text-white hover:bg-brand-500">获取翻译报价</Link>
                <Link href={`/${locale}/search`} className="rounded border border-slate-600 px-6 py-3 text-center font-semibold text-slate-100 hover:border-slate-300">搜索解决方案</Link>
              </div>
            </div>

            <div className="border border-slate-700 bg-slate-800/70 p-6 shadow-2xl shadow-slate-950/20">
              <p className="text-sm font-semibold text-brand-100">需求分诊</p>
              <h2 className="mt-3 text-2xl font-bold">先判断路径，再报价</h2>
              <div className="mt-6 space-y-4">
                {["材料用途和接收机构是什么？", "是否需要盖章、双语对照或格式还原？", "交付时间和目标语种是否明确？"].map((item, index) => (
                  <div key={item} className="flex gap-3 border-b border-slate-700 pb-4 last:border-b-0 last:pb-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold">{index + 1}</span>
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
              <Link href={`/${locale}/quote?source=home-triage`} className="mt-6 inline-flex w-full justify-center rounded bg-white px-5 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50">
                直接提交材料判断
              </Link>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {home.stats.map(([value, label]) => (
              <div key={label} className="border border-slate-700 bg-slate-800/70 p-5 backdrop-blur">
                <div className="text-3xl font-bold">{value}</div>
                <div className="mt-1 text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 px-5">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-brand-600">不知道该看哪个页面？</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-900">直接搜索你的文件、场景或问题</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                输入关键词后，系统会同时检索服务、行业方案和专业文章，帮你快速找到解决方案或答案。
              </p>
            </div>

            <div>
              <form action={`/${locale}/search`} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_128px]">
                <label className="sr-only" htmlFor="home-search-query">
                  搜索关键词
                </label>
                <input
                  id="home-search-query"
                  name="q"
                  type="search"
                  placeholder="例如：证件翻译需要注意什么"
                  className="min-h-14 rounded-2xl border border-slate-200 px-5 text-base text-brand-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
                <button type="submit" className="min-h-14 rounded-2xl bg-brand-600 px-6 text-base font-semibold text-white transition hover:bg-brand-500">
                  搜索答案
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {searchSuggestions.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={`/${locale}/search?q=${encodeURIComponent(suggestion)}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600">先分清用户类型</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-900">个人材料和企业项目，判断标准不一样</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              个人材料更看重接收机构要求；企业项目更看重术语一致、风险边界和批量交付。入口分开，后续报价也更准确。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {audienceEntries.map((entry) => (
              <Link key={entry.title} href={`/${locale}${entry.href}`} className="border border-slate-200 bg-slate-50 p-6 transition hover:border-brand-500 hover:bg-white hover:shadow-md">
                <h3 className="text-lg font-bold text-brand-900">{entry.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{entry.text}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-brand-600">{entry.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="按需求直接进入" subtitle="如果你已经知道材料用途，可以直接从常见场景进入对应服务或答案页。" />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {scenarioEntries.map((entry) => (
              <Link key={entry.title} href={`/${locale}${entry.href}`} className="border border-slate-200 bg-white p-6 transition hover:border-brand-500 hover:shadow-lg">
                <h3 className="text-lg font-bold text-brand-900">{entry.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{entry.text}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-brand-600">{entry.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="翻译服务" subtitle="不同类型的文件需要不同的翻译策略。我们把服务拆成可评估、可交付、可复用的专业模块。" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className="border border-slate-200 bg-white p-7 transition hover:border-brand-600 hover:shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-brand-900">{service.title}</h3>
                  <span className="shrink-0 bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">{service.badge}</span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{service.summary}</p>
                <span className="mt-6 inline-flex text-sm font-semibold text-brand-600">了解详情</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader eyebrow="技术引擎" title="让每一份文件经过工业级处理流程" subtitle="把复杂文件从接收、保护、翻译、审校到导出拆成可检查的步骤，降低格式损坏和术语漂移风险。" />
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {home.techSteps.map(([title, text], index) => (
              <div key={title} className="border border-slate-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{index + 1}</div>
                <h3 className="mt-5 font-bold text-brand-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredArticles.length > 0 && (
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeader eyebrow="核心事实源" title="先读判断标准，再决定是否询价" subtitle="把高频问题整理成可引用的专业文章，帮助你提前判断材料风险、交付边界和报价因素。" />
              <Link href={`/${locale}/blog`} className="text-sm font-semibold text-brand-600 hover:text-brand-500">查看全部文章</Link>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <Link key={article.slug} href={`/${locale}/blog/${article.slug}`} className="border border-slate-200 bg-white p-6 transition hover:border-brand-500 hover:shadow-lg">
                  <p className="text-sm font-semibold text-brand-600">{article.contentMode === "fact-source" ? "核心事实源" : article.category}</p>
                  <h3 className="mt-3 text-xl font-bold leading-8 text-brand-900">{article.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{article.description}</p>
                  <p className="mt-5 text-xs text-slate-500">{article.date} · {article.readTime}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="客户评价" subtitle="来自长期合作客户的真实反馈。" />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {home.testimonials.map(([name, title, quote]) => (
              <figure key={name} className="border border-slate-200 p-7">
                <blockquote className="leading-8 text-slate-700">“{quote}”</blockquote>
                <figcaption className="mt-6 text-sm text-slate-500">
                  <strong className="block text-brand-900">{name}</strong>
                  {title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} />
    </>
  );
}
