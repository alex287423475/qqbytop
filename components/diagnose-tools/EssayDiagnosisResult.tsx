"use client";

import type { EssayDiagnosisResult } from "@/lib/diagnose-tools/types";

const confidenceLabel = { low: "低置信度", normal: "标准置信度", high: "高置信度" };
const severityLabel = { high: "高", medium: "中", low: "低" };

function scoreLevel(score: number) {
  if (score >= 8) return "优势项";
  if (score >= 6) return "可优化";
  if (score >= 4) return "优先修补";
  return "高风险";
}

function scoreTone(score: number) {
  if (score >= 8) return "strong";
  if (score >= 6) return "medium";
  return "weak";
}

export function EssayDiagnosisResult({ result }: { result: EssayDiagnosisResult }) {
  return (
    <article className="essay-result">
      {result.isDemo && <div className="essay-demo-note">当前为示例诊断报告，不代表对你文书的真实判断。</div>}
      <div className="essay-result-summary">
        <div>
          <span>综合评分</span>
          <strong>{result.overallScore}</strong>
        </div>
        <div>
          <span>置信度</span>
          <strong>{confidenceLabel[result.confidence]}</strong>
        </div>
        <div>
          <span>类型判断</span>
          <strong>{result.documentTypeAssessment.detectedFit}</strong>
        </div>
      </div>

      <section className="essay-result-section">
        <h2>诊断摘要</h2>
        <p>{result.diagnosisSummary}</p>
        <p className="essay-muted-text">{result.documentTypeAssessment.explanation}</p>
      </section>

      <section className="essay-result-section">
        <h2>六维评分</h2>
        <div className="essay-score-grid">
          {result.dimensionScores.map((item) => (
            <div key={item.id} className={`essay-score-card is-${scoreTone(item.score)}`}>
              <div className="essay-score-card-head">
                <div>
                  <span>{item.name}</span>
                  <em>{scoreLevel(item.score)}</em>
                </div>
                <strong>{item.score}/10</strong>
              </div>
              <div className="essay-score-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(8, Math.min(100, item.score * 10))}%` }} />
              </div>
              <p className="essay-score-comment">{item.comment}</p>
              <dl className="essay-dimension-detail">
                <div>
                  <dt>判断依据</dt>
                  <dd>{item.finding}</dd>
                </div>
                <div>
                  <dt>原文信号</dt>
                  <dd className="essay-dimension-evidence">{item.evidence}</dd>
                </div>
                <div>
                  <dt>下一步动作</dt>
                  <dd>{item.action}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="essay-result-section">
        <h2>主要问题</h2>
        <div className="essay-problem-list">
          {result.mainProblems.map((problem, index) => (
            <div key={`${problem.title}-${index}`} className="essay-problem-card">
              <div className="essay-problem-head">
                <h3>{problem.title}</h3>
                <span className={`essay-severity is-${problem.severity}`}>{severityLabel[problem.severity]}</span>
              </div>
              <blockquote>{problem.evidence}</blockquote>
              <p>
                <strong>为什么重要：</strong>
                {problem.whyItMatters}
              </p>
              <p>
                <strong>修改方向：</strong>
                {problem.suggestedFix}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="essay-result-section">
        <h2>修改优先级</h2>
        <div className="essay-priority-list">
          {result.revisionPriorities.map((item) => (
            <div key={item.item}>
              <span className={`essay-severity is-${item.level}`}>{severityLabel[item.level]}</span>
              <strong>{item.item}</strong>
              <p>{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="essay-quickwins">
        <h2>Quick Wins</h2>
        <ul>
          {result.quickWins.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="essay-before-after">
        <p>示例，不是对你文书的完整改写</p>
        <div>
          <span>Before</span>
          <blockquote>{result.beforeAfterExample.before}</blockquote>
        </div>
        <div>
          <span>After</span>
          <blockquote>{result.beforeAfterExample.after}</blockquote>
        </div>
      </section>
    </article>
  );
}
