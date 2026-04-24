# QQBY SEO 全自动文章生产线施工计划 V3

> 适用项目：`C:\wwwroot\www.qqbytop.com\next-vercel`
>
> 本方案按“主链路优先、增强项后置”的原则设计。目标不是一次性堆满功能，而是先把内容生产、审核、发布、上线这条主路径跑通，再增加仪表盘、实时日志、多模型切换等增强能力。

---

## 1. 项目目标

为 QQBY 官网构建一套可长期运行的 SEO 内容生产线，实现：

- Markdown 文章库替代硬编码博客数据。
- 支持 `zh / en / ja` 三语文章独立管理。
- 本地 Local Brain 读取关键词库，自动生成文章草稿。
- 自动执行结构、长度、关键词、红线词等质量校验。
- 保留人工审核放行，不允许 AI 自行跳过人工审核。
- 文章发布到 Next.js 前端后自动被博客页、详情页、Sitemap、Schema 消费。
- 最终通过 GitHub + Vercel 自动部署上线。

本方案中的“全自动”定义为：

```text
关键词输入
→ 自动生成草稿
→ 自动校验
→ 人工审核放行
→ 自动发布到站点内容库
→ 自动构建部署
```

也就是说，自动化覆盖生产、校验、入库和上线流程，但人工审核仍是质量红线。

---

## 2. 实施原则

### 2.1 先主链路，后增强项

V1 先完成以下能力：

- Markdown 文章系统。
- 博客页和详情页改造。
- Sitemap 自动收录文章。
- Local Brain 草稿生成。
- 自动校验。
- 人工审核。
- 发布到 `content/articles`。

V2 再增加以下增强项：

- 管线仪表盘。
- 提供商切换 UI。
- 实时日志。
- 单篇重跑。
- 一键全流程。

### 2.2 安全优先

- Markdown 渲染必须经过清洗，不允许直接开放原始 HTML。
- 仪表盘和本地执行 API 只允许在本地开发环境启用。
- AI API Key 只放在本地 `.env`，不进入 Git。

### 2.3 内容质量优先

- 自动校验不等于审核通过。
- “validated” 只表示技术结构合格，不表示业务质量合格。
- 只有进入 “approved” 的文章才允许发布。

---

## 3. 总体架构

```text
┌──────────────────────── 生产侧（local-brain）────────────────────────┐
│                                                                     │
│ keywords.csv                                                        │
│   ↓                                                                 │
│ generate-article.mjs                                                │
│   ↓                                                                 │
│ drafts/                                                             │
│   ↓                                                                 │
│ validate-article.mjs                                                │
│   ↓                                                                 │
│ validated/                                                          │
│   ↓                                                                 │
│ approve-article.mjs（人工审核后执行）                                 │
│   ↓                                                                 │
│ approved/                                                           │
│   ↓                                                                 │
│ publish-article.mjs                                                 │
│   ↓                                                                 │
│ content/articles/{locale}/{slug}/index.md                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌──────────────────────── 展示侧（Next.js）───────────────────────────┐
│                                                                     │
│ lib/articles.ts                                                     │
│   ↓                                                                 │
│ /[locale]/blog                                                      │
│ /[locale]/blog/[slug]                                               │
│ /sitemap.xml                                                        │
│ JSON-LD Schema                                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
                    git push → Vercel 自动部署
```

---

## 3.1 最新修正规则

以下规则优先于文档中其他一般性描述：

1. **旧文章迁移不是纯复制任务**
   - 当前旧博客文章篇幅较短。
   - 如果要满足本方案中的发布标准，迁移时必须同步补齐结构、FAQ、表格、CTA、内链，并扩写到可发布长度。
   - 因此，“旧文章迁移”按“结构迁移 + SEO 扩写”两段估时，不按纯搬运估时。

2. **`brain:validate` 只校验草稿，不代表可部署**
   - `brain:validate` 只面向 `drafts/`。
   - 发布前必须额外校验 `content/articles/` 中的真实内容库。
   - 因此新增 `brain:check-content`，作为上线前的最终内容完整性检查。

3. **`.gitignore` 必须在 Local Brain 开工前完成**
   - 在创建 `drafts/`、`validated/`、`approved/`、`reports/`、`pipeline.runtime.json` 之前，先写好 `.gitignore`。
   - 否则中间态文件极易被误提交进 Git 仓库。

