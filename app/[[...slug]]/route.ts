import { NextRequest } from "next/server";
import { getPageHtml } from "@/lib/rendered-pages";

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export const dynamic = "force-dynamic";

function normalizeLegacyHtml(html: string) {
  if (html.includes("/skin/js/jquery.lazyload.min.js")) {
    return html;
  }

  return html.replace(
    /(<script[^>]+src=["']\/skin\/js\/common\.js["'][^>]*><\/script>)/i,
    '<script type="text/javascript" src="/skin/js/jquery.lazyload.min.js"></script>\n    $1',
  );
}

function notFoundHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>页面未找到 - 北京全球博译翻译公司</title>
  <meta name="robots" content="noindex,nofollow">
  <style>
    body{margin:0;font-family:Arial,"Microsoft YaHei",sans-serif;color:#0f172a;background:#f8fafc}
    main{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px}
    section{max-width:640px}
    p{color:#475569;line-height:1.8}
    a{display:inline-block;margin-top:18px;background:#0f172a;color:#fff;text-decoration:none;padding:10px 16px}
  </style>
</head>
<body>
  <main>
    <section>
      <p>404</p>
      <h1>页面未找到</h1>
      <p>当前 URL 没有匹配到已迁移的 PHP 渲染页面。请从首页重新进入。</p>
      <a href="/">返回首页</a>
    </section>
  </main>
</body>
</html>`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const html = getPageHtml(slug, request.nextUrl.searchParams);

  if (!html) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  }

  return new Response(normalizeLegacyHtml(html), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=86400",
    },
  });
}
