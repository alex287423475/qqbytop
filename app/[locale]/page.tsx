import Link from "next/link";
import Image from "next/image";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getAllArticles } from "@/lib/articles";
import { home, industries, services, type Locale } from "@/lib/site-data";

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

const quoteChecklist = [
  ["文件用途", "签证、投标、法务审阅、平台申诉、技术交付等用途会影响翻译深度和交付格式。"],
  ["目标语种", "说明源语言、目标语言，以及是否需要母语润色或目标市场本地化。"],
  ["接收要求", "如是否需要盖章、双语对照、译员声明、固定模板、PDF排版或原格式还原。"],
  ["交付时间", "明确希望交付的日期和是否分批交付，便于评估加急通道和项目安排。"],
];

const homeFaq = [
  {
    q: "没有整理好文件，可以先询价吗？",
    a: "可以。先说明文件类型、用途、语种和大致页数，我们可以先给出范围判断；正式报价会以实际文件和交付要求为准。",
  },
  {
    q: "个人证件翻译和企业文件翻译有什么区别？",
    a: "个人材料通常更关注接收机构、盖章和格式要求；企业文件更关注术语一致、保密、批量交付和法律或技术风险边界。",
  },
  {
    q: "能处理 PDF、扫描件或 SDLXLIFF 这类复杂格式吗？",
    a: "可以。常见 Office、PDF、扫描件和 SDLXLIFF 等文件会先评估格式处理难度，再确认是否需要排版、标签保护或双语交付。",
  },
  {
    q: "提交询价后多久会回复？",
    a: "工作时间内通常会尽快响应。紧急项目建议同时说明最晚交付时间，便于我们判断是否能开启加急通道。",
  },
];

