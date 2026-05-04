"use client";

import { useMemo, useRef, useState } from "react";
import { DiagnosisProgress } from "@/components/diagnose-tools/DiagnosisProgress";
import { EssayDiagnosisResult } from "@/components/diagnose-tools/EssayDiagnosisResult";
import { EssayTextInput, getEssayLengthStatus } from "@/components/diagnose-tools/EssayTextInput";
import { LeadCapture } from "@/components/diagnose-tools/LeadCapture";
import { PrivacyNotice } from "@/components/diagnose-tools/PrivacyNotice";
import { ServiceCTA } from "@/components/diagnose-tools/ServiceCTA";
import { ToolPageLayout } from "@/components/diagnose-tools/ToolPageLayout";
import { ToolStepRail } from "@/components/diagnose-tools/ToolStepRail";
import {
  applicationStages,
  concernOptions,
  essayDocumentTypes,
  studyAbroadEssayTool,
} from "@/lib/diagnose-tools/definitions/study-abroad-essay";
import type {
  ApplicationStage,
  DraftStage,
  EssayDiagnosisRequest,
  EssayDiagnosisResult as EssayDiagnosisResultType,
  EssayDocumentType,
  ServiceName,
} from "@/lib/diagnose-tools/types";

type Status = "idle" | "input_ready" | "validating" | "diagnosing" | "result_ready" | "demo_result_ready" | "error";

const draftStages: DraftStage[] = ["初稿", "修改稿", "已定稿", "不确定"];

export function EssayDiagnosisForm() {
  const [applicationStage, setApplicationStage] = useState<ApplicationStage>("硕士");
  const [documentType, setDocumentType] = useState<EssayDocumentType>("PS");
  const [targetMajor, setTargetMajor] = useState("");
  const [essayText, setEssayText] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [targetSchoolOrProgram, setTargetSchoolOrProgram] = useState("");
  const [draftStage, setDraftStage] = useState<DraftStage>("不确定");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [result, setResult] = useState<EssayDiagnosisResultType | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceName | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const leadFormRef = useRef<HTMLDivElement>(null);

  const requestPayload: EssayDiagnosisRequest = useMemo(
    () => ({
      applicationStage,
      targetMajor,
      documentType,
      essayText,
      targetRegion,
      targetSchoolOrProgram,
      draftStage,
      userConcern: concerns.join("、"),
    }),
    [applicationStage, concerns, documentType, draftStage, essayText, targetMajor, targetRegion, targetSchoolOrProgram],
  );

  const lengthStatus = getEssayLengthStatus(essayText);
  const canSubmit =
    Boolean(targetMajor.trim()) &&
    Boolean(essayText.trim()) &&
    lengthStatus.stats.charCount <= 15000 &&
    lengthStatus.stats.englishWordCount <= 2500;

  function toggleConcern(concern: string) {
    setConcerns((current) =>
      current.includes(concern) ? current.filter((item) => item !== concern) : [...current, concern],
    );
  }

  async function diagnose() {
    if (!canSubmit) {
      setStatus("error");
      setErrorMessage(!targetMajor.trim() ? "请填写目标专业。" : lengthStatus.message);
      return;
    }

    setStatus("validating");
    setErrorMessage("");
    setSelectedService(null);

    try {
      setStatus("diagnosing");
      const response = await fetch("/api/tools/study-abroad-essay-check/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "诊断服务暂时不可用。");
      setResult(data.result);
      setStatus(data.result?.isDemo ? "demo_result_ready" : "result_ready");
      window.setTimeout(() => {
        if (window.matchMedia("(max-width: 900px)").matches) {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 80);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "诊断失败，请稍后重试。");
    }
  }

  function openLead(service: ServiceName) {
    setSelectedService(service);
    window.setTimeout(() => leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const currentStep = result ? 2 : essayText ? 1 : 0;
  const resultPanel = (
    <div ref={resultRef}>
      {status === "diagnosing" && <DiagnosisProgress />}
      {status !== "diagnosing" && !result && (
        <div className="essay-empty-result">
          <p>诊断预览</p>
          <h2>粘贴文书后，这里会显示结构化报告</h2>
          <ul>
            <li>综合评分和置信度</li>
            <li>6 个维度评分</li>
            <li>原文证据和修改优先级</li>
          </ul>
        </div>
      )}
      {result && (
        <>
          <EssayDiagnosisResult result={result} />
          <ServiceCTA primaryService={selectedService || result.serviceRecommendation.primaryService} onSelect={openLead} />
          {selectedService && (
            <div id="essay-lead-request-form" ref={leadFormRef}>
              <LeadCapture result={result} selectedService={selectedService} request={requestPayload} />
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <ToolPageLayout resultPanel={resultPanel}>
      <div className="essay-title-block">
        <p>免费诊断工具</p>
        <h1>{studyAbroadEssayTool.title}</h1>
        <span>{studyAbroadEssayTool.description}</span>
      </div>

      <ToolStepRail currentStep={currentStep} />

      <div className="essay-form-card">
        <div className="essay-field">
          <label>申请阶段</label>
          <div className="essay-segmented">
            {applicationStages.map((stage) => (
              <button
                key={stage}
                type="button"
                className={stage === applicationStage ? "is-selected" : ""}
                onClick={() => setApplicationStage(stage)}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div className="essay-field">
          <label htmlFor="targetMajor">目标专业</label>
          <input
            id="targetMajor"
            value={targetMajor}
            onChange={(event) => setTargetMajor(event.target.value)}
            placeholder="例如：Business Analytics / Computer Science / Education"
            maxLength={120}
          />
        </div>

        <div className="essay-field">
          <label>文书类型</label>
          <div className="essay-segmented">
            {essayDocumentTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={type === documentType ? "is-selected" : ""}
                onClick={() => setDocumentType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <details className="essay-extra-fields">
          <summary>补充信息</summary>
          <div className="essay-extra-grid">
            <label>
              目标国家或地区
              <input value={targetRegion} onChange={(event) => setTargetRegion(event.target.value)} maxLength={80} placeholder="例如：美国 / 英国 / 加拿大" />
            </label>
            <label>
              目标学校或项目
              <input value={targetSchoolOrProgram} onChange={(event) => setTargetSchoolOrProgram(event.target.value)} maxLength={140} placeholder="例如：NYU MSBA" />
            </label>
            <label>
              当前文书状态
              <select value={draftStage} onChange={(event) => setDraftStage(event.target.value as DraftStage)}>
                {draftStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="essay-field">
            <label>最担心的问题</label>
            <div className="essay-segmented">
              {concernOptions.map((concern) => (
                <button
                  key={concern}
                  type="button"
                  className={concerns.includes(concern) ? "is-selected" : ""}
                  onClick={() => toggleConcern(concern)}
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>
        </details>

        <EssayTextInput value={essayText} onChange={(value) => {
          setEssayText(value);
          if (status === "error") setStatus("input_ready");
        }} disabled={status === "diagnosing"} />

        <PrivacyNotice />

        {status === "error" && (
          <div className="essay-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => setStatus("input_ready")}>
              我知道了
            </button>
          </div>
        )}

        <button type="button" className="essay-primary-button" disabled={!canSubmit || status === "diagnosing"} onClick={diagnose}>
          {status === "diagnosing" ? "正在生成诊断..." : "生成文书诊断"}
        </button>
      </div>
    </ToolPageLayout>
  );
}
