import { NextRequest, NextResponse } from "next/server";
import {
  buildLeadSubmission,
  LeadStoreError,
  saveStudyAbroadEssayLead,
} from "@/lib/diagnose-tools/lead-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const lead = buildLeadSubmission(body);
    await saveStudyAbroadEssayLead(lead);
    return json({ ok: true, message: "需求已提交，我们会尽快联系你。" });
  } catch (error) {
    if (error instanceof LeadStoreError) return json({ ok: false, message: error.message }, error.status);
    console.error("study_abroad_essay_lead_failed", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, message: "留资提交失败，请直接拨打 400-869-9562。" }, 502);
  }
}