---

## 4. 目录规划

### 4.1 网站内容目录

```text
content/
  articles/
    zh/
    en/
    ja/
```

发布后的文章全部写入：

```text
content/articles/{locale}/{slug}/index.md
```

示例：

```text
content/articles/zh/beijing-translation-price/index.md
content/articles/en/contract-translation-tips/index.md
content/articles/ja/patent-translation-checklist/index.md
```

### 4.2 Local Brain 目录

```text
local-brain/
  .env
  .env.example
  inputs/
    keywords.csv
    red-lines.csv
  prompts/
    article-system.md
    article-user.md
  drafts/
  validated/
  approved/
  rejected/
  reports/
  status/
    pipeline.example.json
    pipeline.runtime.json
  scripts/
    ai-provider.mjs
    generate-article.mjs
    validate-article.mjs
    approve-article.mjs
    publish-article.mjs
    status-updater.mjs
```

说明：

- `drafts/`：AI 草稿。
- `validated/`：技术校验通过，待人工审核。
- `approved/`：人工审核通过，待发布。
- `rejected/`：退回重写或人工否决。
- `reports/`：生成报告、校验报告、错误报告。
- `pipeline.runtime.json`：运行状态文件，不进 Git。

---

## 5. 依赖规划

安装依赖：

```bash
npm install gray-matter remark remark-gfm remark-rehype rehype-stringify rehype-sanitize csv-parse
```

依赖用途：

| 包名 | 用途 |
|------|------|
| `gray-matter` | 解析 frontmatter |
| `remark` | Markdown 解析 |
| `remark-gfm` | 支持表格、任务列表等 GFM 语法 |
| `remark-rehype` | Markdown AST 转 HTML AST |
| `rehype-stringify` | 输出 HTML |
| `rehype-sanitize` | HTML 安全清洗 |
| `csv-parse` | 解析关键词 CSV |

不引入模型 SDK，统一使用原生 `fetch()` 调 AI 接口。

---

## 6. 文章规范

### 6.1 Frontmatter 结构

```md
---
title: "北京翻译公司报价一般多少钱？"
slug: "beijing-translation-price"
description: "介绍北京翻译公司报价方式、影响价格的因素和常见翻译服务价格区间。"
category: "翻译价格"
date: "2026-04-24"
locale: "zh"
keywords:
  - 北京翻译公司
  - 翻译报价
  - 专业翻译价格
faq:
  - q: "翻译报价为什么会差很多？"
    a: "因为语种、行业、交付时间和排版复杂度都会影响价格。"
---
```

说明：

- `slug` 必须来自 `keywords.csv`，不允许脚本自动猜测中文 slug。
- `faq` 建议作为结构化字段进入 frontmatter，方便后续生成 FAQPage Schema。

### 6.2 正文最低要求

每篇文章必须包含：

- 1 个 H1。
- 至少 3 个 H2。
- 至少 1 个 Markdown 表格。
- 至少 4 个 FAQ。
- 至少 1 个内部链接。
- 至少 1 个 CTA。

建议正文结构：

```text
H1 标题
导语
核心结论
适用场景
价格/流程/风险表格
正文 3-5 节
FAQ
相关服务
CTA
```

---

## 7. 第一阶段：Markdown 文章系统改造

> 这一阶段先不动 Local Brain，先把网站文章读取系统改好。

### 7.1 新增 `lib/articles.ts`

职责：

- 读取 `content/articles/{locale}/`。
- 解析 frontmatter。
- 计算 `readTime`。
- 将 Markdown 渲染为安全 HTML。
- 提供文章列表、文章详情、全部 slug 查询能力。

接口建议：

```ts
export type ArticleMeta = {
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  locale: string;
  keywords: string[];
  readTime: string;
  faq?: Array<{ q: string; a: string }>;
};

export type Article = ArticleMeta & {
  contentHtml: string;
};

export function getAllArticles(locale: string): ArticleMeta[];
export async function getArticle(locale: string, slug: string): Promise<Article | null>;
export function getAllArticleSlugs(): Array<{ locale: string; slug: string }>;
```

实现要求：

- 使用 `fs` 在构建时读取内容。
- 使用 `rehype-sanitize` 处理输出 HTML。
- 不允许 `sanitize: false`。
- `getAllArticleSlugs()` 必须遍历所有语言目录。

