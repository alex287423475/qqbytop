import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_API_BASE = "http://127.0.0.1:8000/api/v1";

export function getGaokaoBackendApiBase() {
  return (process.env.GAOKAO_ESSAY_BACKEND_API_BASE || DEFAULT_BACKEND_API_BASE).replace(/\/+$/, "");
}

export async function proxyGaokaoBackend(request: NextRequest | Request, backendPath: string, init?: RequestInit) {
  const base = getGaokaoBackendApiBase();
  const url = `${base}${backendPath.startsWith("/") ? backendPath : `/${backendPath}`}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  const sessionId = request.headers.get("x-session-id");
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);
  if (sessionId) headers.set("x-session-id", sessionId);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    body = text || undefined;
  }

  try {
    const response = await fetch(url, {
      method: init?.method || request.method,
      headers,
      body,
      cache: "no-store",
      ...init,
    });
    const contentType = response.headers.get("content-type") || "application/json";
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "高考作文诊断后端暂不可用。请确认 FastAPI 已启动并设置 GAOKAO_ESSAY_BACKEND_API_BASE。",
        backend: base,
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
