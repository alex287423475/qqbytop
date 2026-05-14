import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getGaokaoBackendApiBase } from "./server-proxy";

export async function proxyGaokaoAdminGet(path: string) {
  const expectedSession = process.env.ADMIN_SESSION_TOKEN;
  const adminApiToken = process.env.ADMIN_API_TOKEN;
  const cookieStore = await cookies();
  const currentSession = cookieStore.get("admin_session_token")?.value;

  if (!expectedSession || currentSession !== expectedSession) {
    return NextResponse.json({ message: "未登录后台或会话已过期。" }, { status: 401 });
  }

  if (!adminApiToken) {
    return NextResponse.json({ message: "后台 API Token 未配置。" }, { status: 500 });
  }

  const base = getGaokaoBackendApiBase();
  const url = `${base}/admin/${path.replace(/^\/+/, "")}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "x-admin-token": adminApiToken },
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "高考作文诊断后台数据暂不可用。",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
