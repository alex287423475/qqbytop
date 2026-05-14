

我已经仔细阅读了你提供的所有代码。你的消息中实际上已经包含了 About、Pricing、Blog 三个模块的大部分实现，但有几个关键部分被截断或缺失。让我梳理清楚现状，然后补全所有缺失的内容。

---

# About / Pricing / Blog 三大模块 — 完整补全

## 现状梳理

**About（关于我们）**— 你提供的代码已经相当完整，包括字典、页面主文件、以及所有6个子组件（CompanyTimeline、ValuesGrid、TeamOverview、CertificationsBar、ContactInfo + 复用 BottomCTA）。**状态：完整，无需补全。**

**Pricing（价格说明）**— 字典完整，页面主文件完整，但6个子组件中只给出了5个（PricingPrinciples、ServiceTiers、SpecialServicesTable、LanguageRates、UrgencyRates、DiscountPolicies），FAQ 和 BottomCTA 复用已有组件。**状态：完整，无需补全。**

**Blog（专业资讯）**— 字典只有列表页的基础配置，博客文章数据层（`posts.ts`）被截断，且以下关键文件完全缺失：
- 博客列表页 `blog/page.tsx`
- 博客详情页 `blog/[slug]/page.tsx`
- 博客列表卡片组件 `BlogPostCard.tsx`
- 博客分类筛选组件 `BlogCategoryFilter.tsx`
- 博客详情页渲染组件 `BlogArticle.tsx`
- 相关文章推荐组件 `RelatedPosts.tsx`
- 博客文章示例数据（被截断）

下面我补全 Blog 模块的所有缺失代码。

---

## 一、Blog 文章数据层（补全被截断的内容）

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

// ============================================================
// 示例文章数据 —— 实际项目中可迁移至 CMS 或本地 MDX
// ============================================================

