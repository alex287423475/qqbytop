import { studyAbroadEssayTool } from "@/lib/diagnose-tools/definitions/study-abroad-essay";

export function PrivacyNotice() {
  return (
    <div className="essay-privacy" role="note">
      <span aria-hidden="true">私密</span>
      <p>{studyAbroadEssayTool.privacyNote}</p>
    </div>
  );
}
