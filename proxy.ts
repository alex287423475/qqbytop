import { NextRequest, NextResponse } from "next/server";

const locales = ["zh", "en", "ja"];
const publicRootPaths = new Set(["/privacy-policy", "/advertising-cookie-policy", "/terms", "/contact"]);

const legacyRedirects: Record<string, string> = {
  "biyi/": "/zh/services/document-translation",
  "contract/": "/zh/services/legal-compliance",
  "biaoshu/": "/zh/services/document-translation",
  "zhuanli/": "/zh/services/legal-compliance",
  "kouyi/": "/zh/services",
  "zhengjian/": "/zh/services/document-translation",
  "company/": "/zh/about",
  "aboutus/": "/zh/about",
  "contractus/": "/zh/about",
  "news/": "/zh/blog",
  "resources/": "/zh/blog",
  "learning/": "/zh/blog",
};

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const expectedToken = process.env.ADMIN_SESSION_TOKEN;
    if (!expectedToken) return NextResponse.next();
    const currentToken = request.cookies.get("admin_session_token")?.value;
    if (currentToken === expectedToken) return NextResponse.next();
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl, 302);
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/tools") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (publicRootPaths.has(pathname)) {
    return NextResponse.next();
  }

  const firstQueryKey = Array.from(searchParams.keys())[0];
  if (pathname === "/" && firstQueryKey) {
    if (legacyRedirects[firstQueryKey]) {
      return NextResponse.redirect(new URL(legacyRedirects[firstQueryKey], request.url), 301);
    }

    if (firstQueryKey.startsWith("about_")) {
      return NextResponse.redirect(new URL("/zh/industries", request.url), 301);
    }

    if (firstQueryKey.startsWith("news")) {
      return NextResponse.redirect(new URL("/zh/blog", request.url), 301);
    }
  }

  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();

  return NextResponse.redirect(new URL(`/zh${pathname}`, request.url), 302);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
