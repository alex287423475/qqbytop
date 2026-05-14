"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mockBasicReport, pricingSkus, progressSamples, sampleEssay, writingTopics } from "@/lib/ielts-writing/constants";
import type { BasicWritingReport, WritingTaskType, WritingTopic } from "@/lib/ielts-writing/types";

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getScorePoints(report: BasicWritingReport) {
  const center = 58;
  const radius = 48;
  const values = report.dimensionScores.map((item) => item.score / 9);
  return values
    .map((value, index) => {
      const angle = -Math.PI / 2 + index * (Math.PI / 2);
      const pointRadius = radius * value;
      return `${center + Math.cos(angle) * pointRadius},${center + Math.sin(angle) * pointRadius}`;
    })
    .join(" ");
}

function WritingNav() {
  return (
    <header className="iw-nav" aria-label="雅思写作诊断工具导航">
      <Link className="iw-brand" href="/tools/ielts-writing">
        <span>IELTS Writing Lab</span>
        <strong>AI 写作诊断</strong>
      </Link>
      <nav aria-label="工具页面">
        <Link href="/tools/ielts-writing/topics">题库</Link>
        <Link href="/tools/ielts-writing/pricing">套餐</Link>
        <Link href="/tools/ielts-writing/profile">我的报告</Link>
      </nav>
    </header>
  );
}

