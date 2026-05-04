import { studyAbroadEssayTool } from "@/lib/diagnose-tools/definitions/study-abroad-essay";

export const diagnoseToolDefinitions = {
  [studyAbroadEssayTool.slug]: studyAbroadEssayTool,
};

export function getDiagnoseToolDefinition(slug: keyof typeof diagnoseToolDefinitions) {
  return diagnoseToolDefinitions[slug];
}
