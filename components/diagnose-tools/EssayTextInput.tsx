"use client";

import { getInputStats } from "@/lib/diagnose-tools/validate-input";

export function getEssayLengthStatus(text: string) {
  const stats = getInputStats(text);
  if (stats.charCount > 15000 || stats.englishWordCount > 2500) {
    return { tone: "danger", message: "这篇内容过长，请拆分后再诊断。", stats };
  }
  if (stats.englishWordCount < 150) return { tone: "danger", message: "内容过短，只能做初步判断。", stats };
  if (stats.englishWordCount < 300) return { tone: "warning", message: "可诊断，但置信度较低。", stats };
  if (stats.englishWordCount <= 1500) return { tone: "success", message: "适合诊断。", stats };
  return { tone: "warning", message: "内容较长，建议确认是否只粘贴了一篇文书。", stats };
}

export function EssayTextInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const status = getEssayLengthStatus(value);
  return (
    <div className="essay-field">
      <label htmlFor="essayText">文书正文</label>
      <textarea
        id="essayText"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`essay-textarea ${value ? "has-content" : ""}`}
        placeholder="建议粘贴一篇完整 PS / SOP 初稿。300-1500 英文词最适合诊断。"
      />
      <div className={`essay-count is-${status.tone}`}>
        <span>{status.message}</span>
        <span>
          {status.stats.charCount} 字符 / 约 {status.stats.englishWordCount} 英文词
        </span>
      </div>
    </div>
  );
}
