# Local Brain SEO 文章自动生产线施工计划

## 1. 目标

为 `qqbytop.com` 建立一套本地 SEO 文章生产线，实现：

- 本地维护关键词和选题。
- 自动生成 SEO 文章草稿。
- 自动校验文章结构和基础质量。
- 人工审核后发布到 Next.js 前端。
- 通过 GitHub 和 Vercel 自动上线。

第一版采用“半自动发布”策略：AI 负责生成草稿，人工负责审核放行，避免低质量内容直接上线。

## 2. 总体流程

```text
关键词库
  ↓
Local Brain 生成草稿
  ↓
质量校验
  ↓
人工审核
  ↓
发布到 content/articles
  ↓
Next.js 前端读取
  ↓
GitHub push
  ↓
Vercel 自动部署
```

## 3. 目录规划

在 `next-vercel` 项目内新增或改造以下目录：

```text
local-brain/
  inputs/
    keywords.csv
    topics.csv
  prompts/
    article-outline.md
    article-draft.md
    article-polish.md
  drafts/
  approved/
  reports/
  scripts/
    generate-article.mjs
    validate-article.mjs
    approve-article.mjs
    publish-article.mjs

content/
  articles/
    zh/
    en/
    ja/

lib/
  articles.ts
```

文章发布后的最终位置：

```text
content/articles/zh/beijing-translation-price/index.md
content/articles/en/contract-translation-cost/index.md
content/articles/ja/patent-translation-checklist/index.md
```

文章图片建议放在：

```text
public/articles/{slug}/cover.jpg
public/articles/{slug}/chart.png
```

## 4. 文章标准格式

每篇文章使用 Markdown，并带 frontmatter。

```md
---
title: "北京翻译公司报价一般多少钱？"
slug: "beijing-translation-price"
description: "介绍北京翻译公司报价方式、影响价格的因素和常见翻译服务价格区间。"
category: "翻译价格"
date: "2026-04-23"
locale: "zh"
keywords:
  - 北京翻译公司
  - 翻译报价
  - 专业翻译价格
---

# 北京翻译公司报价一般多少钱？

正文内容……
```

正文必须包含：

- H1 标题。
- 导语。
- 核心结论。
- 至少 1 个表格。
- 至少 4 个 FAQ。
- 相关服务推荐。
- 询价 CTA。

建议文章结构：

```text
H1 标题
导语
核心结论
适用人群
价格/流程/风险表格
正文分节
常见问题 FAQ
相关服务
询价 CTA
```

## 5. 第一阶段：文章文件库

目标：让网站从 `content/articles` 读取 Markdown 文章，而不是继续把大量文章写在 `lib/site-data.ts` 中。

开发任务：

1. 新增 `content/articles` 目录。
2. 新增 `lib/articles.ts`。
3. 实现 Markdown frontmatter 解析。
4. 实现 `getAllArticles(locale)`。
5. 实现 `getArticle(locale, slug)`。
6. 改造 `/[locale]/blog` 列表页。
7. 改造 `/[locale]/blog/[slug]` 详情页。
8. 改造 `app/sitemap.ts`，自动包含文章 URL。

验收命令：

```powershell
npm run typecheck
npm run build
```

验收页面：

```text
/zh/blog
/zh/blog/beijing-translation-price
/en/blog
/ja/blog
```

## 6. 第二阶段：Local Brain 生成器

目标：输入关键词，自动生成 SEO 文章草稿。

关键词输入文件：

```text
local-brain/inputs/keywords.csv
```

CSV 格式：

```csv
keyword,locale,category,intent,priority
北京翻译公司报价,zh,翻译价格,询价,P0
合同翻译多少钱,zh,翻译价格,询价,P0
patent translation cost,en,Patent Translation,commercial,P1
```

生成命令：

```powershell
npm run brain:generate
```

输出文件：

```text
local-brain/drafts/beijing-translation-price.md
local-brain/reports/beijing-translation-price.json
```

生成内容包括：

- SEO title。
- slug。
- description。
- category。
- keywords。
- 正文。
- FAQ。
- 表格。
- 推荐内链。
- 询价 CTA。

## 7. 第三阶段：质量校验

