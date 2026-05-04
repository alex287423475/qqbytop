export const locales = ["zh", "en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
};

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  badge: string;
  summary: string;
  price: string;
  hero: string;
  scenarios: string[];
  capabilities: { title: string; text: string }[];
  workflow: string[];
  faq: { q: string; a: string }[];
};

export type Industry = {
  slug: string;
  title: string;
  badge: string;
  summary: string;
  pain: string;
  scenarios: { title: string; text: string }[];
  capabilities: { title: string; text: string }[];
  caseStudy: { title: string; client: string; result: string };
  relatedServices: string[];
  faq: { q: string; a: string }[];
};

export const nav = [
  { href: "/services", label: "翻译服务" },
  { href: "/industries", label: "行业方案" },
  { href: "/tools", label: "诊断工具" },
  { href: "/about", label: "关于我们" },
  { href: "/pricing", label: "价格说明" },
  { href: "/blog", label: "专业资讯" },
];

export type DiagnosticTool = {
  slug: string;
  title: string;
  badge: string;
  summary: string;
  href: string;
  externalHref?: string;
  status: "available" | "planned";
  priority?: "primary" | "secondary";
  cta?: string;
  useCases: string[];
};

export const productCopyDiagnosticUrl =
  process.env.NEXT_PUBLIC_PRODUCT_COPY_DIAGNOSTIC_URL || "/tools/product-copy-compliance-checker";

export const diagnosticTools: DiagnosticTool[] = [
  {
    slug: "product-copy-compliance",
    title: "跨境产品文案合规翻译诊断",
    badge: "Amazon Listing / Shopify / 包装 / 说明书",
    summary: "粘贴产品英文文案，筛查翻译腔、合规声明、平台审核和转化表达风险，报告后可提交人工审校与合规改写需求。",
    href: "/tools/product-copy-compliance-checker",
    externalHref: productCopyDiagnosticUrl,
    status: "available",
    priority: "primary",
    cta: "开始诊断产品文案",
    useCases: ["Amazon Listing 翻译质量", "Shopify 产品页英文", "包装文案合规", "产品说明书风险", "独立站广告语"],
  },
  {
    slug: "amazon-listing-translation",
    title: "Amazon Listing 翻译质量诊断",
    badge: "Listing 翻译 / 平台审核 / 本地化",
    summary: "针对标题、五点、描述和功效表达，优先识别中式英语、夸大承诺、敏感合规词和影响转化的表达问题。",
    href: "/tools/amazon-listing-translation-checker",
    externalHref: `${productCopyDiagnosticUrl}/amazon-listing`,
    status: "available",
    priority: "primary",
    cta: "检查 Listing 文案",
    useCases: ["标题本地化", "五点描述优化", "敏感声明筛查", "人工 Listing 审校"],
  },
  {
    slug: "shopify-product-page-english",
    title: "Shopify 产品页英文诊断",
    badge: "独立站产品页 / SEO / 转化表达",
    summary: "检查 Shopify 或独立站产品页中的英文表达、Meta 描述、卖点顺序和合规风险，适合上线前快速筛查。",
    href: "/tools/shopify-product-page-english-checker",
    externalHref: `${productCopyDiagnosticUrl}/shopify-product-page`,
    status: "available",
    cta: "检查产品页英文",
    useCases: ["产品页英文", "Meta 描述", "卖点顺序", "SEO/GEO 内容"],
  },
  {
    slug: "packaging-copy-risk",
    title: "包装文案风险诊断",
    badge: "包装标签 / 警示语 / 声明风险",
    summary: "检查包装文案中可能影响平台审核、消费者理解或合规边界的表达，尤其适合母婴、美妆、家居和保健品。",
    href: "/tools/packaging-copy-risk-checker",
    externalHref: `${productCopyDiagnosticUrl}/packaging-copy`,
    status: "available",
    cta: "检查包装文案",
    useCases: ["包装标签", "安全警示", "认证声明", "人工合规翻译"],
  },
  {
    slug: "manual-translation-risk",
    title: "产品说明书翻译风险检查",
    badge: "说明书 / 安全警示 / 技术表达",
    summary: "检查说明书里的翻译腔、警示语缺失、单位表达和使用步骤风险，适合出海产品交付前复核。",
    href: "/tools/manual-translation-risk-checker",
    externalHref: `${productCopyDiagnosticUrl}/manual-translation-risk`,
    status: "available",
    cta: "检查说明书翻译",
    useCases: ["说明书翻译", "安全警示", "使用步骤", "技术文档本地化"],
  },
  {
    slug: "business-image",
    title: "海外商务第一印象诊断",
    badge: "形象诊断 / 英文简介 / 参考图",
    summary: "上传一张商务头像或个人形象照，生成基础诊断、12 项标准报告、参考形象图和英文个人品牌文案。",
    href: "/tools/business-image",
    status: "available",
    priority: "secondary",
    cta: "诊断商务形象",
    useCases: ["LinkedIn 头像优化", "官网 About 形象", "海外客户第一印象", "展会/名片商务形象"],
  },
  {
    slug: "study-abroad-essay-check",
    title: "留学文书诊断",
    badge: "PS / SOP / Motivation Letter",
    summary: "粘贴留学文书初稿，诊断主题、结构、申请匹配、经历说服力、英文表达和文本同质化风险。",
    href: "/tools/study-abroad-essay-check",
    externalHref: "/tools/study-abroad-essay-check",
    status: "available",
    priority: "secondary",
    cta: "诊断留学文书",
    useCases: ["PS 初稿诊断", "SOP 结构检查", "Motivation Letter 优化", "申请材料包审核"],
  },
];

