

我来继续输出 About（关于我们）、Pricing（价格说明）、Blog（专业资讯）三个模块的完整代码。

---

# About / Pricing / Blog 三大模块完整实现

## 一、关于我们（About）

### 1.1 字典文件

```json
// src/dictionaries/zh.json — about
{
  "about": {
    "meta": {
      "title": "关于全球博译 | 北京专业翻译公司 · 技术驱动的本地化服务商 — QQBY",
      "description": "北京全球博译翻译服务有限公司（QQBY）成立于2010年，专注技术翻译与本地化服务。15年行业深耕，2000+企业客户，50+语种覆盖，ISO 9001/27001双认证。了解我们的团队、技术能力和服务理念。"
    },
    "breadcrumb": {
      "home": "首页",
      "current": "关于我们"
    },
    "hero": {
      "badge": "关于全球博译",
      "title": "翻译行业的"工程师文化"",
      "subtitle": "大多数翻译公司卖的是"人"——译员资历、语种数量。我们卖的是"系统"——一套能确保每一份交付物的格式完整性、术语一致性和法律合规性的工程化流程。人会犯错，系统会兜底。"
    },
    "story": {
      "section_title": "从一间翻译工作室到技术驱动的本地化服务商",
      "timeline": [
        {
          "year": "2010",
          "title": "创立",
          "description": "北京全球博译翻译服务有限公司在北京成立，初始团队5人，专注于技术文档中英翻译。"
        },
        {
          "year": "2013",
          "title": "CAT工具全面引入",
          "description": "全面引入SDL Trados、MemoQ等CAT工具，建立第一版术语库管理体系，翻译一致性和效率大幅提升。"
        },
        {
          "year": "2015",
          "title": "法律翻译团队组建",
          "description": "组建独立法律翻译团队，核心成员具备法学学位和法律翻译认证。同年获得ISO 9001质量管理体系认证。"
        },
        {
          "year": "2017",
          "title": "跨境电商业务启动",
          "description": "敏锐捕捉跨境电商翻译需求爆发趋势，率先组建POA申诉翻译和Listing本地化专项服务团队。"
        },
        {
          "year": "2019",
          "title": "技术本地化能力突破",
          "description": "实现SDLXLIFF、IDML、DITA XML等30+专业格式的无损解析能力，标签保护和格式还原技术达到行业领先水平。"
        },
        {
          "year": "2021",
          "title": "信息安全体系升级",
          "description": "通过ISO 27001信息安全管理体系认证，全面建立端到端加密传输、NDA全覆盖、最小权限访问控制的安全体系。"
        },
        {
          "year": "2023",
          "title": "AI辅助翻译集成",
          "description": "将AI翻译引擎作为辅助工具集成到工作流中，用于初稿生成和一致性检查，同时坚持人工精翻和审校的核心质量环节不可替代。"
        },
        {
          "year": "2025",
          "title": "持续进化",
          "description": "累计服务2000+企业客户，术语库总量突破50万条术语对，翻译记忆库覆盖10亿+字符，持续深耕法律、跨境电商、科技、制造业四大重点行业。"
        }
      ]
    },
    "values": {
      "section_title": "我们相信的事",
      "items": [
        {
          "title": "精确优先于流畅",
          "description": "在技术翻译和法律翻译领域，一个术语的偏差可能改变整份文件的含义。当精确性和流畅性产生冲突时，我们始终选择精确。流畅可以通过润色改善，但精确性一旦丢失就无法挽回。",
          "icon": "target"
        },
        {
          "title": "系统兜底人为失误",
          "description": "再资深的译员也会犯错——这是人类的本性而非能力问题。我们的应对方式不是"找更好的人"，而是建立多层质量防线：术语库强制校验、翻译记忆自动匹配、40+项自动化QA检查、独立审校人员逐句复核。",
          "icon": "shield"
        },
        {
          "title": "格式是交付物的一部分",
          "description": "翻译交付不是一份Word文档——它是可以直接用于印刷、发布、提交的成品。标签损坏、排版错位、格式丢失在我们这里是和术语错误同等级别的质量事故。",
          "icon": "layout"
        },
        {
          "title": "安全是默认选项而非增值服务",
          "description": "我们不提供"加密传输升级包"或"NDA付费选项"——端到端加密、独立NDA、最小权限访问控制是所有项目的默认配置。敏感信息保护不应该是一个需要额外购买的功能。",
          "icon": "lock"
        }
      ]
    },
    "team": {
      "section_title": "团队构成",
      "section_subtitle": "不是所有翻译公司的译员都有行业背景",
      "stats": [
        { "value": "120+", "label": "签约译员", "detail": "其中全职核心团队30+人" },
        { "value": "85%", "label": "硕士及以上学历", "detail": "含法学、工学、理学等学位" },
        { "value": "40%", "label": "双重背景", "detail": "语言+行业专业（法律/工程/IT）" },
        { "value": "5年+", "label": "平均从业年限", "detail": "核心审校团队10年以上经验" }
      ],
      "departments": [
        {
          "name": "法律翻译部",
          "description": "由持有法律资质的译员和执业律师组成，覆盖合同、专利、诉讼、公证四大方向",
          "headcount": "25人"
        },
        {
          "name": "技术本地化部",
          "description": "具备计算机科学/软件工程背景的技术译员，精通30+专业文件格式的无损处理",
          "headcount": "20人"
        },
        {
          "name": "跨境电商部",
          "description": "资深跨境电商翻译师+前平台运营顾问，熟悉亚马逊等15+平台的规则和审核逻辑",
          "headcount": "15人"
        },
        {
          "name": "制造业翻译部",
          "description": "机械/电气/化工工程背景译员，服务过150+制造业企业的设备手册和体系文件翻译",
          "headcount": "15人"
        },
        {
          "name": "质量管理部",
          "description": "独立于翻译团队的审校和QA团队，执行语言审校、专业审校和自动化质量检查",
          "headcount": "10人"
        },
        {
          "name": "项目管理部",
          "description": "每个项目配备专属PM全程对接，确保需求理解、进度管控和交付质量三方面不掉链子",
          "headcount": "8人"
        }
      ]
    },
    "certifications": {
      "section_title": "资质与认证",
      "items": [
        {
          "name": "ISO 9001:2015",
          "description": "质量管理体系认证",
          "detail": "覆盖翻译、审校、项目管理全流程"
        },
        {
          "name": "ISO 27001:2022",
          "description": "信息安全管理体系认证",
          "detail": "端到端数据安全保障"
        },
        {
          "name": "中国翻译协会会员",
          "description": "行业协会认可",
          "detail": "中国翻译协会企业会员单位"
        },
        {
          "name": "翻译专用章备案",
          "description": "公安局备案翻译章",
          "detail": "全国公证处、使馆认可"
        }
      ]
    },
    "contact_info": {
      "section_title": "联系我们",
      "company_name": "北京全球博译翻译服务有限公司",
      "address": "北京市昌平区回龙观东大街336号院1号楼5层511",
      "phone": "400-869-9562",
      "email": "info@qqbytop.com",
      "business_hours": "周一至周五 9:00-18:00（紧急需求7×24小时响应）",
      "map_title": "公司地址"
    },
    "cta_bottom": {
      "title": "想进一步了解我们的能力？",
      "subtitle": "直接提交您的翻译需求，让实际交付质量替我们说话",
      "cta_primary": "提交翻译需求",
      "cta_secondary": "拨打400-869-9562"
    }
  }
}
```