### 7.2 新增 `components/shared/JsonLd.tsx`

职责：

- 注入 JSON-LD。
- 用于文章页输出 Article Schema。
- 当文章具备结构化 FAQ 数据时输出 FAQPage Schema。

### 7.3 扩充 `.prose-content`

需要在 `app/globals.css` 中补充：

- `table`
- `thead`
- `tbody`
- `th`
- `td`
- `blockquote`
- `a`
- `ol`
- `code`
- `pre`
- `strong`
- `img`
- `hr`
- `details`
- `summary`

目标是让 Markdown 文章可读，而不是“能显示但很粗糙”。

---

## 8. 第二阶段：博客页、详情页、Sitemap 改造

### 8.1 改造博客列表页

文件：

```text
app/[locale]/blog/page.tsx
```

目标：

- 数据源改为 `getAllArticles(locale)`。
- 标题和描述支持多语言。
- 空语言目录时显示空状态。

### 8.2 改造博客详情页

文件：

```text
app/[locale]/blog/[slug]/page.tsx
```

目标：

- 使用 `getArticle(locale, slug)` 读取文章。
- 安全渲染 HTML。
- 输出 Article Schema。
- 如果 frontmatter 中含 `faq`，则额外输出 FAQPage Schema。
- `generateStaticParams()` 使用 `getAllArticleSlugs()`。

### 8.3 改造 Sitemap

文件：

```text
app/sitemap.ts
```

目标：

- 所有文章自动进入 Sitemap。
- 多语言文章分别生成 URL。
- `lastModified` 使用文章 `date` 或文件时间，不使用构建时的当前时间。

---

## 9. 第三阶段：迁移现有 7 篇旧文章

### 9.1 迁移顺序

必须先完成：

- `lib/articles.ts`
- 博客列表页
- 博客详情页
- Sitemap

然后再迁移旧文章，避免删除 `site-data.ts` 后页面立刻失效。

### 9.2 迁移内容

把 `lib/site-data.ts` 中当前 7 篇博客文章迁移到：

```text
content/articles/zh/{slug}/index.md
```

### 9.3 最后清理

确认 7 篇 Markdown 文章都能访问后，再删除：

- `BlogPost` 类型
- `posts`
- `getPost()`

---

## 10. 第四阶段：Local Brain 基础脚本

### 10.1 `keywords.csv` 结构

```csv
keyword,slug,locale,category,intent,priority
北京翻译公司报价一般多少钱,beijing-translation-price,zh,翻译价格,询价,P0
合同翻译需要注意什么,contract-translation-tips,zh,法律翻译,信息,P0
专利翻译为什么不能直接机翻,patent-translation-no-mt,zh,专业翻译,信息,P0
```

说明：

- `slug` 手工维护。
- `locale` 决定发布目录。
- `priority` 决定批量执行顺序。

### 10.2 `red-lines.csv`

用于限制红线词、夸大承诺、AI 营销腔。

示例：

```csv
word,reason
最好的翻译公司,虚假宣传
100%准确,过度承诺
保证通过,不可控结果
一站式解决方案,营销腔
赋能,营销腔
全方位,营销腔
```

### 10.3 `ai-provider.mjs`

职责：

- 屏蔽不同 AI 提供商的接口差异。
- 对外统一暴露 `callLLM()`。

支持提供商：

- OpenAI
- Gemini
- Claude
- DeepSeek

模型名不写死在代码里，统一来自环境变量：

```text
AI_PROVIDER=openai
OPENAI_MODEL=
GEMINI_MODEL=
CLAUDE_MODEL=
DEEPSEEK_MODEL=
```

### 10.4 `generate-article.mjs`

职责：

- 读取 `keywords.csv`。
- 支持批量生成或单篇生成。
- 调用 AI 写入 Markdown 草稿。
- 输出到 `drafts/`。
- 写入生成报告。

必须支持：

```bash
npm run brain:generate
npm run brain:generate -- --slug beijing-translation-price
```

### 10.5 `validate-article.mjs`

职责：

- 校验 `drafts/` 中的文章。
- 通过的移动到 `validated/`。
- 失败的保留在 `drafts/` 或移入 `rejected/`。
- 输出校验报告。

校验项至少包括：