export const home = {
  badge: "技术驱动的本地化服务商",
  title: "不只是翻译文字，更是交付确定性",
  subtitle:
    "从跨境电商合规文件到半导体专利说明书，QQBY 用技术流程确保格式完整、术语一致和法律合规。",
  stats: [
    ["50+", "覆盖语种"],
    ["2000+", "企业客户"],
    ["30+", "专业格式"],
    ["99.2%", "交付准确率"],
  ],
  techSteps: [
    ["原始格式解析", "支持 SDLXLIFF、IDML、MIF、Office、PDF 等文件的无损导入。"],
    ["标签保护与锁定", "自动识别代码标签、变量、占位符，避免译文损坏源格式。"],
    ["术语库与审校", "TM 匹配、术语库校验、人工精翻和行业专家审校并行。"],
    ["无损导出与 QA", "交付前完成格式、数字、术语、漏译、标点和一致性检查。"],
  ],
  testimonials: [
    ["张总", "某芯片设计公司知识产权总监", "12 项专利全部一次性通过各国专利局形式审查，权利要求书翻译质量非常稳定。"],
    ["李经理", "某家居品牌亚马逊运营负责人", "POA 申诉信在此前两次被驳回后一次通过，从接需求到交付只用了 8 小时。"],
    ["刘部长", "某德资汽车零部件企业质量部", "256 份 IATF 16949 文件翻译后，审核机构未提出任何翻译相关不符合项。"],
  ],
};

