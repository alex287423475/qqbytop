import { NextResponse } from "next/server";
import { getAdminSessionError } from "./admin-auth";
import { getGaokaoBackendApiBase } from "./server-proxy";

export async function proxyGaokaoAdminGet(path: string) {
  const adminApiToken = process.env.ADMIN_API_TOKEN;
  const authError = await getAdminSessionError();

  if (authError) return authError;

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

export async function proxyGaokaoAdminPost(path: string, body?: unknown) {
  const adminApiToken = process.env.ADMIN_API_TOKEN;
  const authError = await getAdminSessionError();

  if (authError) return authError;

  if (!adminApiToken) {
    return NextResponse.json({ message: "Admin API token is not configured." }, { status: 500 });
  }

  const base = getGaokaoBackendApiBase();
  const url = `${base}/admin/${path.replace(/^\/+/, "")}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-token": adminApiToken,
      },
      body: body === undefined ? "{}" : JSON.stringify(body),
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
        message: "Gaokao essay admin backend is temporarily unavailable.",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