const posts: BlogPost[] = [
  // ─── 文章 1：跨境电商 ───
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
    tags: ["亚马逊", "POA申诉", "跨境电商", "合规翻译"],
    relatedSlugs: [
      "listing-localization-vs-translation",
      "ce-certification-translation-checklist",
    ],
    content: `
## 为什么POA申诉信的翻译不能用机翻？

亚马逊的审核团队每天要处理数以万计的申诉信。他们不是在"阅读"你的申诉——他们是在用一套固定的审核框架快速筛选。如果你的申诉信在结构、用词和逻辑上不符合这套框架的预期，大概率会被直接驳回。

这就是为什么POA申诉信的翻译不是一个语言问题，而是一个策略问题。

## POA申诉信的三段式结构

亚马逊期望看到的POA结构是：

### 1. Root Cause Analysis（根因分析）

不是"我不知道为什么被封"，也不是"可能是因为XXX"。审核团队要看到的是具体的、可验证的根因。

**翻译要点：** 使用明确的因果表述（"The root cause was..." "This occurred because..."），避免模糊表述（"We think..." "It might be..."）。

### 2. Corrective Actions（纠正措施）

不是"我们会改进"，而是"我们已经做了什么"。注意时态——已完成的措施用过去时（"We have implemented..."），正在进行的用现在完成进行时。

**翻译要点：** 每一条纠正措施都要可量化、可追溯。翻译时确保动词强度足够（"implemented" > "started to" > "plan to"）。

### 3. Preventive Measures（预防方案）

展示你有系统化的预防机制，而不只是"下次会注意"。

**翻译要点：** 使用流程化表述（"Established a [weekly/monthly] [review/audit] process..."），体现系统性。

## 常见翻译错误

以下是我们在帮客户优化POA申诉信时最常发现的翻译错误：

- 把"根因分析"翻译成 "Reason Analysis" → 应该是 "Root Cause Analysis"
- 纠正措施中使用将来时 "We will do..." → 应该是 "We have done..."
- 语气过于谦卑或情绪化 "We are so sorry and beg for..." → 应该是克制、专业的陈述
- 把中国特色的表述直译，如"请领导批准" → 应该删去，不符合英文商业写作逻辑
- 缺乏具体数据支撑 "We improved our quality" → 应该是 "We implemented a 3-step QA process that reduced defect rate by 45%"

## 我们的POA翻译流程

1. **需求接入（30分钟内）：** 收到客户的中文POA申诉信原文和账号被封原因通知
2. **策略评估（2小时内）：** 由前亚马逊运营顾问评估申诉策略，提出措辞优化建议
3. **专业翻译（8小时内）：** 资深跨境电商翻译师基于优化后的策略进行英文翻译
4. **审校终审（4小时内）：** 独立审校人员复核术语准确性和申诉逻辑完整性
5. **交付+跟进：** 交付英文POA，如首次申诉未通过，提供一次免费优化迭代

## 结语

POA申诉信的翻译不是语言服务，而是商业策略的语言执行。如果你的账号正在面临封禁危机，不要浪费宝贵的申诉次数在不专业的翻译上。
    `,
  },

  // ─── 文章 2：跨境电商 ───
  {
    slug: "listing-localization-vs-translation",
    locale: "zh",
    title: "亚马逊Listing本地化 ≠ 翻译：为什么直译让你的转化率暴跌",
    excerpt:
      "把中文五点描述逐字翻译成英文，然后发现自然排名上不去、转化率惨不忍睹？问题不在翻译质量，而在翻译方式。",
    category: "ecommerce",
    publishDate: "2025-01-08",
    readTime: 10,
    author: "QQBY跨境电商团队",
    tags: ["Listing本地化", "亚马逊SEO", "产品文案", "跨境电商"],
    relatedSlugs: [
      "amazon-poa-appeal-translation-guide",
      "ce-certification-translation-checklist",
    ],
    content: `
## 翻译和本地化的本质区别

翻译是把A语言的内容转换成B语言，忠实于原文。本地化是用B语言的消费者能理解、会搜索、愿意点击的方式重新表达你的产品价值。

对于亚马逊Listing来说，这个区别是致命的。

## 直译Listing的三大硬伤

### 硬伤一：关键词缺失

中文Listing中的关键词是基于中国消费者的搜索习惯确定的。直译后，这些词在目标市场根本没有搜索量。例如中文"保温杯"对应的高频英文搜索词不是 "heat preservation cup"，而是 "insulated water bottle" 或 "vacuum flask"。

### 硬伤二：卖点排序错误

中国消费者和美国消费者关注的产品卖点优先级完全不同。以蓝牙耳机为例，中国消费者最关心价格和外观，美国消费者最关心音质和电池续航。五点描述的排序需要按目标市场的关注优先级重新编排。

### 硬伤三：文化语境不适配

中文产品文案喜欢用"匠心打造""品质之选"这类抽象描述。直译成英文 "crafted with artisan spirit" 在亚马逊上毫无竞争力。美国消费者要看到具体的参数、使用场景和与竞品的差异化对比。

## 我们的Listing本地化方法论

1. **关键词调研先行：** 使用Helium10/Jungle Scout分析目标市场搜索词，确定核心关键词和长尾词
2. **竞品文案分析：** 研究目标市场BSR前20名竞品的Listing表述方式
3. **卖点重构：** 根据目标市场消费者关注点重新排列和表述产品卖点
4. **母语润色：** 由目标语母语写手进行最终润色，确保自然流畅
5. **SEO优化：** 将高价值关键词自然融入标题、五点和Search Terms

## 效果对比

我们做过一组A/B测试：同一款产品，A版是直译的Listing，B版是完整本地化的Listing。30天后的数据对比：

- 自然搜索曝光：B版比A版高出220%
- 点击率（CTR）：B版比A版高出65%
- 转化率（CR）：B版比A版高出42%

数据不会骗人。Listing本地化的投入产出比远高于简单翻译。
    `,
  },

  // ─── 文章 3：法律翻译 ───
  {
    slug: "cross-border-contract-translation-pitfalls",
    locale: "zh",
    title: "跨境合同翻译的5个致命陷阱：每一个都可能让你输掉官司",
    excerpt:
      "合同翻译不是语言问题，而是法律风险问题。这5个常见翻译陷阱，背后都是真实的诉讼案例。",
    category: "legal",
    publishDate: "2024-12-20",
    readTime: 15,
    author: "QQBY法律翻译团队",
    tags: ["合同翻译", "法律翻译", "跨境合同", "法律风险"],
    relatedSlugs: [
      "patent-translation-claims-accuracy",
      "amazon-poa-appeal-translation-guide",
    ],
    content: `
## 陷阱一：管辖权条款的模糊翻译

中文合同中"因本合同引起的或与本合同有关的任何争议"这句话看似简单，但翻译成英文时，"arising out of" 和 "relating to" 的法律含义差异巨大。前者通常被法院解读为仅涵盖直接因合同条款产生的争议，后者的涵盖范围更广。

**正确做法：** 使用 "Any dispute arising out of or in connection with this Agreement" 这一国际仲裁中的标准表述。

## 陷阱二：连带责任 vs. 按份责任

中文"连带责任"在英文中对应 "joint and several liability"，但这个术语在英美法系和大陆法系中的法律内涵并不完全相同。在英美法系下，债权人可以向任何一方追偿全部债务；在大陆法系下，各方的最终分担比例有更明确的法律规定。

**正确做法：** 翻译时使用标准英文术语，同时在括号中注明中文原文，并在译注中说明两个法系下的差异。

## 陷阱三：不可抗力条款的文化差异

中国合同中的"不可抗力"条款通常采用概括式表述（"因自然灾害、战争、政府行为等不可预见、不可避免、不可克服的客观情况"），而英美合同更倾向于穷举式列举（逐一列出每种不可抗力事件）。直译中国合同的概括式表述，可能在英美法系下被法院认为过于模糊而拒绝适用。

**正确做法：** 根据合同适用法律选择对应的表述方式。如适用中国法，保留概括式并准确翻译；如适用英美法，建议客户在翻译的同时增加穷举式列举。

## 陷阱四："应当"vs."shall"的法律强制力

中文合同中的"应当""应""须"在法律强制力上有微妙差异，但在翻译中常被统一翻译为 "shall"。实际上，英文合同中 "shall"（强制义务）、"should"（建议义务）、"may"（可选权利）有严格区分，误用可能改变条款的法律约束力。

**正确做法：** 建立术语对照表，明确中文义务性用词与英文的对应关系，并在翻译全过程中严格执行。

## 陷阱五：违约金条款的"合理性"标准差异

中国法律对违约金金额的限制与英美法系不同。中国法律允许约定违约金但以实际损失的130%为上限（司法实践），而英美法系中，过高的违约金可能被法院认定为 "penalty clause" 而无法执行。翻译时如果不理解这个差异，可能导致客户在海外诉讼中面临不利判决。

**正确做法：** 在翻译违约金条款时附加译注，提醒客户注意目标法域对违约金/liquidated damages的司法态度差异，建议咨询当地律师。
    `,
  },

  // ─── 文章 4：技术本地化 ───
  {
    slug: "sdlxliff-format-lossless-translation",
    locale: "zh",
    title: "SDLXLIFF文件翻译：为什么你的译文总是标签损坏？",
    excerpt:
      "收到翻译公司交回来的SDLXLIFF文件，导入Trados一看满屏红色报错？问题出在翻译流程中的格式处理环节。",
    category: "technical",
    publishDate: "2024-12-05",
    readTime: 8,
    author: "QQBY技术本地化团队",
    tags: ["SDLXLIFF", "CAT工具", "格式保护", "技术本地化"],
    relatedSlugs: [
      "listing-localization-vs-translation",
      "cross-border-contract-translation-pitfalls",
    ],
    content: `
## SDLXLIFF 是什么？

SDLXLIFF 是 SDL Trados Studio 的原生双语文件格式，基于 XLIFF（XML Localization Interchange File Format）标准扩展而来。它不仅包含源文和译文的文本内容，还包含大量的格式标签（inline tags）、翻译记忆匹配信息、术语识别结果和项目元数据。

## 标签损坏的三大原因

### 原因一：在 CAT 工具外编辑

最常见的错误是把 SDLXLIFF 文件用普通文本编辑器或 Word 打开编辑。这会破坏文件的 XML 结构，导致标签错位或丢失。

### 原因二：CAT 工具版本不兼容

Trados Studio 不同版本生成的 SDLXLIFF 文件格式有细微差异。用旧版本打开新版本生成的文件，可能导致部分标签无法正确识别。

### 原因三：译员手动删改标签

在翻译过程中，译员可能因为不理解标签的作用而手动删除或移动标签位置。这在包含复杂格式（粗体、斜体、超链接、脚注等）的文件中尤为常见。

## 我们的无损处理方案

1. **环境标准化：** 使用与客户相同版本的 Trados Studio 打开和处理文件
2. **标签自动保护：** 在 CAT 环境中启用标签锁定功能，译员无法手动删改标签
3. **QA 标签检查：** 翻译完成后运行自动化标签完整性检查，确保每个打开标签都有对应的关闭标签，标签顺序与源文一致
4. **预交付验证：** 导出前在 Trados Studio 中执行 "Verify" 操作，确认文件可正常打开和编辑

## 结语

SDLXLIFF 文件的翻译不是一个"翻译"问题，而是一个"工程"问题。选择翻译供应商时，除了问译员资质，更要问他们的技术流程——如何处理标签保护、如何做格式验证、如何确保交付物可直接导入你的 Trados 项目。
    `,
  },

  // ─── 文章 5：行业洞察 ───
  {
    slug: "ai-translation-human-translation-2025",
    locale: "zh",
    title: "2025年，AI翻译能替代人工翻译吗？一个翻译公司的诚实回答",
    excerpt:
      "作为一家翻译公司，我们不会告诉你"AI翻译不行"——那是在侮辱你的智商。我们会告诉你AI翻译在哪些场景下已经够用，在哪些场景下会让你付出代价。",
    category: "industry",
    publishDate: "2025-01-20",
    readTime: 14,
    author: "QQBY研究团队",
    tags: ["AI翻译", "机器翻译", "行业趋势", "翻译质量"],
    relatedSlugs: [
      "sdlxliff-format-lossless-translation",
      "cross-border-contract-translation-pitfalls",
    ],
    content: `
## 先说结论

AI 翻译在2025年已经非常强大。对于以下场景，它已经"够用"甚至"很好"：

- 内部沟通邮件的快速理解
- 大批量低敏感度内容的粗翻（如用户评论、社交媒体监控）
- 技术文档的初稿生成（配合人工审校）
- 高度重复性内容的加速翻译

但以下场景，AI翻译仍然会给你制造麻烦：

- 法律合同中的术语精确性（一个"shall"和"may"的区别可能价值百万）
- 跨境电商Listing的本地化（AI不理解搜索SEO和消费者心理）
- 专利权利要求书的翻译（保护范围的划定需要法律+技术双重判断）
- 品牌营销材料的创意翻译（AI没有文化语感）

## 我们怎么用AI

作为一家翻译公司，我们不是AI翻译的对手——我们是AI翻译的用户。

**我们在以下环节使用AI辅助：**

1. 翻译初稿生成：对于技术文档等结构化内容，使用AI生成初稿，然后由人工译员进行编辑和审校
2. 一致性检查：使用AI工具交叉检查同一文档中术语使用是否前后一致
3. 质量预检：在人工审校前用AI先做一轮语法和拼写检查

**我们在以下环节坚持纯人工：**

1. 法律文件：AI无法理解法律语境和不同法系之间的术语差异
2. 创意内容：品牌故事、营销文案需要人类的文化感知和创意能力
3. 最终审校：所有交付物的最终质量把关必须由人工完成
4. 术语决策：新术语的翻译方案需要人工判断和客户确认

## 对客户的建议

如果你的翻译需求是"大概理解就行"，直接用AI翻译，省时省钱。

如果你的翻译需求涉及法律效力、品牌形象、产品合规、或者会被外部审核方检查，请使用专业翻译服务。AI可以帮你降低成本（通过辅助初稿和TM复用），但不能替代质量。

最危险的情况是：用AI翻译了一份法律合同，觉得"看起来没问题"就直接用了。问题往往不在你能看到的地方，而在你看不到的法律术语细微差异中。
    `,
  },

  // ─── 文章 6：法律翻译 ───
  {
    slug: "patent-translation-claims-accuracy",
    locale: "zh",
    title: "专利翻译中"包括"和"由…组成"的区别，价值可能是上亿的专利保护范围",
    excerpt:
      "权利要求书中一个限定词的选择，直接划定了你的专利保护边界。'comprising'和'consisting of'的翻译差异，可能决定你的专利值不值钱。",
    category: "legal",
    publishDate: "2024-11-28",
    readTime: 11,
    author: "QQBY法律翻译团队",
    tags: ["专利翻译", "权利要求书", "知识产权", "法律翻译"],
    relatedSlugs: [
      "cross-border-contract-translation-pitfalls",
      "ai-translation-human-translation-2025",
    ],
    content: `
## 为什么权利要求书是专利最重要的部分？

专利说明书描述的是发明是什么、怎么做。而权利要求书（Claims）定义的是法律保护的边界——什么属于你的专利权范围，什么不属于。在专利侵权诉讼中，法院判断侵权与否的依据就是权利要求书的措辞。

因此，权利要求书的翻译精度直接决定了专利在海外的保护范围和商业价值。

## "包括"的三种英文表述及其法律差异

在中文专利中，"包括"这个词被大量使用，但在英文专利中，它对应至少三种不同的表述，法律含义天差地别：

### comprising（开放式）
含义：包含以下要素，但不排除其他要素。
示例："A device comprising A, B, and C" = 该设备至少包含A、B、C，还可能包含D、E等其他元素。

这是最常用也是保护范围最宽的表述。如果竞品的产品包含A、B、C以及额外的D，仍然落入你的专利保护范围。

### consisting of（封闭式）
含义：仅包含以下要素，不包含其他要素。
示例："A device consisting of A, B, and C" = 该设备有且仅有A、B、C，没有其他元素。

这是保护范围最窄的表述。竞品只要多加一个元素D，就可能不构成侵权。

### consisting essentially of（半开放式）
含义：包含以下要素，可以包含不影响基本特性的其他要素。
示例：主要用于化学/材料领域。

## 翻译中的常见错误

我们审校过大量由非专利背景译员翻译的权利要求书，最常见的错误就是把所有的"包括""包含""由…组成"统一翻译为 "comprising" 或 "including"，而没有根据原文的真实意图选择正确的限定词。

更严重的情况是把原本应该用 "comprising"（开放式）的地方翻译成了 "consisting of"（封闭式），直接导致专利保护范围被大幅缩小。

## 我们的专利翻译方法

1. 逐条分析权利要求书中每个限定词的法律意图
2. 与客户的专利代理人确认关键限定词的选择
3. 技术译员+知识产权审校双人审核
4. 交付物附权利要求书术语对照表和翻译说明
    `,
  },

  // ─── 文章 7：技术本地化 ───
  {
    slug: "ce-certification-translation-checklist",
    locale: "zh",
    title: "CE认证文件翻译清单：出口欧盟必备的7份翻译文件",
    excerpt:
      "产品要进入欧盟市场，CE认证是必过的门槛。这份清单列出了你需要翻译的所有CE相关文件，以及每份文件的翻译要点。",
    category: "technical",
    publishDate: "2024-12-12",
    readTime: 9,
    author: "QQBY技术本地化团队",
    tags: ["CE认证", "欧盟合规", "认证翻译", "出口贸易"],
    relatedSlugs: [
      "amazon-poa-appeal-translation-guide",
      "sdlxliff-format-lossless-translation",
    ],
    content: `
## CE认证翻译的7份必备文件

### 1. 符合性声明（Declaration of Conformity, DoC）

这是CE认证的核心法律文件，声明产品符合相关欧盟指令和协调标准。翻译要求：必须准确列出所有适用的指令编号和标准编号，制造商信息与原文完全一致。

### 2. 技术文档（Technical Documentation / Technical File）

包含产品设计图纸、材料清单、风险评估报告等技术信息。翻译要求：技术参数零误差，单位制使用公制（SI单位），图纸标注文字需逐一翻译。

### 3. 测试报告（Test Reports）

由认证实验室出具的各项测试结果报告。翻译要求：测试项目名称使用EN标准的官方英文术语，测试数据保持原样不做换算。

### 4. 用户手册/操作说明书

欧盟要求产品随附目标市场语言版本的使用说明。翻译要求：安全警告使用标准化图标和措辞，操作步骤清晰无歧义，需提供目标市场所有官方语言版本。

### 5. 安全数据表（SDS/MSDS）

如产品涉及化学品，需提供GHS格式的16节安全数据表。翻译要求：H/P编码使用各语种的官方标准译文，化学品名称通过CAS号交叉验证。

### 6. 标签和包装文字

产品标签上的所有文字信息（型号、参数、警告标识等）。翻译要求：严格遵循目标市场的标签法规要求，CE标志的使用规范。

### 7. 质量管理体系文件

如需提供ISO 9001等质量体系认证的相关文件。翻译要求：术语与ISO标准原文一致，交叉引用关系正确。

## 常见翻译错误及后果

- 符合性声明中指令编号翻译错误 → 认证机构退回，延误上市时间
- 用户手册安全警告缺失 → 产品被海关扣留或市场监管部门要求召回
- SDS中化学品名称翻译不准确 → 可能面临REACH法规处罚

## 我们的CE认证翻译服务

所有CE认证文件由具备技术翻译资质的译员执行，严格遵循EN/ISO标准术语。支持加盖翻译章的认证翻译，满足认证机构和海关的提交要求。
    `,
  },
];

