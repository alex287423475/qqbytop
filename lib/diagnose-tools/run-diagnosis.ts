import { createDemoEssayDiagnosis } from "@/lib/diagnose-tools/demo-fallback";
import { callOpenAiJson } from "@/lib/diagnose-tools/openai-json";
import {
  buildStudyAbroadEssayUserPrompt,
  studyAbroadEssaySystemPrompt,
} from "@/lib/diagnose-tools/prompts/study-abroad-essay";
import { normalizeEssayDiagnosisResult } from "@/lib/diagnose-tools/schemas/study-abroad-essay";
import type { EssayDiagnosisResult, ValidatedEssayDiagnosisRequest } from "@/lib/diagnose-tools/types";

export async function runStudyAbroadEssayDiagnosis(
  request: ValidatedEssayDiagnosisRequest,
): Promise<EssayDiagnosisResult> {
  const userPrompt = buildStudyAbroadEssayUserPrompt(request);

  try {
    const { data, source } = await callOpenAiJson({
      systemPrompt: studyAbroadEssaySystemPrompt,
      userPrompt,
    });
    return normalizeEssayDiagnosisResult(data, request, source);
  } catch (error) {
    console.info(
      "study_abroad_essay_demo_fallback",
      error instanceof Error ? error.message.slice(0, 180) : "unknown",
    );
    return createDemoEssayDiagnosis(request);
  }
}