export const services: Service[] = [
  {
    slug: "document-translation",
    title: "专业文档翻译",
    shortTitle: "文档翻译",
    badge: "¥260 起/千字",
    price: "标准翻译 ¥260 起/千字，专业翻译+审校 ¥320 起/千字",
    summary: "商务、技术、学术、医疗、工程等多类型文档翻译，覆盖 50+ 语种。",
    hero: "不同文件需要不同翻译策略。我们按行业和文档类型匹配译员，交付可直接使用的译文。",
    scenarios: ["商务合同与标书", "技术手册与说明书", "论文摘要与医学文献", "简历、证件与公证材料"],
    capabilities: [
      { title: "语种覆盖", text: "英语、日语、韩语、法语、德语、俄语、西语、葡语、阿语等 50+ 语种。" },
      { title: "格式还原", text: "Word、Excel、PPT、PDF、双语审校稿等常见格式保持原版式交付。" },
      { title: "三重质控", text: "翻译、审校、QA 检查逐级完成，重点检查漏译、数字、术语和格式。" },
    ],
    workflow: ["文件评估", "匹配译员", "翻译与术语统一", "审校与 QA", "交付与售后修改"],
    faq: [
      { q: "可以保留原文件格式吗？", a: "常见 Office 与 PDF 文件可进行版式还原，复杂排版会在报价时单独说明。" },
      { q: "能否加急？", a: "可以。根据字数和语种安排加急通道，通常会增加 30% 到 100% 的加急费用。" },
    ],
  },
  {
    slug: "legal-compliance",
    title: "法律合规翻译",
    shortTitle: "法律合规",
    badge: "律师审校",
    price: "法律合规翻译 ¥320 起/千字，专利与诉讼材料按难度评估",
    summary: "合同、专利、诉讼仲裁、公证认证、公司治理与跨境合规材料翻译。",
    hero: "法律翻译不是文字转换，而是权利义务、责任边界和法律效果的准确转写。",
    scenarios: ["国际商业合同", "专利说明书与权利要求书", "诉讼仲裁材料", "公证认证与公司章程"],
    capabilities: [
      { title: "法律译员池", text: "由法律背景译员处理核心文本，重要项目可配置律师或专利代理方向审校。" },
      { title: "条款一致性", text: "统一定义条款、义务动词、责任描述和管辖权表述，避免前后冲突。" },
      { title: "合规交付", text: "支持中英双语对照、盖章翻译件、术语表和审校说明。" },
    ],
    workflow: ["法律风险识别", "术语表建立", "翻译", "法律审校", "定稿交付"],
    faq: [
      { q: "合同翻译可以盖章吗？", a: "可以提供符合用途的翻译盖章件，具体以材料用途和接收机构要求为准。" },
      { q: "专利翻译怎么保证权利要求准确？", a: "会单独处理权利要求书，重点检查开放式/封闭式表述、技术特征和从属关系。" },
    ],
  },
  {
    slug: "cross-border-ecommerce",
    title: "跨境电商合规翻译",
    shortTitle: "跨境电商",
    badge: "72h 紧急通道",
    price: "Listing 本地化按 SKU 计价，POA/合规文件按紧急度评估",
    summary: "亚马逊、Shopify、TikTok Shop、独立站出海所需翻译与本地化支持。",
    hero: "电商翻译的目标不是字面准确，而是让平台、审核员和目标市场消费者都读得懂。",
    scenarios: ["POA 申诉信", "Listing 标题五点描述", "CE/FDA 合规文件", "说明书与包装标签"],
    capabilities: [
      { title: "平台规则理解", text: "熟悉亚马逊申诉结构、合规审核材料和常见拒审原因。" },
      { title: "关键词本地化", text: "根据目标市场搜索习惯重排卖点，避免直译导致转化下降。" },
      { title: "紧急响应", text: "申诉、下架、合规补件类项目可开通 8-72 小时交付通道。" },
    ],
    workflow: ["平台问题诊断", "材料清单确认", "本地化翻译", "合规语言审校", "交付可提交版本"],
    faq: [
      { q: "POA 申诉信能机翻吗？", a: "不建议。POA 需要清晰表达根因、纠正措施和预防方案，机器直译容易被判定为模板化。" },
      { q: "Listing 是翻译还是重写？", a: "更接近本地化重写，需要兼顾关键词、卖点排序、文化语境和平台规则。" },
    ],
  },
  {
    slug: "technical-localization",
    title: "技术文档本地化",
    shortTitle: "技术本地化",
    badge: "30+ 格式",
    price: "SDLXLIFF/IDML/DITA 等格式处理按文件复杂度评估",
    summary: "软件、工程、制造、半导体、SaaS 和 API 技术文档的格式无损本地化。",
    hero: "技术本地化交付的不只是译文，而是可以直接导回系统、交给工程团队使用的文件。",
    scenarios: ["SDLXLIFF 双语文件", "API 文档与开发者文档", "软件 UI 与帮助中心", "设备手册与工程图纸"],
    capabilities: [
      { title: "标签保护", text: "保护变量、占位符、代码片段、HTML/XML 标签，降低导回失败风险。" },
      { title: "术语工程", text: "建立产品术语库、禁用词表和缩写表，确保多版本内容一致。" },
      { title: "无损交付", text: "支持原格式导出、双语对照、变更记录和 QA 报告。" },
    ],
    workflow: ["格式解析", "标签锁定", "术语预处理", "翻译审校", "导出验证"],
    faq: [
      { q: "SDLXLIFF 可以直接处理吗？", a: "可以，保留标签和段落结构，交付可导回 CAT 工具的目标文件。" },
      { q: "代码变量会不会被翻译？", a: "变量、占位符和代码片段会被识别并锁定，QA 阶段再次检查。" },
    ],
  },
];