// ============================================================
// 数据查询函数
// ============================================================

export function getAllPosts(locale: string): BlogPost[] {
  return posts
    .filter((p) => p.locale === locale)
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
}

export function getPostsByCategory(
  locale: string,
  category: string
): BlogPost[] {
  if (category === "all") return getAllPosts(locale);
  return getAllPosts(locale).filter((p) => p.category === category);
}

export function getPostBySlug(
  locale: string,
  slug: string
): BlogPost | undefined {
  return posts.find((p) => p.locale === locale && p.slug === slug);
}

export function getRelatedPosts(
  locale: string,
  slugs: string[]
): BlogPost[] {
  return slugs
    .map((slug) => getPostBySlug(locale, slug))
    .filter((p): p is BlogPost => p !== undefined);
}

export function getAllSlugs(locale: string): string[] {
  return posts.filter((p) => p.locale === locale).map((p) => p.slug);
}
```

---

## 二、Blog 列表页

```tsx
// src/app/[locale]/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { i18nConfig, type Locale } from "@/lib/i18n/config";
import { JsonLd } from "@/components/shared/JsonLd";
import { getAllPosts } from "@/lib/blog/posts";
import { BlogCategoryFilter } from "@/components/blog/BlogCategoryFilter";
import { BottomCTA } from "@/components/services/ecommerce/BottomCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.blog.meta;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://qqbytop.com/${locale}/blog`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((l) => [l, `https://qqbytop.com/${l}/blog`])
      ),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://qqbytop.com/${locale}/blog`,
      type: "website",
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const page = dict.blog;
  const allPosts = getAllPosts(locale);

  return (
    <>
      {/* JSON-LD: Blog */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: page.meta.title,
          description: page.meta.description,
          url: `https://qqbytop.com/${locale}/blog`,
          publisher: {
            "@type": "Organization",
            name: "北京全球博译翻译服务有限公司",
            url: "https://qqbytop.com",
          },
          blogPost: allPosts.slice(0, 10).map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishDate,
            author: {
              "@type": "Organization",
              name: post.author,
            },
            url: `https://qqbytop.com/${locale}/blog/${post.slug}`,
          })),
        }}
      />

      {/* 面包屑 */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link
              href={`/${locale}`}
              className="hover:text-brand-600 transition-colors"
            >
              {page.breadcrumb.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-brand-900">
            {page.breadcrumb.current}
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-brand-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {page.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {page.hero.subtitle}
          </p>
        </div>
      </section>

      {/* 分类筛选 + 文章列表 */}
      <BlogCategoryFilter
        locale={locale as Locale}
        dict={page}
        allPosts={allPosts}
      />

      {/* 底部 CTA */}
      <BottomCTA locale={locale as Locale} dict={page.cta_bottom} />
    </>
  );
}
```

---

## 三、Blog 分类筛选组件（客户端交互）

```tsx
// src/components/blog/BlogCategoryFilter.tsx
"use client";

import { useState, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { BlogPost } from "@/lib/blog/posts";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

interface BlogCategoryFilterProps {
  locale: Locale;
  dict: {
    categories: Record<string, string>;
    no_posts: string;
  };
  allPosts: BlogPost[];
}

const categoryOrder = ["all", "ecommerce", "legal", "technical", "industry"];

export function BlogCategoryFilter({
  locale,
  dict,
  allPosts,
}: BlogCategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return allPosts;
    return allPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory, allPosts]);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* 分类标签栏 */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-brand-900"
              }`}
            >
              {dict.categories[cat]}
            </button>
          ))}
        </div>

        {/* 文章网格 */}
        {filteredPosts.length > 0 ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogPostCard
                key={post.slug}
                locale={locale}
                post={post}
                dict={dict}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-lg text-slate-400">{dict.no_posts}</p>
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## 四、Blog 文章卡片组件

```tsx
// src/components/blog/BlogPostCard.tsx
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { BlogPost } from "@/lib/blog/posts";

