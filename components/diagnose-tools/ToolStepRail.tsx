"use client";

const steps = ["填写背景", "粘贴文书", "查看诊断"];

export function ToolStepRail({ currentStep }: { currentStep: number }) {
  return (
    <div className="essay-step-rail" aria-label="诊断步骤">
      {steps.map((step, index) => (
        <div key={step} className={`essay-step ${index <= currentStep ? "is-active" : ""}`}>
          <span>{index + 1}</span>
          <p>{step}</p>
        </div>
      ))}
    </div>
  );
}