export const industries: Industry[] = [
  {
    slug: "legal",
    title: "法律行业翻译方案",
    badge: "律所 · 法务 · 知识产权",
    summary: "服务国际律所、企业法务、知识产权团队和涉外争议解决项目。",
    pain: "法律文本的错误翻译会改变义务边界和责任承担，不能用普通商务翻译方式处理。",
    scenarios: [
      { title: "跨境合同", text: "采购、经销、投资、股权、技术许可等合同翻译。" },
      { title: "知识产权", text: "专利说明书、权利要求书、商标异议和无效材料。" },
      { title: "诉讼仲裁", text: "证据材料、律师函、裁决书、专家意见和法律备忘录。" },
    ],
    capabilities: [
      { title: "法律术语一致", text: "统一 defined terms、shall/may/must、liability、indemnity 等核心表达。" },
      { title: "双重审校", text: "语言审校和法律语义审校分离，降低风险。" },
      { title: "用途导向", text: "按签证、公证、法院提交、内部审阅等用途定制交付格式。" },
    ],
    caseStudy: { title: "芯片企业 12 项海外专利申请", client: "某芯片设计公司", result: "全部一次通过形式审查，无需补正翻译。" },
    relatedServices: ["legal-compliance", "technical-localization"],
    faq: [{ q: "法律行业是否支持保密协议？", a: "支持，涉密项目可签署 NDA，并限定项目成员访问权限。" }],
  },
  {
    slug: "ecommerce",
    title: "跨境电商行业翻译方案",
    badge: "亚马逊 · 独立站 · 品牌出海",
    summary: "覆盖 Listing 本地化、POA 申诉、合规认证、包装说明和售后内容。",
    pain: "跨境电商内容同时面对平台审核和目标市场消费者，直译往往既不合规也不转化。",
    scenarios: [
      { title: "平台申诉", text: "账号冻结、商品下架、侵权投诉、真实性审核等 POA 文件。" },
      { title: "商品本地化", text: "标题、五点、A+、说明书、包装、FAQ 和广告素材。" },
      { title: "合规文件", text: "CE/FDA/UKCA/UL 测试报告、SDS、用户手册与标签。" },
    ],
    capabilities: [
      { title: "懂平台规则", text: "按平台审核语言组织材料，避免空泛承诺和模板化表达。" },
      { title: "懂销售转化", text: "按目标市场重排卖点，兼顾关键词和消费者关注点。" },
      { title: "懂合规风险", text: "安全警示、产品声明和认证材料采用合规表达。" },
    ],
    caseStudy: { title: "家居品牌 POA 申诉", client: "某亚马逊卖家", result: "此前两次被驳回，重新翻译申诉后一次通过。" },
    relatedServices: ["cross-border-ecommerce", "document-translation"],
    faq: [{ q: "可以做整店本地化吗？", a: "可以，支持按 SKU 批量处理并建立品牌术语库。" }],
  },
  {
    slug: "technology",
    title: "科技行业翻译方案",
    badge: "软件 · SaaS · 半导体 · API",
    summary: "为软件、硬件、半导体、AI、SaaS 和开发者生态提供技术翻译。",
    pain: "科技翻译要求理解技术上下文，不能把 commit 翻译成承诺，把 branch 翻译成树枝。",
    scenarios: [
      { title: "软件本地化", text: "UI、帮助中心、版本说明、安装指南、开发者文档。" },
      { title: "API 文档", text: "接口说明、SDK 文档、错误码、变量与代码示例。" },
      { title: "半导体专利", text: "芯片架构、制程、封装、测试和权利要求书翻译。" },
    ],
    capabilities: [
      { title: "技术背景译员", text: "核心译员具备计算机、工程或电子信息相关背景。" },
      { title: "变量保护", text: "代码、参数、命令行、占位符和 Markdown 结构不被误改。" },
      { title: "版本一致性", text: "多版本文档用术语库和记忆库保持一致。" },
    ],
    caseStudy: { title: "SaaS 帮助中心多语言化", client: "某出海 SaaS 公司", result: "4 周完成 30 万字帮助中心和 UI 文案本地化。" },
    relatedServices: ["technical-localization", "legal-compliance"],
    faq: [{ q: "Markdown 和 API 文档能处理吗？", a: "可以，保留代码块、链接、表格和标题结构。" }],
  },
  {
    slug: "manufacturing",
    title: "制造业行业翻译方案",
    badge: "设备 · 汽车 · 质量体系",
    summary: "服务机械设备、汽车零部件、质量体系、安装维护和海外审厂项目。",
    pain: "制造业文件常涉及安全、质量、工艺和售后，术语错一次就可能造成现场执行风险。",
    scenarios: [
      { title: "设备手册", text: "安装、操作、维护、故障排查和安全警示。" },
      { title: "质量体系", text: "IATF 16949、ISO 9001、SOP、检验规范、审核文件。" },
      { title: "工程资料", text: "图纸、BOM、工艺流程、测试报告和培训材料。" },
    ],
    capabilities: [
      { title: "工程术语库", text: "按产品线建立术语库，统一部件、工艺、缺陷和检验项。" },
      { title: "安全表达准确", text: "Warning、Caution、Notice 等警示等级和责任边界准确处理。" },
      { title: "版式交付", text: "复杂表格、编号、图片说明和步骤结构尽量保持原文档一致。" },
    ],
    caseStudy: { title: "IATF 16949 体系文件翻译", client: "某德资汽车零部件企业", result: "256 份文件交付后，海外总部审厂顺利通过。" },
    relatedServices: ["technical-localization", "document-translation"],
    faq: [{ q: "能处理带图纸和表格的文件吗？", a: "可以，复杂版式会提前评估排版工作量。" }],
  },
];