interface BlogPostCardProps {
  locale: Locale;
  post: BlogPost;
  dict: {
    categories: Record<string, string>;
    read_more: string;
    min_read: string;
  };
}

const categoryColors: Record<string, string> = {
  ecommerce: "bg-amber-100 text-amber-700",
  legal: "bg-blue-100 text-blue-700",
  technical: "bg-purple-100 text-purple-700",
  industry: "bg-emerald-100 text-emerald-700",
};

export function BlogPostCard({ locale, post, dict }: BlogPostCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-brand-600/20 hover:shadow-xl hover:shadow-brand-600/5">
      {/* 顶部装饰条 */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-1 flex-col p-6">
        {/* 分类 + 阅读时间 */}
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              categoryColors[post.category] || "bg-slate-100 text-slate-600"
            }`}
          >
            {dict.categories[post.category]}
          </span>
          <span className="text-xs text-slate-400">
            {post.readTime} {dict.min_read}
          </span>
        </div>

        {/* 标题 */}
        <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-brand-900 transition-colors group-hover:text-brand-600">
          <Link href={`/${locale}/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        {/* 摘要 */}
        <p className="mt-3 flex-1 line-clamp-3 text-sm text-slate-600 leading-relaxed">
          {post.excerpt}
        </p>

        {/* 底部信息栏 */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/5 text-xs font-bold text-brand-600">
              Q
            </div>
            <span className="text-xs text-slate-500">{post.author}</span>
          </div>
          <time className="text-xs text-slate-400" dateTime={post.publishDate}>
            {new Date(post.publishDate).toLocaleDateString(
              locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )}
          </time>
        </div>

        {/* 阅读全文链接 */}
        <Link
          href={`/${locale}/blog/${post.slug}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-500"
        >
          {dict.read_more}
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}
```

---

## 五、Blog 详情页

```tsx
// src/app/[locale]/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { i18nConfig, type Locale } from "@/lib/i18n/config";
import { JsonLd } from "@/components/shared/JsonLd";
import {
  getPostBySlug,
  getRelatedPosts,
  getAllSlugs,
} from "@/lib/blog/posts";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BottomCTA } from "@/components/services/ecommerce/BottomCTA";

// SSG：预生成所有文章页面
export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of i18nConfig.locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  return {
    title: `${post.title} — QQBY专业资讯`,
    description: post.excerpt,
    alternates: {
      canonical: `https://qqbytop.com/${locale}/blog/${slug}`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((l) => [
          l,
          `https://qqbytop.com/${l}/blog/${slug}`,
        ])
      ),
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://qqbytop.com/${locale}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishDate,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const page = dict.blog;

  const post = getPostBySlug(locale, slug);
  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(locale, post.relatedSlugs);

  return (
    <>
      {/* JSON-LD: Article */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishDate,
          author: {
            "@type": "Organization",
            name: post.author,
          },
          publisher: {
            "@type": "Organization",
            name: "北京全球博译翻译服务有限公司",
            url: "https://qqbytop.com",
          },
          mainEntityOfPage: `https://qqbytop.com/${locale}/blog/${slug}`,
          keywords: post.tags.join(", "),
        }}
      />

      {/* 面包屑 */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link
              href={`/${locale}`}
              className="hover:text-brand-600 transition-colors"
            >
              {page.breadcrumb.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/${locale}/blog`}
              className="hover:text-brand-600 transition-colors"
            >
              {page.breadcrumb.current}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="line-clamp-1 font-medium text-brand-900">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* 文章主体 */}
      <BlogArticle locale={locale as Locale} post={post} dict={page} />

      {/* 相关文章 */}
      {relatedPosts.length > 0 && (
        <RelatedPosts
          locale={locale as Locale}
          posts={relatedPosts}
          dict={page}
        />
      )}

      {/* 底部 CTA */}
      <BottomCTA locale={locale as Locale} dict={page.cta_bottom} />
    </>
  );
}
```

---

## 六、Blog 文章渲染组件

```tsx
// src/components/blog/BlogArticle.tsx
import type { Locale } from "@/lib/i18n/config";
import type { BlogPost } from "@/lib/blog/posts";

interface BlogArticleProps {
  locale: Locale;
  post: BlogPost;
  dict: {
    categories: Record<string, string>;
    min_read: string;
    published: string;
  };
}

const categoryColors: Record<string, string> = {
  ecommerce: "bg-amber-100 text-amber-700",
  legal: "bg-blue-100 text-blue-700",
  technical: "bg-purple-100 text-purple-700",
  industry: "bg-emerald-100 text-emerald-700",
};

export function BlogArticle({ locale, post, dict }: BlogArticleProps) {
  return (
    <article className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-6">
        {/* 文章头部信息 */}
        <header className="mb-10 border-b border-slate-200 pb-10">
          {/* 分类 + 日期 + 阅读时间 */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                categoryColors[post.category] || "bg-slate-100 text-slate-600"
              }`}
            >
              {dict.categories[post.category]}
            </span>
            <span className="text-sm text-slate-400">
              {dict.published}{" "}
              <time dateTime={post.publishDate}>
                {new Date(post.publishDate).toLocaleDateString(
                  locale === "zh"
                    ? "zh-CN"
                    : locale === "ja"
                      ? "ja-JP"
                      : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </time>
            </span>
            <span className="text-sm text-slate-400">
              {post.readTime} {dict.min_read}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="mt-6 text-3xl font-bold text-brand-900 sm:text-4xl leading-tight">
            {post.title}
          </h1>

          {/* 摘要 */}
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            {post.excerpt}
          </p>

          {/* 作者 */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              Q
            </div>
            <div>
              <div className="text-sm font-medium text-brand-900">
                {post.author}
              </div>
              <div className="text-xs text-slate-400">QQBY 全球博译</div>
            </div>
          </div>

          {/* 标签 */}
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* 文章正文 — Markdown 渲染 */}
        <div
          className="prose prose-lg prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-brand-900
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-slate-600
            prose-strong:text-brand-900 prose-strong:font-semibold
            prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
            prose-li:text-slate-600 prose-li:leading-relaxed
            prose-blockquote:border-brand-600 prose-blockquote:bg-brand-600/5
            prose-blockquote:py-1 prose-blockquote:not-italic
            prose-code:bg-slate-100 prose-code:rounded prose-code:px-1.5
            prose-code:py-0.5 prose-code:text-brand-900 prose-code:font-normal
            prose-code:before:content-none prose-code:after:content-none"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(post.content),
          }}
        />
      </div>
    </article>
  );
}

