import { NextRequest, NextResponse } from "next/server";

const locales = ["zh", "en", "ja"];

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

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
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
