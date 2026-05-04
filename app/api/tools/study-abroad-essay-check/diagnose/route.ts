import { NextRequest, NextResponse } from "next/server";
import { checkDiagnoseRateLimit } from "@/lib/diagnose-tools/rate-limit";
import { runStudyAbroadEssayDiagnosis } from "@/lib/diagnose-tools/run-diagnosis";
import { InputValidationError, validateEssayDiagnosisInput } from "@/lib/diagnose-tools/validate-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ua = request.headers.get("user-agent")?.slice(0, 80) || "unknown";
  return `${forwarded || realIp || "local"}:${ua}`;
}

export async function POST(request: NextRequest) {
  const limit = checkDiagnoseRateLimit(clientKey(request));
  if (!limit.allowed) {
    return json(
      {
        ok: false,
        message: "请求过快，请稍后再试。为了控制成本，每个访客每天可免费诊断有限次数。",
        resetAt: limit.resetAt,
      },
      429,
    );
  }

  try {
    const body = await request.json();
    const input = validateEssayDiagnosisInput(body);
    const result = await runStudyAbroadEssayDiagnosis(input);
    return json({ ok: true, result });
  } catch (error) {
    if (error instanceof InputValidationError) {
      return json({ ok: false, message: error.message }, error.status);
    }
    console.error("study_abroad_essay_diagnose_failed", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, message: "诊断服务暂时不可用，请稍后重试。" }, 500);
  }
}
