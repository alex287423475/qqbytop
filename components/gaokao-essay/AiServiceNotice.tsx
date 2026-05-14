import { AI_SERVICE_NOTICE } from "@/lib/gaokao-essay/constants";

export function AiServiceNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`border border-emerald-200 bg-emerald-50 text-emerald-950 ${compact ? "px-4 py-3 text-sm" : "px-5 py-4"}`}
      role="note"
    >
      <strong className="font-semibold">服务说明：</strong>
      {AI_SERVICE_NOTICE}
    </div>
  );
}