- frontmatter 完整性。
- slug 合法性。
- description 长度。
- 正文字数。
- H1 / H2 / 表格 / FAQ / CTA 完整性。
- 关键词覆盖。
- 红线词。
- 内链存在性。

### 10.6 `approve-article.mjs`

职责：

- 将 `validated/` 中人工确认通过的文章移入 `approved/`。
- 必须支持单篇审核通过。

命令：

```bash
npm run brain:approve -- --slug beijing-translation-price
```

### 10.7 `publish-article.mjs`

职责：

- 将 `approved/` 中的文章复制到：

```text
content/articles/{locale}/{slug}/index.md
```

- 发布后可删除或归档 `approved/` 中的源文件。
- 必须支持单篇发布和批量发布。

---

## 11. 第五阶段：状态文件与运行锁

### 11.1 状态文件

版本控制策略：

```text
local-brain/status/pipeline.example.json   进 Git
local-brain/status/pipeline.runtime.json   不进 Git
```

运行文件结构建议：

```json
{
  "updatedAt": "2026-04-24T01:00:00Z",
  "isRunning": false,
  "currentStep": null,
  "lock": null,
  "articles": {},
  "log": []
}
```

### 11.2 运行锁

必须加入锁机制，防止用户连点两次导致并发运行：

- `isRunning: true`
- `currentStep`
- `lock` 中记录 pid、step、startedAt

脚本启动前先检查锁。
脚本结束后再释放锁。

---

## 12. 第六阶段：V1 轻量状态页

> V1 不上 SSE，不做完整仪表盘，只做一个本地可用的轻量状态页。

### 12.1 目标

在本地浏览器里看见：

- 当前有哪些文章处于 `drafts / validated / approved / published`。
- 当前是否正在运行。
- 最近日志。
- 四个按钮：生成、校验、审核通过、发布。

### 12.2 技术方案

- 页面路径：

```text
/zh/admin/pipeline
```

- 仅在开发环境启用。
- 前端每 1-2 秒轮询：

```text
GET /api/pipeline/status
```

- 不做 SSE。
- 不做一键全流程。

### 12.3 API

新增：

```text
GET  /api/pipeline/status
POST /api/pipeline/run
```

要求：

- `NODE_ENV === "production"` 时返回 403。
- 执行脚本使用 `child_process.spawn()`。
- 运行中禁用其他按钮。

---

## 13. 第七阶段：V2 完整仪表盘增强

> 这一阶段不进入 V1 验收范围。

V2 再做：

- SSE 实时推送。
- 实时日志流。
- 文章卡片分组。
- 单篇重生成。
- 单篇审核。
- 单篇发布。
- 提供商切换 UI。
- 一键全流程执行。

一键全流程必须遵守：

```text
generate
→ validate
→ 暂停等待人工审核
→ publish
```

不允许跳过人工审核。

---

## 14. package.json 脚本建议

```json
{
  "scripts": {
    "brain:generate": "node local-brain/scripts/generate-article.mjs",
    "brain:validate": "node local-brain/scripts/validate-article.mjs",
    "brain:approve": "node local-brain/scripts/approve-article.mjs",
    "brain:publish": "node local-brain/scripts/publish-article.mjs",
    "brain:check-content": "node local-brain/scripts/check-content.mjs",
    "brain:deploy": "npm run brain:publish && npm run brain:check-content && npm run typecheck && npm run build"
  }
}
```

说明：

- `brain:validate` 只校验 `drafts/`。
- `brain:check-content` 校验 `content/articles/` 中即将上线的真实文章库。
- `brain:deploy` 不自动 `git push`。
- Git 提交和推送仍建议人工确认执行。

---

## 15. .gitignore 规划

必须追加：

```gitignore
local-brain/.env
local-brain/drafts/
local-brain/validated/
local-brain/approved/
local-brain/rejected/
local-brain/reports/
local-brain/status/pipeline.runtime.json
```

并且这一项必须放在施工顺序的最前面，优先于 Local Brain 目录创建和脚本试跑。

---

## 16. 测试文章

V1 首批测试文章建议：

| 关键词 | slug | 类型 |
|--------|------|------|
| 北京翻译公司报价一般多少钱 | `beijing-translation-price` | 价格词 |
| 合同翻译需要注意什么 | `contract-translation-tips` | 服务词 |
| 专利翻译为什么不能直接机翻 | `patent-translation-no-mt` | 风险词 |