export const pricing = {
  principles: ["报价即最终价格", "按用途匹配服务级别", "紧急需求提前说明加价规则", "术语库与基础 QA 包含在报价中"],
  tiers: [
    ["标准翻译", "¥260/千字起", "普通商务、说明类、内部阅读材料"],
    ["专业翻译 + 审校", "¥320/千字起", "法律、金融、技术、医学等专业材料"],
    ["高级翻译 + 母语润色", "¥400/千字起", "官网、营销、出版、投标陈述等对表达要求高的内容"],
  ],
  languageRates: [["中英互译", "1.0x"], ["中日/中韩", "1.2x"], ["中法/中德/中俄/中西", "1.3x"], ["小语种", "1.5x 起"]],
  urgency: [["48 小时", "+30%"], ["24 小时", "+60%"], ["当天交付", "+100% 起"]],
};

export const about = {
  intro:
    "北京全球博译翻译服务有限公司专注为企业客户提供专业翻译、本地化和跨境合规语言服务。",
  values: [
    ["专业", "按行业匹配译员，让懂业务的人处理业务文件。"],
    ["确定性", "用流程、术语库和 QA 把交付质量变成可管理的结果。"],
    ["保密", "以最小权限和保密协议保护客户资料。"],
    ["响应", "项目经理全程跟进，复杂项目分阶段交付。"],
  ],
  timeline: [
    ["2014", "开始服务企业笔译和口译项目"],
    ["2018", "建立法律、制造、技术等行业译员池"],
    ["2023", "扩展跨境电商合规与技术本地化服务"],
    ["2026", "升级为技术驱动的多语言交付体系"],
  ],
};

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function getIndustry(slug: string) {
  return industries.find((industry) => industry.slug === slug);
}