目标：避免低质量、重复、结构不完整的文章进入网站。

校验命令：

```powershell
npm run brain:validate
```

基础校验规则：

- 标题不能为空。
- slug 不能为空且不能重复。
- description 建议 80-160 个字符。
- 中文正文不少于 1200 个汉字。
- 英文正文不少于 1000 words。
- 必须包含 H2。
- 必须包含 FAQ。
- 必须包含至少一个 Markdown 表格。
- 主关键词至少出现 2 次，但不能明显堆砌。
- 不能和已有文章标题重复。
- frontmatter 必须包含 `title`、`slug`、`description`、`category`、`date`、`locale`、`keywords`。

校验通过后进入：

```text
local-brain/approved/
```

校验失败则留在：

```text
local-brain/drafts/
```

并在 `local-brain/reports/` 生成问题报告。

## 8. 第四阶段：人工审核

人工审核重点：

- 事实是否靠谱。
- 是否像真实企业文章，而不是空泛 AI 文。
- 是否有清晰业务转化入口。
- 是否包含价格、流程、风险、FAQ 等可搜索信息。
- 是否和公司服务能力一致。
- 是否避免夸大承诺。
- 是否有合适内链指向服务页、行业页、询价页。

审核通过后执行：

```powershell
npm run brain:publish
```

发布脚本负责将文章复制到：

```text
content/articles/{locale}/{slug}/index.md
```

## 9. 第五阶段：一键上线

基础上线流程：

```powershell
npm run typecheck
npm run build
git add content lib app local-brain package.json package-lock.json
git commit -m "Add SEO article batch"
git push origin main
```

Vercel 接收到 GitHub push 后自动部署。

后续可封装为：

```powershell
npm run brain:deploy
```

自动完成：

```text
校验
发布
类型检查
构建
```

是否自动 `git commit` 和 `git push` 建议第二版再加入，第一版先保留人工确认。

## 10. 推荐 package.json 脚本

```json
{
  "scripts": {
    "brain:generate": "node local-brain/scripts/generate-article.mjs",
    "brain:validate": "node local-brain/scripts/validate-article.mjs",
    "brain:publish": "node local-brain/scripts/publish-article.mjs",
    "brain:deploy": "npm run brain:validate && npm run brain:publish && npm run typecheck && npm run build"
  }
}
```

## 11. 施工顺序

建议按以下顺序实施：

1. 新增 `content/articles` 目录。
2. 新增 `lib/articles.ts`。
3. 迁移现有 `posts` 到 Markdown。
4. 改造 `/blog` 列表页。
5. 改造 `/blog/[slug]` 详情页。
6. 改造 `sitemap.ts`。
7. 新增 `local-brain/inputs/keywords.csv`。
8. 新增生成脚本。
9. 新增校验脚本。
10. 新增发布脚本。
11. 生成 3 篇测试文章。
12. 执行 `npm run typecheck`。
13. 执行 `npm run build`。
14. 提交 GitHub。
15. 等待 Vercel 自动部署并线上验收。

## 12. 第一版测试文章

建议第一版先生成并上线 3 篇：

```text
北京翻译公司报价一般多少钱
合同翻译需要注意什么
专利翻译为什么不能直接机翻
```

这三篇分别覆盖：

- 价格词。
- 服务词。
- 专业风险词。

## 13. 第一版验收标准

第一版完成后，应满足：

- 可以新增 Markdown 文章。
- 文章能自动出现在博客列表。
- 文章详情页能正常渲染。
- sitemap 自动包含文章 URL。
- 可以从 `keywords.csv` 生成草稿。
- 草稿需要人工审核后才能发布。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- GitHub push 后 Vercel 能自动上线。

## 14. 后续增强

第二版可增加：

- 关键词聚类。
- 竞争对手标题分析。
- 百度/Google 搜索意图分类。
- 自动内链推荐。
- 重复内容检测。
- 文章质量评分。
- 批量生成但人工逐篇审核。
- 自动生成封面图。
- 自动生成城市词、语种词、行业词专题页。

第三版可增加：

- 每周自动生成选题池。
- 自动生成内容日历。
- 人工审批后自动 commit。
- Vercel 部署后自动写入发布报告。
- 收录和排名追踪。