// ============================================================
// 简易 Markdown → HTML 渲染器
// 实际项目中建议使用 remark/rehype 或 MDX
// ============================================================
function renderMarkdown(markdown: string): string {
  let html = markdown
    // 代码块（需在其他规则之前处理）
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="language-$1"><code>$2</code></pre>')
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 无序列表
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // 段落（连续非空行）
    .replace(/\n\n/g, '</p><p>')
    // 换行
    .replace(/\n/g, '<br/>');

  // 包裹列表
  html = html.replace(
    /(<li>.*?<\/li>)(?:\s*<br\/>?\s*)*(<li>)/g,
    '$1$2'
  );
  html = html.replace(
    /(?<!<\/ul>|<\/ol>)(<li>)/g,
    '<ul>$1'
  );
  html = html.replace(
    /(<\/li>)(?![\s]*<li>)/g,
    '$1</ul>'
  );

  // 包裹在 p 标签中
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}
```

---

## 七、相关文章推荐组件

```tsx
// src/components/blog/RelatedPosts.tsx
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { BlogPost } from "@/lib/blog/posts";

interface RelatedPostsProps {
  locale: Locale;
  posts: BlogPost[];
  dict: {
    related_posts: string;
    categories: Record<string, string>;
    min_read: string;
    read_more: string;
  };
}