const testimonialCases = [
  {
    client: "芯片设计企业知识产权负责人",
    industry: "半导体 / 专利文件",
    project: "12 项海外专利说明书、权利要求书与审查意见答复材料翻译",
    result: "按专利代理人意见统一术语和权利要求层级，交付后未因翻译表述触发形式补正。",
    quote:
      "这类文件最怕译文把技术特征说偏。全球博译会先确认术语表，再处理权利要求的从属关系，审校意见也能逐条回应。",
    metrics: ["12 项专利", "术语表先行", "权利要求重点审校"],
  },
  {
    client: "跨境家居品牌运营负责人",
    industry: "跨境电商 / 平台申诉",
    project: "亚马逊 POA 申诉信、采购凭证、客服沟通记录与合规说明翻译",
    result: "重新梳理根因、纠正措施和预防机制，译文避免模板化表达，申诉材料一次提交通过。",
    quote:
      "之前我们只做直译，平台看不出整改动作。全球博译把中文说明重构成平台审核员能理解的逻辑，交付速度也很稳。",
    metrics: ["8 小时急件", "POA 逻辑重构", "证据链同步翻译"],
  },
  {
    client: "德资汽车零部件企业质量部",
    industry: "制造业 / 质量体系",
    project: "IATF 16949 体系文件、SOP、检验规范和培训材料批量翻译",
    result: "256 份文件按同一术语库交付，编号、表格、警示语和质量术语保持一致，海外总部审阅顺利。",
    quote:
      "批量文件最难的是前后一致。项目经理把术语、格式和交付批次拆得很清楚，我们内部质量团队复核压力小很多。",
    metrics: ["256 份文件", "批次交付", "格式与编号保留"],
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
  const siteUrl = `https://qqbytop.com/${locale}`;
  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://qqbytop.com/#organization",
        name: "北京全球博译翻译公司",
        url: "https://qqbytop.com",
        logo: "https://qqbytop.com/brand/qqby-logo-pro.svg",
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: ["zh", "en", "ja"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://qqbytop.com/#website",
        name: "北京全球博译翻译公司",
        url: "https://qqbytop.com",
        publisher: { "@id": "https://qqbytop.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#homepage-faq`,
        mainEntity: homeFaq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={homepageJsonLd} />
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

      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-brand-100">询价前准备</p>
            <h2 className="mt-3 text-3xl font-bold">发来这四类信息，报价会更准确</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              不需要先整理成正式需求书。只要把用途、语种、接收要求和时间说清楚，我们就能快速判断服务路径、风险点和交付方式。
            </p>
            <Link href={`/${locale}/quote?source=home-checklist`} className="mt-6 inline-flex rounded bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500">
              按清单提交询价
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {quoteChecklist.map(([title, text], index) => (
              <div key={title} className="border border-slate-700 bg-slate-800/70 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-900">{index + 1}</span>
                  <h3 className="font-bold">{title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="翻译服务" subtitle="不同类型的文件需要不同的翻译策略。我们把服务拆成可评估、可交付、可复用的专业模块。" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className="group border border-slate-200 bg-white p-7 transition hover:border-brand-600 hover:shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-brand-900">{service.title}</h3>
                  <span className="shrink-0 bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">{service.badge}</span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{service.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.scenarios.slice(0, 2).map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
                <span className="mt-6 inline-flex text-sm font-semibold text-brand-600 group-hover:text-brand-500">了解详情</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`/${locale}/services`} className="inline-flex rounded border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50">
              查看全部翻译服务
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="行业方案" subtitle="法律、跨境电商、科技和制造业的文件链路不同，方案页会说明行业痛点、材料场景和关联服务。" />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => (
              <Link key={industry.slug} href={`/${locale}/industries/${industry.slug}`} className="group border border-slate-200 bg-white p-6 transition hover:border-brand-600 hover:shadow-lg">
                <p className="text-sm font-semibold text-brand-600">{industry.badge}</p>
                <h3 className="mt-4 text-xl font-bold leading-8 text-brand-900">{industry.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{industry.summary}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-brand-600 group-hover:text-brand-500">查看行业方案</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
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
          <SectionHeader title="提交前常见问题" subtitle="把这些问题提前说清楚，项目经理能更快判断报价、交付方式和风险边界。" />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {homeFaq.map((item) => (
              <div key={item.q} className="border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-bold text-brand-900">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-brand-100 bg-brand-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <p className="text-sm font-semibold text-brand-700">还有不确定的地方？</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">直接把问题和材料用途发来，我们会先判断是否需要翻译、盖章、排版或专业审校。</p>
            </div>
            <Link href={`/${locale}/quote?source=home-faq`} className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 sm:mt-0">
              带着问题询价
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="客户怎么评价一次交付" subtitle="评价不只看译文是否通顺，更看项目边界、术语一致、格式还原和提交后的可用性。" />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonialCases.map((item) => (
              <figure key={item.client} className="flex h-full flex-col border border-slate-200 bg-white p-7 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-brand-600">{item.industry}</p>
                  <h3 className="mt-3 text-xl font-bold leading-8 text-brand-900">{item.project}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.result}</p>
                </div>
                <blockquote className="mt-6 border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-sm leading-7 text-slate-700">
                  “{item.quote}”
                </blockquote>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.metrics.map((metric) => (
                    <span key={metric} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {metric}
                    </span>
                  ))}
                </div>
                <figcaption className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <strong className="block text-brand-900">{item.client}</strong>
                  已脱敏项目反馈
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 grid gap-4 border border-slate-200 bg-white p-6 md:grid-cols-3">
            {[
              ["先确认边界", "用途、提交机构、格式、盖章和审校深度先确认，再安排译员。"],
              ["过程可追踪", "术语表、批次交付、QA问题和修改意见都能留痕。"],
              ["交付能使用", "目标不是看起来像翻译，而是能被平台、机构或内部团队接收。"],
            ].map(([title, text]) => (
              <div key={title}>
                <h3 className="font-bold text-brand-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA locale={locale as Locale} />
    </>
  );
}