### 1.2 关于我们 — 页面主文件

```tsx
// src/app/[locale]/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { i18nConfig, type Locale } from "@/lib/i18n/config";
import { JsonLd } from "@/components/shared/JsonLd";
import { CompanyTimeline } from "@/components/about/CompanyTimeline";
import { ValuesGrid } from "@/components/about/ValuesGrid";
import { TeamOverview } from "@/components/about/TeamOverview";
import { CertificationsBar } from "@/components/about/CertificationsBar";
import { ContactInfo } from "@/components/about/ContactInfo";
import { BottomCTA } from "@/components/services/ecommerce/BottomCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.about.meta;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://qqbytop.com/${locale}/about`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((l) => [l, `https://qqbytop.com/${l}/about`])
      ),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://qqbytop.com/${locale}/about`,
      type: "website",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const page = dict.about;

  return (
    <>
      {/* JSON-LD: Organization */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TranslationService",
          name: "北京全球博译翻译服务有限公司",
          alternateName: "QQBY",
          url: "https://qqbytop.com",
          foundingDate: "2010",
          description: page.meta.description,
          address: {
            "@type": "PostalAddress",
            streetAddress: page.contact_info.address,
            addressLocality: "北京",
            addressCountry: "CN",
          },
          telephone: page.contact_info.phone,
          email: page.contact_info.email,
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            minValue: 30,
            maxValue: 120,
          },
          hasCredential: [
            { "@type": "EducationalOccupationalCredential", credentialCategory: "ISO 9001:2015" },
            { "@type": "EducationalOccupationalCredential", credentialCategory: "ISO 27001:2022" },
          ],
        }}
      />

      {/* 面包屑 */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link href={`/${locale}`} className="hover:text-brand-600 transition-colors">
              {page.breadcrumb.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-brand-900">{page.breadcrumb.current}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-slate-900 to-brand-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
              <span className="mr-2 h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              {page.hero.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {page.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              {page.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <CompanyTimeline dict={page.story} />

      {/* 价值观 */}
      <ValuesGrid dict={page.values} />

      {/* 团队构成 */}
      <TeamOverview dict={page.team} />

      {/* 资质认证 */}
      <CertificationsBar dict={page.certifications} />

      {/* 联系信息 */}
      <ContactInfo dict={page.contact_info} />

      {/* 底部 CTA */}
      <BottomCTA locale={locale as Locale} dict={page.cta_bottom} />
    </>
  );
}
```

### 1.3 公司发展时间线组件

```tsx
// src/components/about/CompanyTimeline.tsx

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

