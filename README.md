# 北京全球博译官网 Next.js 重构版

这是北京全球博译官网的 Next.js + Tailwind CSS 重构项目，面向 Vercel 部署。当前版本已经从旧 PHP/PbootCMS 的渲染 HTML 兼容层，重构为可维护的多语言静态页面体系。

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- TypeScript
- Vercel 静态/SSG 部署

## 路由结构

- `/zh`、`/en`、`/ja` 多语言首页
- `/[locale]/services` 服务总览
- `/[locale]/services/[slug]` 服务详情页
- `/[locale]/industries` 行业方案总览
- `/[locale]/industries/[slug]` 行业方案详情页
- `/[locale]/about` 关于我们
- `/[locale]/pricing` 价格与套餐
- `/[locale]/quote` 智能询价
- `/[locale]/blog` 文章列表
- `/[locale]/blog/[slug]` 文章详情页
- `/sitemap.xml` 自动站点地图

## 内容维护

核心文案、导航、服务、行业、价格和文章数据集中维护在：

```text
lib/site-data.ts
```

主要页面组件位于：

```text
app/[locale]/
components/
```

旧站 URL 兼容跳转逻辑位于：

```text
proxy.ts
```

## 本地运行

```powershell
npm install
npm run dev
```

## 构建验证

```powershell
npm run typecheck
npm run build
```

## Vercel 部署

项目根目录选择 `next-vercel`，构建命令使用：

```powershell
npm run build
```

如果本机已经登录 Vercel CLI，也可以直接部署：

```powershell
npx vercel deploy --prod
```

## 后续可增强项

- 将 `/quote` 的 `mailto:` 询价表单升级为 Vercel Serverless API。
- 接入邮件、飞书或 CRM 通知。
- 为每个语言版本补充更完整的人工本地化文案。
- 按真实业务案例补充更多文章和行业方案。
