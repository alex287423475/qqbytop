"use client";

import { useEffect, useState } from "react";

const progressSteps = [
  { after: 0, label: "正在解析文本结构", progress: 24 },
  { after: 10, label: "正在比对申请匹配度", progress: 46 },
  { after: 20, label: "正在提取原文证据", progress: 68 },
  { after: 30, label: "正在生成修改优先级", progress: 88 },
];

export function DiagnosisProgress() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = [...progressSteps].reverse().find((step) => seconds >= step.after) || progressSteps[0];

  return (
    <div className="essay-progress" aria-live="polite">
      <p className="essay-progress-label">{current.label}</p>
      <div className="essay-progress-bar">
        <span style={{ width: `${current.progress}%` }} />
      </div>
      {seconds >= 20 && <p className="essay-progress-hint">文书较长时诊断会多花一点时间，请勿关闭页面。</p>}
      {seconds >= 35 && <p className="essay-progress-hint">如果接口繁忙，我们会展示示例报告，你也可以稍后重试。</p>}
    </div>
  );
}
