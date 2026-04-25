import Image from "next/image";
import Link from "next/link";
import { CTA } from "@/components/shared/CTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { contact, getQqHref, getWhatsappHref } from "@/lib/contact";
import { buildSeoMetadata } from "@/lib/seo";
import { about, type Locale } from "@/lib/site-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return buildSeoMetadata({
    locale,
    path: "/about",
    title: "关于我们",
    description: "了解北京全球博译翻译公司的服务理念、交付体系、质量控制、保密机制、适合客户类型和联系方式。",
    keywords: ["北京全球博译翻译公司", "全球博译", "翻译公司介绍", "翻译质量控制"],
  });
}

const trustMetrics = [
  ["2014", "开始服务企业笔译和口译项目"],
  ["50+", "覆盖语种与长期协作译员资源"],
  ["30+", "可处理 Office、PDF、SDLXLIFF、IDML 等格式"],
  ["4 类", "法律、电商、技术、制造重点行业能力"],
];

const deliverySystem = [
  ["需求分诊", "先确认文件用途、接收机构、语种、格式、交期和是否需要盖章。"],
  ["行业匹配", "按法律、技术、跨境电商、制造等方向匹配译员和审校资源。"],
  ["术语沉淀", "为长期项目建立术语库、禁用词表、风格偏好和修改记录。"],
  ["交付验收", "交付前检查漏译、数字、专名、标签、格式、图表和可提交性。"],
];

const riskControls = [
  ["保密与权限", "涉密项目可签署 NDA，项目资料按最小必要原则分配给项目成员。"],
  ["质量复核", "重要文件采用翻译、审校、QA 检查分层处理，降低单点失误。"],
  ["格式保护", "复杂文件先评估格式风险，必要时先做标签、变量和版式保护。"],
  ["售后修订", "接收机构或客户提出合理修改意见后，可继续协助修订和说明。"],
];

const clientTypes = [
  ["企业法务与律所", "合同、章程、授权书、诉讼仲裁材料、专利和合规说明，重点控制权责边界和提交格式。"],
  ["跨境电商团队", "POA 申诉、Listing、认证报告、说明书、包装标签和售后内容，重点兼顾平台审核和目标市场表达。"],
  ["技术与制造企业", "设备手册、SOP、API 文档、质量体系和工程资料，重点保护术语、变量、编号和版式。"],
  ["个人与家庭用户", "证件、成绩单、无犯罪证明、银行流水、签证或移民材料，重点确认接收机构和盖章要求。"],
];