---

## 17. 实施顺序

严格按以下顺序施工：

1. 先补 `.gitignore`。
2. 安装 Markdown 和 CSV 依赖。
3. 新增 `content/articles/{locale}` 目录。
4. 新增 `lib/articles.ts`。
5. 新增 `JsonLd.tsx`。
6. 扩充 `.prose-content`。
7. 改造 `blog/page.tsx`。
8. 改造 `blog/[slug]/page.tsx`。
9. 改造 `sitemap.ts`。
10. 迁移现有 7 篇旧文章的结构到 Markdown。
11. 对 7 篇旧文章做 SEO 扩写和发布结构补齐。
12. 清理 `site-data.ts` 中的 `posts`。
13. 新增 `local-brain/` 目录。
14. 新增 `ai-provider.mjs`。
15. 新增 `generate-article.mjs`。
16. 新增 `validate-article.mjs`。
17. 新增 `approve-article.mjs`。
18. 新增 `publish-article.mjs`。
19. 新增 `check-content.mjs`。
20. 新增状态文件和运行锁。
21. 做 V1 轻量状态页。
22. 生成 3 篇测试文章。
23. 执行 `brain:check-content`。
24. 执行本地构建验收。
25. 提交 GitHub。
26. 等待 Vercel 自动部署。

---

## 18. 验收标准

### 18.1 V1 必须通过

| 验收项 | 检查方式 |
|--------|----------|
| `content/articles/zh/` 至少有 10 篇文章 | 文件检查 |
| `/zh/blog` 显示 10 篇文章 | 浏览器访问 |
| 任一文章详情页正确渲染 Markdown | 浏览器访问 |
| 文章页注入 Article Schema | 页面源码检查 |
| 具备 FAQ frontmatter 的文章注入 FAQPage Schema | 页面源码检查 |
| `/sitemap.xml` 包含全部文章 URL | 浏览器访问 |
| `npm run brain:generate` 可批量生成 | 命令执行 |
| `npm run brain:generate -- --slug xxx` 可单篇生成 | 命令执行 |
| `npm run brain:validate` 可校验草稿 | 命令执行 |
| `npm run brain:approve -- --slug xxx` 可单篇审核通过 | 命令执行 |
| `npm run brain:publish` 可发布文章 | 命令执行 |
| `npm run brain:check-content` 可校验真实内容库 | 命令执行 |
| `/zh/admin/pipeline` 可显示当前状态 | 浏览器访问 |
| `npm run typecheck` 通过 | 命令执行 |
| `npm run build` 通过 | 命令执行 |

### 18.2 V2 增强项

以下不属于 V1 阻塞项：

- SSE 实时日志。
- 提供商切换前端界面。
- 一键全流程。
- 单篇重生成。
- 完整可视化流程图。

---

## 19. 工时估算

| 阶段 | 内容 | 估时 |
|------|------|------|
| 1 | Markdown 文章系统 | 1.5 小时 |
| 2 | Blog 页面 + Sitemap 改造 | 1.5 小时 |
| 3 | 迁移 7 篇旧文章结构 | 0.5 小时 |
| 4 | 7 篇旧文章 SEO 扩写与补齐 | 1-1.5 小时 |
| 5 | Local Brain 五个脚本 | 3.5 小时 |
| 6 | 状态文件 + 运行锁 | 1 小时 |
| 7 | V1 轻量状态页 | 2 小时 |
| 8 | 测试、构建、修正 | 1.5 小时 |
| 合计 | V1 | 12-13 小时左右 |

V2 仪表盘增强另计约 4-6 小时。

---

## 20. 最终实施决策

本项目采用以下交付策略：

### V1 交付范围

- Markdown 文章库。
- Blog 列表页与详情页改造。
- Sitemap 自动收录。
- Local Brain 生成、校验、审核、发布四步脚本。
- 单篇与批量命令支持。
- 本地轻量状态页。

### V2 交付范围

- 完整仪表盘。
- SSE 实时日志。
- 一键全流程。
- 提供商切换 UI。
- 文章卡片化管理。

### 核心原则

先把：

```text
能写
能审
能发
能上线
```

做出来。

再去做：

```text
更好看
更实时
更像控制台
```

这就是本方案的主路径。
