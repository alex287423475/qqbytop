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
- `/[locale]/search` 全站搜索
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

## 多语言收录策略

当前 `/en` 和 `/ja` 路由用于保留未来本地化入口，但内容仍以中文为主。为避免搜索引擎收录重复中文内容：

- `sitemap.xml` 只输出 `/zh` 页面。
- `/en` 和 `/ja` 页面通过 metadata 设置为 `noindex, follow`。
- 等英文、日文文案人工本地化完成后，再开放收录并恢复到 sitemap。

## 询价表单

`/[locale]/quote` 使用站内 API 提交，不依赖访客本机邮件客户端：

```text
POST /api/quote
```

生产环境可配置以下变量，把询价同步到飞书群机器人：

```text
QUOTE_FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
QUOTE_FEISHU_SECRET=飞书机器人签名密钥
```

`QUOTE_FEISHU_SECRET` 只有在飞书机器人开启“签名校验”时才需要填写。

也可以配置通用 webhook，把原始 JSON 同步到 n8n、CRM 或自建接口：

```text
QUOTE_WEBHOOK_URL=https://example.com/webhook/quote
```

未配置飞书或通用 webhook 时，提交内容会进入 Vercel Function 日志，适合临时验收，不适合作为长期线索存储方案。

## 即时咨询入口

微信二维码已内置在浮动联系按钮、页脚和关于页，图片路径：

```text
public/skin/picture/wx.jpg
```

可选即时通讯和在线客服通过环境变量开启：

```text
NEXT_PUBLIC_WHATSAPP_NUMBER=8613800000000
NEXT_PUBLIC_QQ_NUMBER=123456789
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

`NEXT_PUBLIC_WHATSAPP_NUMBER` 需要使用可接收 WhatsApp 的真实号码，包含国家区号，不要带 `+`、空格或横线。

## 诊断工具矩阵

`/[locale]/tools` 会展示主站诊断工具入口。跨境产品文案合规翻译诊断工具以同域目录方式挂载在：

```text
https://qqbytop.com/tools/product-copy-compliance-checker
```

主站通过 `next.config.ts` 将该目录代理到诊断工具的独立 Vercel 项目，用户侧不会看到独立项目域名。线上环境建议配置：

```text
NEXT_PUBLIC_PRODUCT_COPY_DIAGNOSTIC_URL=/tools/product-copy-compliance-checker
```

诊断工具项目需要配置：

```text
NEXT_PUBLIC_BASE_PATH=/tools/product-copy-compliance-checker
NEXT_PUBLIC_ASSET_PREFIX=/tools/product-copy-compliance-checker
NEXT_PUBLIC_APP_URL=https://qqbytop.com/tools/product-copy-compliance-checker
```

当前官网会把以下入口导向同一套诊断引擎：

- `/[locale]/tools/product-copy-compliance-checker`
- `/[locale]/tools/amazon-listing-translation-checker`
- `/[locale]/tools/shopify-product-page-english-checker`
- `/[locale]/tools/packaging-copy-risk-checker`
- `/[locale]/tools/manual-translation-risk-checker`

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

- 接入邮件或 CRM 通知。
- 配置真实 WhatsApp、QQ 和 Crisp ID 后开启更多即时咨询入口。
- 为每个语言版本补充更完整的人工本地化文案。
- 按真实业务案例补充更多文章和行业方案。