interface CompanyTimelineProps {
  dict: {
    section_title: string;
    timeline: TimelineItem[];
  };
}

export function CompanyTimeline({ dict }: CompanyTimelineProps) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-brand-900 sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="relative mt-16">
          {/* 中轴线 */}
          <div className="absolute left-8 top-0 h-full w-px bg-slate-200 sm:left-1/2 sm:-translate-x-px" />

          <div className="space-y-12">
            {dict.timeline.map((item, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div key={index} className="relative flex items-start gap-8">
                  {/* 时间线节点 */}
                  <div className="absolute left-8 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-brand-600 shadow-md sm:left-1/2">
                    <span className="sr-only">{item.year}</span>
                  </div>

                  {/* 桌面端左右交替 */}
                  <div
                    className={`ml-16 sm:ml-0 sm:w-1/2 ${
                      isLeft ? "sm:pr-16 sm:text-right" : "sm:ml-auto sm:pl-16"
                    }`}
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                      <span className="inline-flex rounded-full bg-brand-600/5 px-3 py-1 text-xs font-bold text-brand-600">
                        {item.year}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold text-brand-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 1.4 价值观网格组件

```tsx
// src/components/about/ValuesGrid.tsx

interface ValueItem {
  title: string;
  description: string;
  icon: string;
}

interface ValuesGridProps {
  dict: {
    section_title: string;
    items: ValueItem[];
  };
}

const valueIcons: Record<string, JSX.Element> = {
  target: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A17.888 17.888 0 0 1 12 3.75c4.478 0 8.268 1.632 10.136 4.007m-.678 5.486A17.889 17.889 0 0 1 12 20.25c-4.478 0-8.268-1.632-10.136-4.007m.678-5.486L12 12m0 0 9.458-1.757M12 12l-9.458-1.757M12 12l9.458 5.486M12 12l-9.458 5.486" />
    </svg>
  ),
  shield: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  layout: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    </svg>
  ),
  lock: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
};

export function ValuesGrid({ dict }: ValuesGridProps) {
  return (
    <section className="bg-brand-900 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {dict.items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 backdrop-blur-sm"
            >
              <div className="inline-flex rounded-xl bg-brand-600/10 p-3 text-brand-400">
                {valueIcons[item.icon] || valueIcons.target}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 leading-relaxed text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 1.5 团队概况组件

```tsx
// src/components/about/TeamOverview.tsx

interface TeamStat {
  value: string;
  label: string;
  detail: string;
}

interface Department {
  name: string;
  description: string;
  headcount: string;
}

interface TeamOverviewProps {
  dict: {
    section_title: string;
    section_subtitle: string;
    stats: TeamStat[];
    departments: Department[];
  };
}

export function TeamOverview({ dict }: TeamOverviewProps) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            {dict.section_title}
          </h2>
          <p className="mt-3 text-lg text-slate-500">{dict.section_subtitle}</p>
        </div>

        {/* 核心数据 */}
        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {dict.stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              <div className="text-3xl font-bold text-brand-600">
                {stat.value}
              </div>
              <div className="mt-1 text-base font-semibold text-brand-900">
                {stat.label}
              </div>
              <div className="mt-1 text-xs text-slate-500">{stat.detail}</div>
            </div>
          ))}
        </div>

        {/* 部门介绍 */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dict.departments.map((dept, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-600/20 hover:shadow-lg hover:shadow-brand-600/5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-900">
                  {dept.name}
                </h3>
                <span className="rounded-full bg-brand-600/5 px-3 py-1 text-xs font-bold text-brand-600">
                  {dept.headcount}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {dept.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 1.6 资质认证横栏组件

```tsx
// src/components/about/CertificationsBar.tsx

interface Certification {
  name: string;
  description: string;
  detail: string;
}

interface CertificationsBarProps {
  dict: {
    section_title: string;
    items: Certification[];
  };
}

const certIcons = [
  // ISO 9001
  <svg key="iso9001" className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>,
  // ISO 27001
  <svg key="iso27001" className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>,
  // 翻译协会
  <svg key="association" className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>,
  // 翻译章
  <svg key="seal" className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
  </svg>,
];

export function CertificationsBar({ dict }: CertificationsBarProps) {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-brand-900 sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.items.map((cert, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
            >
              <div className="inline-flex rounded-xl bg-brand-600/5 p-4 text-brand-600">
                {certIcons[index]}
              </div>
              <h3 className="mt-5 text-lg font-bold text-brand-900">
                {cert.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-brand-600">
                {cert.description}
              </p>
              <p className="mt-2 text-xs text-slate-500">{cert.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 1.7 联系信息组件

```tsx
// src/components/about/ContactInfo.tsx

interface ContactInfoProps {
  dict: {
    section_title: string;
    company_name: string;
    address: string;
    phone: string;
    email: string;
    business_hours: string;
    map_title: string;
  };
}

export function ContactInfo({ dict }: ContactInfoProps) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-brand-900 sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* 联系信息卡片 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-brand-900">
              {dict.company_name}
            </h3>

            <div className="mt-8 space-y-6">
              {/* 地址 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-600/5 p-2.5 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    公司地址
                  </div>
                  <p className="mt-1 text-sm text-brand-900">{dict.address}</p>
                </div>
              </div>

              {/* 电话 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-600/5 p-2.5 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    服务热线
                  </div>
                  <a href={`tel:${dict.phone}`} className="mt-1 text-sm font-semibold text-brand-600 hover:text-brand-500">
                    {dict.phone}
                  </a>
                </div>
              </div>

              {/* 邮箱 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-600/5 p-2.5 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    电子邮件
                  </div>
                  <a href={`mailto:${dict.email}`} className="mt-1 text-sm font-semibold text-brand-600 hover:text-brand-500">
                    {dict.email}
                  </a>
                </div>
              </div>

              {/* 营业时间 */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-600/5 p-2.5 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    服务时间
                  </div>
                  <p className="mt-1 text-sm text-brand-900">{dict.business_hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 地图占位 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="text-center text-slate-400">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
                <p className="mt-4 text-sm">{dict.map_title}</p>
                <p className="mt-1 text-xs">此处可嵌入百度/高德地图组件</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 二、价格说明（Pricing）

### 2.1 字典文件

```json
// src/dictionaries/zh.json — pricing
{
  "pricing": {
    "meta": {
      "title": "翻译价格说明 | 透明定价 · 按字计费 · 紧急通道加价规则 — QQBY",
      "description": "北京全球博译（QQBY）翻译服务透明定价：普通文档翻译¥260起/千字，法律/技术翻译¥320起/千字，Listing本地化¥500起/ASIN，POA申诉¥800起/篇。紧急通道加价规则清晰透明，无隐藏费用。"
    },
    "breadcrumb": {
      "home": "首页",
      "current": "价格说明"
    },
    "hero": {
      "badge": "透明定价",
      "title": "价格清晰到每一分钱",
      "subtitle": "我们不相信"询价才能看到的价格"——这种信息不对称只会增加客户的决策成本。以下是我们所有服务的基准价格、加价规则和折扣政策，一目了然。"
    },
    "pricing_principles": {
      "section_title": "定价原则",
      "items": [
        {
          "title": "按源文字数计费",
          "description": "所有笔译服务以源语言字数为计费单位（中文按字符数，外文按词数），不按译文字数计费。字数以CAT工具分析结果为准，客户可要求提供字数分析报告。"
        },
        {
          "title": "难度系数浮动",
          "description": "法律、医疗、半导体等高专业性文件的翻译难度和质量要求显著高于普通商务文档，因此适用更高的费率。难度评级在报价时由项目经理根据文件实际内容确定，而非笼统地按"行业"分类。"
        },
        {
          "title": "无隐藏费用",
          "description": "报价即最终价格——不会在交付后以"格式处理费""术语库建设费""项目管理费"等名目额外收费。审校、QA检查、基础格式还原都包含在报价中。"
        }
      ]
    },
    "tiers": {
      "section_title": "服务级别与基准价格",
      "note": "以下价格为中译英/英译中基准价，其他语种价格系数见下方语种费率表",
      "items": [
        {
          "name": "标准翻译",
          "badge": "",
          "description": "适用于内部沟通文件、一般性商务邮件、产品简介等不涉及高度专业术语的文档",
          "price": "¥260",
          "unit": "/千字",
          "includes": [
            "资深译员翻译",
            "基础术语一致性检查",
            "拼写/语法QA检查",
            "标准格式还原（Office文档）",
            "7天免费修改"
          ],
          "turnaround": "3-5个工作日",
          "highlighted": false
        },
        {
          "name": "专业翻译 + 审校",
          "badge": "推荐",
          "description": "适用于法律合同、技术手册、专利文件、认证材料等需要高度准确性的专业文档",
          "price": "¥320",
          "unit": "/千字",
          "includes": [
            "行业专业译员翻译",
            "独立审校人员逐句复核",
            "完整QA检查（40+项）",
            "专业格式还原（含SDLXLIFF/IDML等）",
            "术语库维护（长期客户）",
            "14天免费修改"
          ],
          "turnaround": "5-7个工作日",
          "highlighted": true
        },
        {
          "name": "高级翻译 + 母语润色",
          "badge": "",
          "description": "适用于对外发布的营销材料、品牌内容、学术论文投稿等对表达质量有极高要求的内容",
          "price": "¥400",
          "unit": "/千字",
          "includes": [
            "行业专业译员翻译",
            "独立审校人员复核",
            "目标语母语润色专家最终打磨",
            "完整QA + 可读性分析",
            "格式还原 + DTP排版（如需）",
            "专属项目经理全程对接",
            "30天免费修改"
          ],
          "turnaround": "7-10个工作日",
          "highlighted": false
        }
      ]
    },
    "special_services": {
      "section_title": "专项服务定价",
      "items": [
        {
          "service": "亚马逊POA申诉翻译",
          "price": "¥800起/篇",
          "note": "含申诉策略优化，首次未通过免费迭代一次"
        },
        {
          "service": "Listing本地化（标题+五点+描述）",
          "price": "¥500起/ASIN",
          "note": "含目标市场关键词调研"
        },
        {
          "service": "Listing本地化（含A+页面）",
          "price": "¥800起/ASIN",
          "note": "含A+图文内容本地化适配"
        },
        {
          "service": "公证翻译（加盖翻译章）",
          "price": "¥200起/页",
          "note": "含翻译准确性声明"
        },
        {
          "service": "DTP桌面排版",
          "price": "¥150起/页",
          "note": "InDesign/FrameMaker/Illustrator排版还原"
        },
        {
          "service": "字幕翻译与时间轴",
          "price": "¥30起/分钟",
          "note": "含字幕打轴和格式制作"
        }
      ]
    },
    "language_rates": {
      "section_title": "语种费率系数",
      "section_subtitle": "基准价格 × 语种系数 = 实际单价",
      "note": "以下系数基于中文↔目标语翻译方向。外对外（如英→日）费率需单独评估。",
      "tiers": [
        {
          "name": "常用语种",
          "coefficient": "1.0x",
          "languages": ["英语", "日语", "韩语"],
          "note": "直接使用基准价格"
        },
        {
          "name": "欧洲语种",
          "coefficient": "1.3-1.5x",
          "languages": ["法语", "德语", "俄语", "西班牙语", "葡萄牙语", "意大利语"],
          "note": "例：专业翻译 ¥320 × 1.4 = ¥448/千字"
        },
        {
          "name": "东南亚语种",
          "coefficient": "1.4-1.6x",
          "languages": ["泰语", "越南语", "印尼语", "马来语", "缅甸语", "柬埔寨语"],
          "note": "小语种译员稀缺，费率相应偏高"
        },
        {
          "name": "中东/非洲语种",
          "coefficient": "1.5-1.8x",
          "languages": ["阿拉伯语", "希伯来语", "波斯语", "土耳其语", "斯瓦希里语"],
          "note": "RTL语种含排版适配费用"
        }
      ]
    },
    "urgency_rates": {
      "section_title": "紧急通道加价规则",
      "section_subtitle": "紧急不加价质量——我们通过调配更多人力并行处理来压缩交付周期，而非压缩审校环节",
      "tiers": [
        { "name": "标准交付", "turnaround": "3-10个工作日", "surcharge": "0%", "note": "按约定周期交付" },
        { "name": "加急交付", "turnaround": "24-48小时", "surcharge": "+30%", "note": "工作日内优先排期" },
        { "name": "特急交付", "turnaround": "12-24小时", "surcharge": "+50%", "note": "全团队优先响应" },
        { "name": "超特急", "turnaround": "6-12小时", "surcharge": "+80%", "note": "仅限5000字以内，需电话确认" }
      ]
    },
    "discounts": {
      "section_title": "优惠政策",
      "items": [
        {
          "name": "批量折扣",
          "description": "单次项目超过5万字，享受总价95折；超过10万字，享受总价9折；超过30万字，专属议价。"
        },
        {
          "name": "翻译记忆复用折扣",
          "description": "与历史译文高度匹配（TM匹配率75%以上）的内容享受折扣：75-84%匹配减免40%，85-94%匹配减免60%，95-99%匹配减免75%，100%匹配减免85%。"
        },
        {
          "name": "长期合作优惠",
          "description": "签订年度合作协议的客户享受固定折扣（通常为基准价的85-90%），并获得优先排期、专属术语库维护和季度翻译质量回顾服务。"
        },
        {
          "name": "首单优惠",
          "description": "新客户首单享受9折优惠（与其他折扣不叠加），上限减免¥500。"
        }
      ]
    },
    "faq": {
      "section_title": "价格相关常见问题",
      "items": [
        {
          "question": "报价后还会有额外费用吗？",
          "answer": "不会。我们的报价是包含翻译、审校、QA检查和基础格式还原的全包价。只有在项目执行过程中客户要求增加不在原始需求范围内的服务（如新增语种、新增DTP排版）时，才会产生额外费用，且会事先与客户确认。"
        },
        {
          "question": "字数怎么算？中文和英文的计算方式一样吗？",
          "answer": "中文按字符数计算（不含标点和空格），英文按单词数（word count）计算。字数以CAT工具的分析结果为准——这个分析会区分全新内容、TM模糊匹配内容和完全匹配内容，各自适用不同的费率。我们可以在报价前提供详细的字数分析报告。"
        },
        {
          "question": "翻译记忆匹配折扣是什么意思？",
          "answer": "如果您之前在我们这里翻译过同类型文件，我们的翻译记忆库（TM）中会保存历史译文。新项目中与历史译文高度相似的内容可以自动匹配复用，这部分内容不需要从头翻译，因此费率会相应降低。匹配率越高，折扣越大。这也是为什么长期客户的翻译成本会持续下降。"
        },
        {
          "question": "可以先试译一小段再决定是否合作吗？",
          "answer": "可以。我们为新客户提供200字以内的免费试译服务。试译由正式项目的同级别译员执行，走完整的翻译+审校流程。试译结果在1个工作日内交付。"
        },
        {
          "question": "为什么小语种比英语贵？",
          "answer": "两个原因：一是小语种（如缅甸语、斯瓦希里语等）的合格译员数量远少于英语译员，稀缺性推高了成本；二是部分小语种涉及特殊排版处理（如阿拉伯语的RTL从右到左排版），需要额外的技术工作量。"
        }
      ]
    },
    "cta_bottom": {
      "title": "需要精准的翻译报价？",
      "subtitle": "上传文件或描述需求，30分钟内获取基于实际文件内容的精准报价",
      "cta_primary": "获取精准报价",
      "cta_secondary": "拨打400-869-9562"
    }
  }
}
```

### 2.2 Pricing 页面主文件

```tsx
// src/app/[locale]/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { i18nConfig, type Locale } from "@/lib/i18n/config";
import { JsonLd } from "@/components/shared/JsonLd";
import { PricingPrinciples } from "@/components/pricing/PricingPrinciples";
import { ServiceTiers } from "@/components/pricing/ServiceTiers";
import { SpecialServicesTable } from "@/components/pricing/SpecialServicesTable";
import { LanguageRates } from "@/components/pricing/LanguageRates";
import { UrgencyRates } from "@/components/pricing/UrgencyRates";
import { DiscountPolicies } from "@/components/pricing/DiscountPolicies";
import { FAQAccordion } from "@/components/services/ecommerce/FAQAccordion";
import { BottomCTA } from "@/components/services/ecommerce/BottomCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.pricing.meta;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://qqbytop.com/${locale}/pricing`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((l) => [l, `https://qqbytop.com/${l}/pricing`])
      ),
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const page = dict.pricing;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.meta.title,
          description: page.meta.description,
          mainEntity: {
            "@type": "OfferCatalog",
            name: "QQBY翻译服务价格目录",
            itemListElement: page.tiers.items.map(
              (tier: { name: string; price: string; unit: string }, index: number) => ({
                "@type": "Offer",
                position: index + 1,
                name: tier.name,
                priceSpecification: {
                  "@type": "PriceSpecification",
                  price: tier.price.replace("¥", ""),
                  priceCurrency: "CNY",
                  unitText: tier.unit,
                },
              })
            ),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faq.items.map(
            (item: { question: string; answer: string }) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })
          ),
        }}
      />

      {/* 面包屑 */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link href={`/${locale}`} className="hover:text-brand-600 transition-colors">
              {page.breadcrumb.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-brand-900">{page.breadcrumb.current}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-slate-900 to-brand-800">
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
              <span className="mr-2 h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              {page.hero.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {page.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              {page.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      <PricingPrinciples dict={page.pricing_principles} />
      <ServiceTiers locale={locale as Locale} dict={page.tiers} />
      <SpecialServicesTable dict={page.special_services} />
      <LanguageRates dict={page.language_rates} />
      <UrgencyRates dict={page.urgency_rates} />
      <DiscountPolicies dict={page.discounts} />
      <FAQAccordion dict={page.faq} />
      <BottomCTA locale={locale as Locale} dict={page.cta_bottom} />
    </>
  );
}
```

### 2.3 定价原则组件

```tsx
// src/components/pricing/PricingPrinciples.tsx

interface Principle {
  title: string;
  description: string;
}

interface PricingPrinciplesProps {
  dict: {
    section_title: string;
    items: Principle[];
  };
}

export function PricingPrinciples({ dict }: PricingPrinciplesProps) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-brand-900 sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {dict.items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/5 text-sm font-bold text-brand-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-brand-900">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 2.4 服务级别定价卡片组件

```tsx
// src/components/pricing/ServiceTiers.tsx
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

interface Tier {
  name: string;
  badge: string;
  description: string;
  price: string;
  unit: string;
  includes: string[];
  turnaround: string;
  highlighted: boolean;
}

interface ServiceTiersProps {
  locale: Locale;
  dict: {
    section_title: string;
    note: string;
    items: Tier[];
  };
}

export function ServiceTiers({ locale, dict }: ServiceTiersProps) {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-brand-900 sm:text-4xl">
          {dict.section_title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-500">
          {dict.note}
        </p>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {dict.items.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border p-8 transition-all ${
                tier.highlighted
                  ? "border-brand-600 bg-white shadow-xl shadow-brand-600/10 ring-1 ring-brand-600"
                  : "border-slate-200 bg-white hover:shadow-lg"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
                    {tier.badge}
                  </span>
                </div>
              )}

              <h3 className="text-xl font-semibold text-brand-900">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{tier.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-brand-600">
                  {tier.price}
                </span>
                <span className="text-sm text-slate-500">{tier.unit}</span>
              </div>

              <div className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                标准交付周期：{tier.turnaround}
              </div>

              <div className="mt-8 space-y-3">
                {tier.includes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-trust"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
                    </svg>
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/quote?tier=${index}`}
                className={`mt-8 flex w-full items-center justify-center rounded-lg px-6 py-3.5 text-sm font-semibold transition-all ${
                  tier.highlighted
                    ? "bg-brand-600 text-white shadow-sm hover:bg-brand-500"
                    : "bg-slate-100 text-brand-900 hover:bg-slate-200"
                }`}
              >
                获取精准报价
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 2.5 专项服务报价表组件

```tsx
// src/components/pricing/SpecialServicesTable.tsx

interface SpecialService {
  service: string;
  price: string;
  note: string;
}

interface SpecialServicesTableProps {
  dict: {
    section_title: string;
    items: SpecialService[];
  };
}

export function SpecialServicesTable({ dict }: SpecialServicesTableProps) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-bold text-brand-900 sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-brand-900">
                  服务项目
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-brand-900">
                  参考价格
                </th>
                <th className="hidden px-6 py-4 text-left text-sm font-semibold text-brand-900 sm:table-cell">
                  说明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dict.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-brand-900">
                    {item.service}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-brand-600">
                    {item.price}
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-slate-500 sm:table-cell">
                    {item.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
```

### 2.6 语种费率系数组件

```tsx
// src/components/pricing/LanguageRates.tsx

interface LanguageTier {
  name: string;
  coefficient: string;
  languages: string[];
  note: string;
}

interface LanguageRatesProps {
  dict: {
    section_title: string;
    section_subtitle: string;
    note: string;
    tiers: LanguageTier[];
  };
}

const tierBgColors = [
  "bg-blue-50 border-blue-200",
  "bg-purple-50 border-purple-200",
  "bg-emerald-50 border-emerald-200",
  "bg-amber-50 border-amber-200",
];

const tierTagColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

export function LanguageRates({ dict }: LanguageRatesProps) {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            {dict.section_title}
          </h2>
          <p className="mt-2 text-lg font-medium text-brand-600">
            {dict.section_subtitle}
          </p>
          <p className="mt-2 text-sm text-slate-500">{dict.note}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {dict.tiers.map((tier, index) => (
            <div
              key={index}
              className={`rounded-2xl border ${tierBgColors[index]} p-6`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-900">
                  {tier.name}
                </h3>
                <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-brand-600 shadow-sm">
                  {tier.coefficient}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {tier.languages.map((lang) => (
                  <span
                    key={lang}
                    className={`rounded-full ${tierTagColors[index]} px-3 py-1 text-sm font-medium`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">{tier.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 2.7 紧急通道加价规则组件

```tsx
// src/components/pricing/UrgencyRates.tsx

interface UrgencyTier {
  name: string;
  turnaround: string;
  surcharge: string;
  note: string;
}

interface UrgencyRatesProps {
  dict: {
    section_title: string;
    section_subtitle: string;
    tiers: UrgencyTier[];
  };
}

export function UrgencyRates({ dict }: UrgencyRatesProps) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            {dict.section_title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
            {dict.section_subtitle}
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4">
            {dict.tiers.map((tier, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={index}
                  className={`p-6 text-center ${
                    isFirst
                      ? "bg-white"
                      : index === dict.tiers.length - 1
                        ? "bg-red-50"
                        : "bg-amber-50/50"
                  } ${index > 0 ? "border-l border-slate-200" : ""}`}
                >
                  <div
                    className={`text-lg font-bold ${
                      isFirst ? "text-brand-trust" : "text-brand-accent"
                    }`}
                  >
                    {tier.surcharge === "0%" ? "免加价" : tier.surcharge}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-brand-900">
                    {tier.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {tier.turnaround}
                  </div>
                  <div className="mt-3 text-xs text-slate-400">{tier.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 2.8 优惠政策组件

```tsx
// src/components/pricing/DiscountPolicies.tsx

interface Discount {
  name: string;
  description: string;
}

interface DiscountPoliciesProps {
  dict: {
    section_title: string;
    items: Discount[];
  };
}

export function DiscountPolicies({ dict }: DiscountPoliciesProps) {
  return (
    <section className="bg-brand-900 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          {dict.section_title}
        </h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {dict.items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/20 text-xs font-bold text-brand-accent">
                  %
                </span>
                <h3 className="text-lg font-semibold text-white">
                  {item.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 三、专业资讯 / Blog 模块

### 3.1 Blog 字典文件

```json
// src/dictionaries/zh.json — blog
{
  "blog": {
    "meta": {
      "title": "专业资讯 | 翻译行业洞察 · 跨境合规指南 · 本地化技术分享 — QQBY",
      "description": "QQBY全球博译专业资讯：跨境电商合规翻译指南、法律翻译行业洞察、技术本地化最佳实践、翻译工具使用技巧。为翻译买家和从业者提供有价值的内容。"
    },
    "breadcrumb": {
      "home": "首页",
      "current": "专业资讯"
    },
    "hero": {
      "title": "专业资讯",
      "subtitle": "翻译行业洞察、跨境合规指南、技术本地化最佳实践"
    },
    "categories": {
      "all": "全部",
      "ecommerce": "跨境电商",
      "legal": "法律翻译",
      "technical": "技术本地化",
      "industry": "行业洞察"
    },
    "read_more": "阅读全文",
    "min_read": "分钟阅读",
    "published": "发布于",
    "related_posts": "相关文章",
    "back_to_blog": "返回资讯列表",
    "no_posts": "暂无文章",
    "cta_bottom": {
      "title": "需要专业的翻译服务支持？",
      "subtitle": "阅读我们的专业内容只是开始——让我们用实际交付来证明我们的专业性",
      "cta_primary": "获取翻译报价",
      "cta_secondary": "拨打400-869-9562"
    }
  }
}
```

### 3.2 博客文章数据层

```typescript
// src/lib/blog/posts.ts
export interface BlogPost {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  category: "ecommerce" | "legal" | "technical" | "industry";
  publishDate: string;
  readTime: number;
  author: string;
  coverImage?: string;
  content: string; // Markdown 内容
  tags: string[];
  relatedSlugs: string[];
}

// 实际项目中这些数据可以来自 CMS（如 Contentful/Sanity）或本地 MDX 文件
// 这里用静态数据做演示
const posts: BlogPost[] = [
  {
    slug: "amazon-poa-appeal-translation-guide",
    locale: "zh",
    title: "亚马逊POA申诉信翻译完全指南：从被封到恢复的72小时",
    excerpt:
      "账号被封后的每一分钟都在亏钱。这篇指南详细讲解POA申诉信的翻译要点——不是简单的中译英，而是基于亚马逊审核逻辑的策略性翻译。",
    category: "ecommerce",
    publishDate: "2025-01-15",
    readTime: 12,
    author: "QQBY跨境电商团队",
    content: `
## 为什么POA申诉信的翻译不能用机翻？

亚马逊的审核团队每天要处理数以万计的申诉信。他们不是在"阅读"你的申诉——他们是在用一套固定的审核框架快速筛选。如果你的申诉信在结构、用词和逻辑上不符合这套框架的预期，大概率会被直接驳回。

这就是为什么POA申诉信的翻译不是一个语言问题，而是一个策略问题。

## POA申诉信的三段式结构

亚马逊期望看到的POA结构是：

**1. Root Cause Analysis（根因分析）**

不是"我不知道为什么被封"，也不是"可能是因为XXX"。审核团队要看到的是具体的、可验证的根因。

翻译要点：使用明确的因果表述（"The root cause was..." "This occurred because..."），避免模糊表述（"We think..." "It might be..."）。

**2. Corrective Actions（纠正措施）**

不是"我们会改进"，而是"我们已经做了什么"。注意时态——已完成的措施用过去时（"We have implemented..."），正在进行的用现在完成进行时。

翻译要点：每一条纠正措施都要可量化、可追溯。翻译时确保动词强度足够（"implemented" > "started to" > "plan to"）。

**3. Preventive Measures（预防方案）**

展示你有系统化的预防机制，而不只是"下次会注意"。

翻译要点：使用流程化表述（"Established a [weekly/monthly] [review/audit] process..."），体现系统性。

## 常见翻译错误

- 把"根因分析"翻译成 "Reason Analysis" → 应该是 "Root Cause Analysis"
- 纠正措施中使用将来时 "We will do..." → 应该是 "We have done..."
- 语气过于谦卑或