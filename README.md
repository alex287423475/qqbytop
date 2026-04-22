# 北京全球博译官网 Next.js 迁移版

这是从原 PHP MVC/PbootCMS 站点迁移出的 Next.js + Tailwind CSS 项目。

当前阶段保留了原站渲染后的前台 HTML、CSS、JS 和图片资源，并由 Next.js route handler 根据原 URL 映射到对应页面，适合先部署到 Vercel 做静态/半静态替换验证。

## 本地运行

```powershell
npm install
npm run dev
```

## 构建

```powershell
npm run typecheck
npm run build
```

## Vercel 部署

项目根目录选择 `next-vercel`，构建命令使用 `npm run build`，输出目录保持 Vercel 默认设置。

如果本机已登录 Vercel CLI，也可以执行：

```powershell
npx vercel --prod
```

## 迁移说明

- `content/pages/` 保存从 PHP 站点真实渲染抓取的页面 HTML。
- `content/manifest.json` 保存原 URL 到 HTML 文件的映射。
- `public/skin` 和 `public/static` 保存原站前台资源。
- 目前后台管理、数据库编辑、留言表单提交等 PHP 动态能力还没有重写为 Next.js API。