function ScoreRadar({ report }: { report: BasicWritingReport }) {
  return (
    <div className="iw-radar" aria-label="四项评分雷达图">
      <svg viewBox="0 0 116 116" role="img" aria-label="TR CC LR GRA 雷达图">
        <polygon className="iw-radar-grid" points="58,10 106,58 58,106 10,58" />
        <polygon className="iw-radar-grid inner" points="58,27 89,58 58,89 27,58" />
        <line x1="58" y1="10" x2="58" y2="106" />
        <line x1="10" y1="58" x2="106" y2="58" />
        <polygon className="iw-radar-score" points={getScorePoints(report)} />
      </svg>
      <div className="iw-radar-labels">
        {report.dimensionScores.map((item) => (
          <span key={item.dimension}>
            <strong>{item.dimension}</strong>
            {item.score.toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
}

function EssayInputPanel() {
  const [taskType, setTaskType] = useState<WritingTaskType>("task2");
  const [prompt, setPrompt] = useState(mockBasicReport.prompt);
  const [essay, setEssay] = useState(sampleEssay);
  const wordCount = useMemo(() => countWords(essay), [essay]);
  const requiredWords = taskType === "task2" ? 250 : 150;
  const isReady = essay.trim().length >= 80 && wordCount >= 80;

  return (
    <section className="iw-input-panel" aria-labelledby="writingInputTitle">
          <div className="iw-panel-head">
            <div>
              <p className="iw-eyebrow">Free Basic Diagnostic</p>
              <h2 id="writingInputTitle">粘贴作文，先看免费基础报告</h2>
            </div>
        <div className="iw-task-switch" role="tablist" aria-label="写作任务类型">
          {(["task1", "task2"] as WritingTaskType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={taskType === type ? "is-active" : undefined}
              onClick={() => setTaskType(type)}
              role="tab"
              aria-selected={taskType === type}
            >
              {type === "task1" ? "Task 1" : "Task 2"}
            </button>
          ))}
          </div>
        </div>
        <div className="iw-input-badges" aria-label="输入规则">
          <span>无需登录即可生成基础报告</span>
          <span>深度报告仅登录后解锁</span>
          <span>真实接入后 90 秒超时降级</span>
        </div>

      <label className="iw-field">
        <span>题目</span>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
      </label>

      <label className="iw-field">
        <span>作文正文</span>
        <textarea value={essay} onChange={(event) => setEssay(event.target.value)} rows={12} />
      </label>

      <div className="iw-input-footer">
        <div className="iw-word-meter" aria-label="字数统计">
          <strong>{wordCount}</strong>
          <span>words / 建议 {requiredWords}+</span>
          <em style={{ width: `${Math.min(100, (wordCount / requiredWords) * 100)}%` }} />
        </div>
        <Link className={`iw-primary ${isReady ? "" : "is-disabled"}`} href="/tools/ielts-writing/report/demo-band-55" aria-disabled={!isReady}>
          生成免费基础报告
        </Link>
      </div>
    </section>
  );
}

function PricingInline({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "iw-inline-pricing is-compact" : "iw-inline-pricing"} aria-label="写作深度诊断套餐">
      {pricingSkus.map((sku) => (
        <article className={`iw-inline-price-card ${sku.featured ? "is-featured" : ""}`} key={sku.id}>
          <div>
            <span>{sku.name}</span>
            <strong>{sku.price}</strong>
          </div>
          <p>{sku.unit}</p>
          <em>{sku.featured ? "推荐" : sku.credits === 1 ? "体验" : "冲刺"}</em>
        </article>
      ))}
    </div>
  );
}

export function IeltsWritingHome() {
  return (
    <main className="iw-page">
      <WritingNav />
      <section className="iw-hero">
        <div className="iw-hero-copy">
          <p className="iw-eyebrow">IELTS Writing Diagnostic Cockpit</p>
          <h1>
            <span>雅思写作 AI 诊断</span>
            <span>30 秒定位扣分点</span>
          </h1>
          <p>
            面向 C 端考生的独立写作产品。基础报告免费展示分数区间和关键问题，深度报告解锁逐句批改、四项细分和 Band 7+
            改写建议。
          </p>
          <div className="iw-trust-strip" aria-label="可信诊断承诺">
            <span>
              <strong>服务端控权</strong>
              未解锁不返回深度 JSON
            </span>
            <span>
              <strong>四项标准</strong>
              TR / CC / LR / GRA
            </span>
            <span>
              <strong>可追溯证据</strong>
              每个问题绑定原文
            </span>
          </div>
          <div className="iw-hero-actions">
            <a className="iw-primary" href="#diagnose">
              开始免费诊断
            </a>
            <Link className="iw-secondary" href="/tools/ielts-writing/pricing">
              查看套餐
            </Link>
          </div>
        </div>
        <aside className="iw-hero-console" aria-label="产品状态面板">
          <div className="iw-console-top">
            <span>Basic report</span>
            <strong>Free</strong>
          </div>
          <div className="iw-console-score">
            <span>预计分数</span>
            <strong>5.5-6.0</strong>
            <p>当前样本最大短板：GRA 复杂句范围不足</p>
          </div>
          <div className="iw-console-grid">
            <span>TR 6.0</span>
            <span>CC 6.0</span>
            <span>LR 5.5</span>
            <span>GRA 5.5</span>
          </div>
          <div className="iw-console-checks" aria-label="报告生成状态">
            <div>
              <span />
              <p>BasicWritingReport schema validated</p>
            </div>
            <div>
              <span />
              <p>Deep report locked by entitlement</p>
            </div>
            <div>
              <span />
              <p>Payment fulfillment uses credit ledger</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="iw-method-strip" aria-label="诊断工作流">
        {[
          ["01", "输入校验", "Task 类型、字数、重复提交和匿名 session"],
          ["02", "基础诊断", "先返回分数区间和前三个扣分点"],
          ["03", "深度解锁", "手机号登录后扣写作深度点数"],
          ["04", "复盘沉淀", "历史报告、高频错误和下一篇任务"],
        ].map(([step, title, detail]) => (
          <article key={step}>
            <span>{step}</span>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section id="diagnose" className="iw-workspace">
        <EssayInputPanel />
        <aside className="iw-side-stack">
          <div className="iw-side-block">
            <p className="iw-eyebrow">What is free</p>
            <h2>基础报告给结论，深度报告给证据</h2>
            <ul>
              <li>免费：预估分数区间、四项粗分、3 个主要扣分点、1 句示例改写。</li>
              <li>付费：逐句批改、段落逻辑、词汇替换、Band 7+ 改写、下一篇练习任务。</li>
              <li>未解锁接口不返回深度 JSON，不能只靠 CSS 隐藏真实内容。</li>
            </ul>
          </div>
          <div className="iw-quality-card">
            <strong>质量底线</strong>
            <p>不承诺官方分数，不做 Band 9 保证，不把作文改成不自然的大词堆砌。</p>
          </div>
        </aside>
      </section>

      <section className="iw-section iw-package-band" aria-labelledby="packageBandTitle">
        <div className="iw-section-head compact">
          <div>
            <p className="iw-eyebrow">Visible pricing</p>
            <h2 id="packageBandTitle">套餐直接展开，减少二次跳转</h2>
            <p>用户在提交前就能知道解锁成本。写作点数独立，不与口语点数共享。</p>
          </div>
          <Link href="/tools/ielts-writing/pricing">查看完整说明</Link>
        </div>
        <PricingInline />
      </section>

      <section className="iw-section">
        <div className="iw-section-head">
          <p className="iw-eyebrow">Topic Traffic</p>
          <h2>题库页负责 SEO，诊断页负责转化</h2>
          <Link href="/tools/ielts-writing/topics">进入题库</Link>
        </div>
        <div className="iw-topic-grid">
          {writingTopics.slice(0, 3).map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
    </main>
  );
}

function IssueList({ report }: { report: BasicWritingReport }) {
  return (
    <div className="iw-issues">
      {report.topIssues.map((issue) => (
        <article className={`iw-issue is-${issue.severity}`} key={`${issue.category}-${issue.evidence}`}>
          <span>{issue.category}</span>
          <strong>{issue.evidence}</strong>
          <p>{issue.explanation}</p>
        </article>
      ))}
    </div>
  );
}

export function IeltsWritingReport({ report = mockBasicReport }: { report?: BasicWritingReport }) {
  return (
    <main className="iw-page">
      <WritingNav />
      <section className="iw-report-layout">
        <div className="iw-report-main">
          <div className="iw-report-head">
            <div>
              <p className="iw-eyebrow">Report ID: {report.reportId}</p>
              <h1>免费基础报告已生成</h1>
              <p>{report.prompt}</p>
            </div>
            <div className="iw-band-box">
              <span>预计分数区间</span>
              <strong>
                {report.estimatedBandRange.low.toFixed(1)}-{report.estimatedBandRange.high.toFixed(1)}
              </strong>
              <em>{report.wordCount} words</em>
            </div>
          </div>

          <div className="iw-report-grid">
            <ScoreRadar report={report} />
            <div className="iw-dimension-list">
              {report.dimensionScores.map((score) => (
                <article key={score.dimension}>
                  <span>{score.dimension}</span>
                  <div>
                    <strong>{score.label}</strong>
                    <p>{score.summary}</p>
                    <em>证据：{score.evidence}</em>
                  </div>
                  <b>{score.score.toFixed(1)}</b>
                </article>
              ))}
            </div>
          </div>

          <section className="iw-section-flat">
            <div className="iw-section-head compact">
              <div>
                <p className="iw-eyebrow">Top Issues</p>
                <h2>最影响提分的 3 个问题</h2>
              </div>
            </div>
            <IssueList report={report} />
          </section>

          <section className="iw-revision">
            <p className="iw-eyebrow">Sample Revision</p>
            <div>
              <span>原句</span>
              <p>{report.sampleRevision.original}</p>
            </div>
            <div>
              <span>建议改写</span>
              <p>{report.sampleRevision.revised}</p>
            </div>
            <strong>{report.sampleRevision.reason}</strong>
          </section>
        </div>

        <aside className="iw-paywall">
          <div className="iw-lock-card">
            <span>Deep report locked</span>
            <h2>解锁深度报告</h2>
            <p>{report.upgradeHint}</p>
            <ul>
              <li>四项精确分数和扣分证据</li>
              <li>逐句批改和错误分类</li>
              <li>高分词汇替换表</li>
              <li>Band 7+ 改写示例</li>
            </ul>
            <Link className="iw-primary" href="/tools/ielts-writing/pricing">
              购买写作深度点数
            </Link>
            <PricingInline compact />
            <Link className="iw-secondary" href="/tools/ielts-writing/profile">
              查看我的报告
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

export function IeltsWritingPricing() {
  return (
    <main className="iw-page">
      <WritingNav />
      <section className="iw-pricing-page">
        <div className="iw-section-head">
          <div>
            <p className="iw-eyebrow">Writing credits only</p>
            <h1>写作点数独立，不与口语点数共享</h1>
            <p>套餐只增加 writing_deep_credits。未来上线口语产品时，口语会使用 speaking_deep_credits。</p>
          </div>
        </div>
        <div className="iw-price-grid">
          {pricingSkus.map((sku) => (
            <article className={`iw-price-card ${sku.featured ? "is-featured" : ""}`} key={sku.id}>
              <span>{sku.unit}</span>
              <h2>{sku.name}</h2>
              <strong>{sku.price}</strong>
              <p>{sku.fit}</p>
              <em>{sku.note}</em>
              <button type="button">登录后购买</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function IeltsWritingProfile() {
  return (
    <main className="iw-page">
      <WritingNav />
      <section className="iw-profile-layout">
        <div className="iw-profile-head">
          <p className="iw-eyebrow">Profile mock</p>
          <h1>我的写作诊断档案</h1>
          <p>手机号登录后显示真实余额、历史报告和高频错题。当前为前端 mock 状态。</p>
        </div>
        <div className="iw-profile-grid">
          <div className="iw-credit-card">
            <span>writing_deep_credits</span>
            <strong>5</strong>
            <p>只用于雅思写作深度报告。</p>
          </div>
          <div className="iw-credit-card muted">
            <span>speaking_deep_credits</span>
            <strong>0</strong>
            <p>不参与写作报告解锁。</p>
          </div>
          <div className="iw-progress-card">
            <span>最近 5 篇趋势</span>
            <div className="iw-progress-bars">
              {progressSamples.map((item) => (
                <div key={item.label}>
                  <em style={{ height: `${item.score * 11}px` }} />
                  <span>{item.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="iw-history-table">
          {[
            ["Online education", "Task 2", "5.5-6.0", "locked"],
            ["Transport bar chart", "Task 1", "6.0-6.5", "ready"],
            ["Environment responsibility", "Task 2", "5.0-5.5", "locked"],
          ].map(([title, type, score, status]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{type}</span>
              <span>{score}</span>
              <em>{status}</em>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function TopicCard({ topic }: { topic: WritingTopic }) {
  return (
    <article className="iw-topic-card">
      <div>
        <span>{topic.taskType === "task1" ? "Task 1" : "Task 2"}</span>
        <em>{topic.difficulty}</em>
      </div>
      <h2>{topic.title}</h2>
      <p>{topic.prompt}</p>
      <strong>{topic.searchIntent}</strong>
      <Link href={`/tools/ielts-writing/topics/${topic.slug}`}>查看题目并诊断</Link>
    </article>
  );
}

export function IeltsWritingTopics({ activeTopic }: { activeTopic?: WritingTopic }) {
  if (activeTopic) {
    return (
      <main className="iw-page">
        <WritingNav />
        <article className="iw-topic-detail">
          <p className="iw-eyebrow">{activeTopic.category}</p>
          <h1>{activeTopic.title}</h1>
          <p>{activeTopic.prompt}</p>
          <div className="iw-topic-help">
            <section>
              <h2>写作思路</h2>
              <p>先明确立场，再用一段解释优势、一段解释限制，结尾避免机械重复开头。</p>
            </section>
            <section>
              <h2>高分表达</h2>
              <p>supplement classroom learning, fit lessons around one's schedule, sustain motivation</p>
            </section>
          </div>
          <Link className="iw-primary" href="/tools/ielts-writing">
            粘贴你的答案进行诊断
          </Link>
        </article>
      </main>
    );
  }

  return (
    <main className="iw-page">
      <WritingNav />
      <section className="iw-topics-page">
        <div className="iw-section-head">
          <div>
            <p className="iw-eyebrow">SEO topic bank</p>
            <h1>雅思写作题库与诊断入口</h1>
            <p>题库页不只堆关键词，每个题目都提供写作方向并导向诊断工具。</p>
          </div>
        </div>
        <div className="iw-topic-grid">
          {writingTopics.map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
    </main>
  );
}
