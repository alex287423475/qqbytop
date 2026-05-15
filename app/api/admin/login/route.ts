import { NextRequest, NextResponse } from "next/server";

function safeNextPath(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : "/admin/gaokao-essay";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin/gaokao-essay";
  return raw;
}

function isLocalPasswordlessAllowed(request: NextRequest) {
  const host = request.nextUrl.hostname;
  return process.env.ADMIN_PASSWORDLESS_LOCAL === "true" && process.env.NODE_ENV !== "production" && (host === "127.0.0.1" || host === "localhost" || host === "::1");
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;
  const next = safeNextPath(form.get("next"));

  if (!sessionToken || (!expectedPassword && !isLocalPasswordlessAllowed(request))) {
    return NextResponse.json({ message: "后台鉴权环境变量未配置。" }, { status: 500 });
  }

  if (!isLocalPasswordlessAllowed(request) && password !== expectedPassword) {
    return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set("admin_session_token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