const aboutFaq = [
  {
    q: "北京全球博译主要服务企业客户还是个人客户？",
    a: "两类客户都服务。企业项目通常关注术语一致、保密、批量交付和行业风险；个人材料更关注接收机构要求、盖章、格式和交期。",
  },
  {
    q: "是否可以签署保密协议？",
    a: "可以。涉及合同、专利、诉讼、技术资料或未公开产品信息的项目，可在开始前签署 NDA，并限定项目成员访问权限。",
  },
  {
    q: "复杂格式文件可以处理吗？",
    a: "可以先评估。常见 Office、PDF、扫描件、SDLXLIFF、Markdown、IDML 等文件会根据格式复杂度确认是否需要排版、标签保护或导回验证。",
  },
  {
    q: "翻译后还能继续修改吗？",
    a: "可以。交付后如接收机构、平台或客户提出合理修改意见，我们会根据原项目范围继续协助修订和说明。",
  },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const whatsappHref = getWhatsappHref(typedLocale);
  const qqHref = getQqHref();
  const pageUrl = `https://qqbytop.com/${locale}/about`;
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://qqbytop.com/#organization",
        name: "北京全球博译翻译公司",
        alternateName: "QQBY",
        url: "https://qqbytop.com",
        logo: "https://qqbytop.com/brand/qqby-logo-pro.svg",
        email: contact.email,
        telephone: contact.phone,
        address: contact.address,
        description: about.intro,
      },
      {
        "@type": "AboutPage",
        "@id": `${pageUrl}#about-page`,
        url: pageUrl,
        name: "关于北京全球博译翻译公司",
        isPartOf: { "@id": "https://qqbytop.com/#website" },
        about: { "@id": "https://qqbytop.com/#organization" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: `https://qqbytop.com/${locale}` },
          { "@type": "ListItem", position: 2, name: "关于我们", item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: aboutFaq.map((item) => ({
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
      <JsonLd data={aboutJsonLd} />
      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,0.95fr)_420px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-brand-600">关于北京全球博译翻译公司</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-brand-900">让专业翻译成为企业出海和跨境合作的确定性基础设施</h1>
            <p className="mt-5 max-w-2xl leading-8 text-slate-600">{about.intro}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {trustMetrics.map(([value, label]) => (
              <div key={label} className="border border-slate-200 bg-white p-5">
                <strong className="text-3xl text-brand-600">{value}</strong>
                <p className="mt-2 text-sm leading-6 text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="我们解决的不是翻译动作，而是交付确定性" subtitle="客户真正需要的不是一份看起来通顺的译文，而是能被机构、平台、客户或内部团队接收和继续使用的交付件。" />
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {about.values.map(([title, text]) => (
              <div key={title} className="border border-slate-200 p-6">
                <h2 className="font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="交付体系" subtitle="从接收文件到最终交付，每一步都围绕用途、风险、格式和验收标准展开。" />
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {deliverySystem.map(([title, text], index) => (
              <li key={title} className="border border-slate-200 bg-white p-6">
                <span className="text-sm font-bold text-brand-600">0{index + 1}</span>
                <h2 className="mt-3 font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-brand-600">风险控制</p>
            <h2 className="mt-3 text-3xl font-bold text-brand-900">翻译项目越重要，越要把流程前置</h2>
            <p className="mt-4 leading-8 text-slate-600">法律、专利、技术、平台申诉、认证文件和批量项目都不适合只按字数粗略处理。我们会先确认风险点，再安排人员和交付方式。</p>
            <Link href={`/${locale}/quote?source=about-risk-control`} className="mt-6 inline-flex rounded bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500">
              提交项目评估
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {riskControls.map(([title, text]) => (
              <div key={title} className="border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-brand-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="发展历程" />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {about.timeline.map(([year, event]) => (
              <div key={year} className="bg-white p-6">
                <strong className="text-2xl text-brand-600">{year}</strong>
                <p className="mt-3 text-sm leading-7 text-slate-600">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="适合哪些客户" subtitle="不同客户的决策重点不一样，我们会先按用途和风险把项目路径分清楚。" />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {clientTypes.map(([title, text]) => (
              <div key={title} className="border border-slate-200 bg-white p-6">
                <h2 className="font-bold text-brand-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <SectionHeader title="关于合作的常见问题" />
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {aboutFaq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-semibold text-brand-900">{item.q}</summary>
                <p className="mt-3 leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">联系信息</h2>
            <div className="mt-6 grid gap-4 text-slate-600 sm:grid-cols-2">
              <div className="border border-slate-200 p-5">
                <p className="text-sm text-slate-500">咨询电话</p>
                <a className="mt-2 block font-bold text-brand-900 hover:text-brand-600" href={contact.phoneHref}>
                  {contact.phone}
                </a>
              </div>
              <div className="border border-slate-200 p-5">
                <p className="text-sm text-slate-500">邮箱</p>
                <a className="mt-2 block font-bold text-brand-900 hover:text-brand-600" href={contact.emailHref}>
                  {contact.email}
                </a>
              </div>
              <div className="border border-slate-200 p-5 sm:col-span-2">
                <p className="text-sm text-slate-500">地址</p>
                <p className="mt-2 font-semibold text-brand-900">{contact.address}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500" href={contact.wechatQr} target="_blank" rel="noreferrer">
                微信扫码咨询
              </a>
              {whatsappHref && (
                <a className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500" href={whatsappHref} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              {qqHref && (
                <a className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500" href={qqHref} target="_blank" rel="noreferrer">
                  QQ 咨询
                </a>
              )}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <Image src={contact.wechatQr} alt="微信咨询二维码" width={280} height={280} className="h-auto w-full" />
            <p className="mt-3 text-center text-sm text-slate-500">{contact.wechatHint}</p>
          </div>
        </div>
      </section>

      <CTA locale={typedLocale} />
    </>
  );
}