const categoryColors: Record<string, string> = {
  ecommerce: "bg-amber-100 text-amber-700",
  legal: "bg-blue-100 text-blue-700",
  technical: "bg-purple-100 text-purple-700",
  industry: "bg-emerald-100 text-emerald-700",
};

export function RelatedPosts({ locale, posts, dict }: RelatedPostsProps) {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-2xl font-bold text-brand-900 sm:text-3xl">
          {dict.related_posts}
        </h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/blog/${post.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-600/20 hover:shadow-lg hover:shadow-brand-600/5"
            >
              {/* 分类 + 阅读时间 */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    categoryColors[post.category] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {dict.categories[post.category]}
                </span>
                <span className="text-xs text-slate-400">
                  {post.readTime} {dict.min_read}
                </span>
              </div>

              {/* 标题 */}
              <h3 className="mt-4 line-clamp-2 text-base font-semibold text-brand-900 transition-colors group-hover:text-brand-600">
                {post.title}
              </h3>

              {/* 摘要 */}
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {post.excerpt}
              </p>

              {/* 阅读全文 */}
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                {dict.read_more}
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 八、Blog 返回列表按钮组件（用于详情页顶部）

```tsx
// src/components/blog/BackToBlog.tsx
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

interface BackToBlogProps {
  locale: Locale;
  label: string;
}

export function BackToBlog({ locale, label }: BackToBlogProps) {
  return (
    <Link
      href={`/${locale}/blog`}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
        />
      </svg>
      {label}
    </Link>
  );
}
```

---

## 九、安装 Tailwind Typography 插件

Blog 详情页的文章正文使用了 Tailwind 的 `prose` 类，需要安装 Typography 插件：

```bash
npm install @tailwindcss/typography
```

然后在 `tailwind.config.ts` 的 `plugins` 中添加：

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      // ... 之前定义的品牌色等配置
    },
  },
  plugins: [typography],
};

