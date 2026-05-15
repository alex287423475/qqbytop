import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function getAdminSessionError() {
  const expectedSession = process.env.ADMIN_SESSION_TOKEN;
  const cookieStore = await cookies();
  const currentSession = cookieStore.get("admin_session_token")?.value;

  if (!expectedSession || currentSession !== expectedSession) {
    return NextResponse.json({ message: "未登录后台或会话已过期。" }, { status: 401 });
  }

  return null;
}
