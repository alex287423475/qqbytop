"use client";

import { useMemo, useState } from "react";
import { contact } from "@/lib/contact";
import {
  applicationStages,
  essayDocumentTypes,
  serviceNames,
} from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import type { ApplicationStage, EssayDocumentType, ServiceName } from "@/lib/diagnose-tools/types";

type SubmitState = "idle" | "submitting" | "submitted" | "error";

function isServiceName(value: string): value is ServiceName {
  return serviceNames.includes(value as ServiceName);
}

export function StudyAbroadLeadRequestForm({ initialService }: { initialService?: string }) {
  const [selectedService, setSelectedService] = useState<ServiceName>(
    initialService && isServiceName(initialService) ? initialService : "文书深度优化",
  );
  const [applicationStage, setApplicationStage] = useState<ApplicationStage>("硕士");
  const [documentType, setDocumentType] = useState<EssayDocumentType>("PS");
  const [name, setName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [targetMajor, setTargetMajor] = useState("");
  const [targetSchool, setTargetSchool] = useState("");
  const [deadline, setDeadline] = useState("");
  const [materials, setMaterials] = useState("");
  const [note, setNote] = useState("");
  const [authorizeEssayReview, setAuthorizeEssayReview] = useState(false);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const combinedNote = useMemo(
    () =>
      [
        targetSchool ? `目标学校/项目：${targetSchool}` : "",
        deadline ? `截止时间：${deadline}` : "",
        materials ? `已有材料：${materials}` : "",
        note ? `补充说明：${note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [deadline, materials, note, targetSchool],
  );

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/tools/study-abroad-essay-check/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticId: "standalone-request",
          selectedService,
          name,
          contact: contactValue,
          note: combinedNote,
          authorizeEssayReview,
          applicationStage,
          targetMajor,
          documentType,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.message || "提交失败");
      setStatus("submitted");
      setMessage(data.message || "需求已提交，我们会尽快联系你。");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "提交失败，请直接电话联系我们。");
    }
  }

  const isLocked = status === "submitting" || status === "submitted";

  return (
    <form className="essay-lead-form essay-standalone-lead-form" onSubmit={submitLead}>
      <div className="essay-section-heading">
        <p>留学文书需求表单</p>
        <h2>提交你的文书优化需求</h2>
      </div>

      <label>
        选择服务
        <select value={selectedService} onChange={(event) => setSelectedService(event.target.value as ServiceName)} disabled={isLocked}>
          {serviceNames.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </label>

      <div className="essay-lead-grid">
        <label>
          姓名
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={isLocked} />
        </label>
        <label>
          联系方式
          <input
            value={contactValue}
            onChange={(event) => setContactValue(event.target.value)}
            required
            maxLength={140}
            disabled={isLocked}
            placeholder="手机 / 微信 / 邮箱"
          />
        </label>
      </div>

      <div className="essay-lead-grid">
        <label>
          申请阶段
          <select value={applicationStage} onChange={(event) => setApplicationStage(event.target.value as ApplicationStage)} disabled={isLocked}>
            {applicationStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <label>
          文书类型
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value as EssayDocumentType)} disabled={isLocked}>
            {essayDocumentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="essay-lead-grid">
        <label>
          目标专业
          <input value={targetMajor} onChange={(event) => setTargetMajor(event.target.value)} maxLength={120} disabled={isLocked} placeholder="例如 Business Analytics" />
        </label>
        <label>
          目标学校/项目
          <input value={targetSchool} onChange={(event) => setTargetSchool(event.target.value)} maxLength={140} disabled={isLocked} placeholder="例如 NYU MSBA" />
        </label>
      </div>

      <div className="essay-lead-grid">
        <label>
          截止时间
          <input value={deadline} onChange={(event) => setDeadline(event.target.value)} maxLength={80} disabled={isLocked} placeholder="例如 2026-01-15 / 两周内" />
        </label>
        <label>
          已有材料
          <input value={materials} onChange={(event) => setMaterials(event.target.value)} maxLength={160} disabled={isLocked} placeholder="PS、CV、推荐信、成绩单等" />
        </label>
      </div>

      <label>
        补充说明
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} disabled={isLocked} placeholder="例如目前卡在结构、语言表达、项目匹配或材料一致性。" />
      </label>

      <label className="essay-checkbox">
        <input
          type="checkbox"
          checked={authorizeEssayReview}
          onChange={(event) => setAuthorizeEssayReview(event.target.checked)}
          disabled={isLocked}
        />
        我授权顾问在后续沟通中查看完整文书正文。
      </label>

      <button type="submit" className="essay-primary-button" disabled={isLocked}>
        {status === "submitting" ? "正在提交..." : status === "submitted" ? "已提交" : "提交留学文书需求"}
      </button>

      {message && (
        <p className={`essay-form-message is-${status}`}>
          {message} 也可以直接拨打 <a href={contact.phoneHref}>{contact.phone}</a>。
        </p>
      )}
    </form>
  );
}