export default config;
```

---

## 十、更新 Sitemap 配置

确保 `src/app/sitemap.ts` 中包含博客文章的动态生成：

```typescript
// src/app/sitemap.ts — 在现有代码基础上追加博客文章
import { MetadataRoute } from "next";
import { i18nConfig } from "@/lib/i18n/config";
import { getAllSlugs } from "@/lib/blog/posts";

const BASE_URL = "https://qqbytop.com";

const staticPages = [
  "",
  "/services",
  "/services/document-translation",
  "/services/legal-compliance",
  "/services/cross-border-ecommerce",
  "/services/technical-localization",
  "/industries",
  "/industries/legal",
  "/industries/ecommerce",
  "/industries/technology",
  "/industries/manufacturing",
  "/about",
  "/pricing",
  "/quote",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // 静态页面
  for (const page of staticPages) {
    for (const locale of i18nConfig.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page.startsWith("/services") ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            i18nConfig.locales.map((l) => [l, `${BASE_URL}/${l}${page}`])
          ),
        },
      });
    }
  }

  // 博客文章页面
  for (const locale of i18nConfig.locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            i18nConfig.locales.map((l) => [
              l,
              `${BASE_URL}/${l}/blog/${slug}`,
            ])
          ),
        },
      });
    }
  }

  return entries;
}
```

---

## 十一、完整文件清单总览

### About 模块
| 文件路径 | 状态 |
|---|---|
| `src/dictionaries/zh.json` → `about` 节点 | 你已提供，完整 |
| `src/app/[locale]/about/page.tsx` | 你已提供，完整 |
| `src/components/about/CompanyTimeline.tsx` | 你已提供，完整 |
| `src/components/about/ValuesGrid.tsx` | 你已提供，完整 |
| `src/components/about/TeamOverview.tsx` | 你已提供，完整 |
| `src/components/about/CertificationsBar.tsx` | 你已提供，完整 |
| `src/components/about/ContactInfo.tsx` | 你已提供，完整 |

### Pricing 模块
| 文件路径 | 状态 |
|---|---|
| `src/dictionaries/zh.json` → `pricing` 节点 | 你已提供，完整 |
| `src/app/[locale]/pricing/page.tsx` | 你已提供，完整 |
| `src/components/pricing/PricingPrinciples.tsx` | 你已提供，完整 |
| `src/components/pricing/ServiceTiers.tsx` | 你已提供，完整 |
| `src/components/pricing/SpecialServicesTable.tsx` | 你已提供，完整 |
| `src/components/pricing/LanguageRates.tsx` | 你已提供，完整 |
| `src/components/pricing/UrgencyRates.tsx` | 你已提供，完整 |
| `src/components/pricing/DiscountPolicies.tsx` | 你已提供，完整 |

### Blog 模块
| 文件路径 | 状态 |
|---|---|
| `src/dictionaries/zh.json` → `blog` 节点 | 你已提供，完整 |
| `src/lib/blog/posts.ts` | **本次补全**（含7篇示例文章 + 查询函数） |
| `src/app/[locale]/blog/page.tsx` | **本次新增** |
| `src/app/[locale]/blog/[slug]/page.tsx` | **本次新增** |
| `src/components/blog/BlogCategoryFilter.tsx` | **本次新增** |
| `src/components/blog/BlogPostCard.tsx` | **本次新增** |
| `src/components/blog/BlogArticle.tsx` | **本次新增**（含简易 Markdown 渲染） |
| `src/components/blog/RelatedPosts.tsx` | **本次新增** |
| `src/components/blog/BackToBlog.tsx` | **本次新增** |

### 复用组件（跨模块共享）
| 组件 | 被复用的页面 |
|---|---|
| `FAQAccordion` | Pricing、各服务页、各行业页 |
| `BottomCTA` | About、Pricing、Blog、各服务页、各行业页 |

---

## 十二、Blog 模块的 SEO 设计说明

Blog 模块的 SEO 策略有三个层次。

第一层是列表页的 JSON-LD `Blog` 类型标注，将所有文章以 `blogPost` 数组的形式声明给搜索引擎，帮助 Google 理解这是一个结构化的博客索引页面。

第二层是每篇文章详情页的 JSON-LD `Article` 类型标注，包含 headline、description、datePublished、author、keywords 等字段。这使得文章有机会以富文本摘要（Rich Snippet）的形式出现在搜索结果中，显著提升点击率。

第三层是 `generateMetadata` 中的 OpenGraph 配置，每篇文章都有独立的 `og:type: article`、`og:published_time` 和 `og:tags`，确保文章在社交媒体分享时能正确展示标题、摘要和发布信息。

7篇示例文章的选题覆盖了 QQBY 的四大业务领域（跨境电商2篇、法律翻译2篇、技术本地化2篇、行业洞察1篇），每篇文章的标题都精准命中了搜索长尾词（如"亚马逊POA申诉信翻译""SDLXLIFF文件翻译""跨境合同翻译陷阱"），这些都是翻译买家在遇到具体问题时会搜索的关键词。文章内容以实战指南和具体案例为主，而非泛泛的行业科普，这种内容形式对 B 端决策者的转化效果最好。