"use client";

import { useState } from "react";
import { contact } from "@/lib/contact";
import type { EssayDiagnosisRequest, EssayDiagnosisResult, ServiceName } from "@/lib/diagnose-tools/types";

export function LeadCapture({
  result,
  selectedService,
  request,
}: {
  result: EssayDiagnosisResult;
  selectedService: ServiceName;
  request: EssayDiagnosisRequest;
}) {
  const [name, setName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [note, setNote] = useState("");
  const [authorizeEssayReview, setAuthorizeEssayReview] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/tools/study-abroad-essay-check/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticId: result.diagnosticId,
          selectedService,
          name,
          contact: contactValue,
          note,
          authorizeEssayReview,
          applicationStage: request.applicationStage,
          targetMajor: request.targetMajor,
          documentType: request.documentType,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "提交失败");
      setStatus("submitted");
      setMessage(data.message || "需求已提交，我们会尽快联系你。");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "留资提交失败，请直接电话联系我们。");
    }
  }

  return (
    <form className="essay-lead-form" onSubmit={submitLead}>
      <div className="essay-section-heading">
        <p>已选择：{selectedService}</p>
        <h2>提交材料复核需求</h2>
      </div>
      <div className="essay-lead-grid">
        <label>
          姓名
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
        </label>
        <label>
          联系方式
          <input value={contactValue} onChange={(event) => setContactValue(event.target.value)} required maxLength={140} placeholder="手机 / 微信 / 邮箱" />
        </label>
      </div>
      <label>
        补充说明
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="例如目标学校、截止时间、是否需要加急。" />
      </label>
      <label className="essay-checkbox">
        <input
          type="checkbox"
          checked={authorizeEssayReview}
          onChange={(event) => setAuthorizeEssayReview(event.target.checked)}
        />
        我授权顾问在后续沟通中查看完整文书正文。
      </label>
      <button type="submit" className="essay-primary-button" disabled={status === "submitting"}>
        {status === "submitting" ? "正在提交..." : "提交咨询需求"}
      </button>
      {message && (
        <p className={`essay-form-message is-${status}`}>
          {message} 也可以直接拨打 <a href={contact.phoneHref}>{contact.phone}</a>。
        </p>
      )}
    </form>
  );
}
