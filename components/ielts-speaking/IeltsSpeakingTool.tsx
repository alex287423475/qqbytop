"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AuthModal } from "./AuthModal";

type Part = "part1" | "part2" | "part3" | "rush";
type RecordingState = "ready" | "recording" | "recorded" | "diagnosing" | "error";

type Topic = {
  id: string;
  part: Exclude<Part, "rush">;
  tag: string;
  title: string;
  zh: string;
  duration: string;
  difficulty: string;
};

type ScoreCell = {
  key: "FC" | "LR" | "GRA" | "PR";
  label: string;
  score: string;
  issue: string;
  priority: string;
};

type BasicReport = {
  bandRange: string;
  duration: string;
  wpm: string;
  pauses: string;
  pronunciation: string;
  issues: Array<{
    key: string;
    title: string;
    evidence: string;
    severity?: "high" | "medium";
  }>;
  scores: ScoreCell[];
};

const topics: Topic[] = [
  {
    id: "work-or-studies",
    part: "part1",
    tag: "高频",
    title: "Do you work or are you a student?",
    zh: "工作还是学习",
    duration: "45 秒",
    difficulty: "基础",
  },
  {
    id: "memorable-journey",
    part: "part2",
    tag: "换题季",
    title: "Describe a memorable journey you had",
    zh: "描述一次难忘的旅行",
    duration: "2 分钟",
    difficulty: "中等",
  },
  {
    id: "technology-education",
    part: "part3",
    tag: "追问",
    title: "How has technology changed education?",
    zh: "科技如何改变教育",
    duration: "75 秒",
    difficulty: "进阶",
  },
  {
    id: "environment-protection",
    part: "part3",
    tag: "高频",
    title: "Should individuals or governments protect the environment?",
    zh: "环保责任归个人还是政府",
    duration: "90 秒",
    difficulty: "进阶",
  },
  {
    id: "favorite-place",
    part: "part2",
    tag: "高频",
    title: "Describe a place where you like to relax",
    zh: "描述一个让你放松的地方",
    duration: "2 分钟",
    difficulty: "基础",
  },
  {
    id: "childhood-memory",
    part: "part2",
    tag: "易错",
    title: "Describe a happy memory from your childhood",
    zh: "描述一个童年快乐回忆",
    duration: "2 分钟",
    difficulty: "中等",
  },
];

const demoReport: BasicReport = {
  bandRange: "5.5-6.0",
  duration: "1:36",
  wpm: "112 WPM",
  pauses: "14 次",
  pronunciation: "76/100",
  issues: [
    {
      key: "GRA",
      title: "过去时不稳定",
      evidence: "Yesterday I go to a park...",
      severity: "high",
    },
    {
      key: "FC",
      title: "复杂句前停顿偏长",
      evidence: "because... uh... it was...",
      severity: "medium",
    },
    {
      key: "LR",
      title: "低分词重复明显",
      evidence: "good / very / interesting 高频重复。",
    },
  ],
  scores: [
    { key: "FC", label: "流利度与连贯性", score: "5.5", issue: "长停顿集中在复杂句前", priority: "优先" },
    { key: "LR", label: "词汇资源", score: "5.5", issue: "good / interesting 重复", priority: "第二" },
    { key: "GRA", label: "语法多样性", score: "5.0", issue: "过去时不稳定", priority: "优先" },
    { key: "PR", label: "发音", score: "6.0", issue: "/θ/ 与 /s/ 混淆", priority: "第三" },
  ],
};

const workflowSteps = [
  ["选题", "当季题库"],
  ["录音", "1-2 分钟"],
  ["基础报告", "免费查看"],
  ["深度报告", "登录解锁"],
];

const heroTrustItems = ["SOE 发音证据", "AI 预估区间", "异常报告复核"];

const qualityRows = [
  { name: "发音证据", status: "已校验", statusClass: "checked", note: "只引用 SOE 音素、单词和流利度数据" },
  { name: "扣分理由", status: "需证据", statusClass: "evidence", note: "每个主要问题必须绑定原句或音频证据" },
  { name: "改写建议", status: "防过度", statusClass: "guarded", note: "不把口语改成作文式大词堆砌" },
  { name: "分数区间", status: "非官方", statusClass: "unofficial", note: "只展示 AI 预估区间，不承诺真实考试成绩" },
  { name: "高风险报告", status: "复核", statusClass: "review", note: "证据不足或识别异常时进入人工复核" },
];

const pricingPlans = [
  {
    name: "首份体验",
    price: "￥3.9",
    fit: "还不确定 AI 报告是否适合自己",
    badge: "解锁当前深度报告",
    details: ["1 次深度报告", "四项预估分", "Top 3 扣分原因"],
  },
  {
    name: "5 次诊断包",
    price: "￥29.9",
    fit: "集中练一个 Part 或一个话题组",
    badge: "适合练 1 周",
    details: ["5 次深度报告", "同题复录对比", "问题优先级记录"],
  },
  {
    name: "当季热题冲刺",
    price: "￥99",
    fit: "围绕 5-8 月 Part 2 / Part 3 高频题做考前冲刺",
    badge: "主推",
    featured: true,
    details: ["20 次深度报告", "当季热题训练路径", "7 天复练计划"],
  },
  {
    name: "15 次自助包",
    price: "￥69",
    fit: "只想多拿诊断次数，自行安排练习节奏",
    badge: "更多次数",
    details: ["15 次深度报告", "基础历史记录", "适合自律复练"],
  },
];

const partLabels: Record<Part, string> = {
  part1: "Part 1",
  part2: "Part 2",
  part3: "Part 3",
  rush: "考前高频",
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remain = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remain}`;
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";
}

export function IeltsSpeakingTool() {
  const [part, setPart] = useState<Part>("part2");
  const [selectedTopicId, setSelectedTopicId] = useState("memorable-journey");
  const [recordingState, setRecordingState] = useState<RecordingState>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [report, setReport] = useState<BasicReport>(demoReport);
  const [statusMessage, setStatusMessage] = useState("这不是正式考试，先练习完整表达。");
  const [authOpen, setAuthOpen] = useState(false);
  const [userIdentity, setUserIdentity] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const selectedTopic = useMemo(() => {
    return topics.find((topic) => topic.id === selectedTopicId) ?? topics[1];
  }, [selectedTopicId]);

  const visibleTopics = useMemo(() => {
    if (part === "rush") return topics.filter((topic) => topic.tag === "高频" || topic.tag === "换题季");
    return topics.filter((topic) => topic.part === part);
  }, [part]);

  const recordingLabel =
    recordingState === "ready"
      ? "开始录音"
      : recordingState === "recording"
        ? "结束录音"
        : recordingState === "recorded"
          ? "提交诊断"
          : recordingState === "error"
            ? "重新开始"
            : "正在评测";

  useEffect(() => {
    if (recordingState !== "recording") return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingState("error");
      setStatusMessage("当前浏览器不支持录音，请使用 Chrome、Edge 或移动端 Safari 的较新版本。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setElapsedSeconds(0);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingState("recorded");
        setStatusMessage("录音已保存在本地，可先回放确认，再提交诊断。");
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecordingState("recording");
      setStatusMessage("录音中，系统暂不展示评分，避免干扰表达。");
    } catch {
      setRecordingState("error");
      setStatusMessage("没有获得麦克风权限，请允许浏览器访问麦克风后重试。");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function submitRecording() {
    if (!audioBlob) {
      setRecordingState("error");
      setStatusMessage("没有可提交的录音，请重新录制。");
      return;
    }

    setRecordingState("diagnosing");
    setStatusMessage("正在上传录音并生成基础报告。后端未接入时会显示演示报告。");

    const formData = new FormData();
    formData.append("audio", audioBlob, "ielts-speaking.webm");
    formData.append("topicId", selectedTopic.id);
    formData.append("part", selectedTopic.part);
    formData.append("question", selectedTopic.title);
    formData.append("elapsedSeconds", String(elapsedSeconds));

    try {
      const response = await fetch("/tools/ielts-api/reports", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`diagnose failed: ${response.status}`);
      const payload = (await response.json()) as Partial<BasicReport>;
      setReport({
        ...demoReport,
        ...payload,
        issues: payload.issues ?? demoReport.issues,
        scores: payload.scores ?? demoReport.scores,
      });
      setStatusMessage("基础报告已生成。登录或付费后可解锁深度报告。");
    } catch {
      setReport(demoReport);
      setStatusMessage("后端接口尚未接入，当前展示演示报告；接口路径已固定为 /tools/ielts-api/reports。");
    } finally {
      setRecordingState("ready");
    }
  }

  function resetRecorder() {
    setRecordingState("ready");
    setElapsedSeconds(0);
    setAudioBlob(null);
    setStatusMessage("这不是正式考试，先练习完整表达。");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }
  }

  function handleRecordAction() {
    if (recordingState === "ready") void startRecording();
    if (recordingState === "recording") stopRecording();
    if (recordingState === "recorded") void submitRecording();
    if (recordingState === "error") resetRecorder();
  }

  function handleUnlockReport() {
    if (!userIdentity) {
      setAuthOpen(true);
      return;
    }
    window.location.hash = "pricing";
  }

  return (
    <main className="ielts-page">
      <section className="ielts-shell ielts-hero" aria-labelledby="ieltsHeroTitle">
        <div className="ielts-hero-copy">
          <p className="ielts-eyebrow">IELTS Speaking Diagnostic Workspace</p>
          <h1 id="ieltsHeroTitle">雅思口语当季题库 AI 诊断</h1>
          <p className="ielts-hero-lede">
            录音回答一道题，先看免费基础报告，再决定是否解锁深度扣分原因、逐句修改建议和 7 天训练计划。
          </p>
          <div className="ielts-hero-actions">
            <a className="ielts-primary-button" href="#topics">
              开始免费诊断
            </a>
            <a className="ielts-secondary-button" href="#report">
              查看示例报告
            </a>
          </div>
          <div className="ielts-trust-strip" aria-label="诊断可信机制">
            {heroTrustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="ielts-disclaimer">AI 预估分，非官方 IELTS 成绩。报告用于备考诊断，不替代正式考试结果。</div>
        </div>

        <aside className="ielts-practice-card" aria-label="今日练习状态">
          <div className="ielts-card-head">
            <span>2026 5-8 月题库</span>
            <strong>96 题</strong>
          </div>
          <div className="ielts-practice-divider" />
          <dl className="ielts-mini-stats">
            <div>
              <dt>今日免费</dt>
              <dd>1 次</dd>
            </div>
            <div>
              <dt>深度额度</dt>
              <dd>0 次</dd>
            </div>
            <div>
              <dt>最近分区</dt>
              <dd>{report.bandRange}</dd>
            </div>
          </dl>
          <div className="ielts-audit-list" aria-label="诊断校验规则">
            <span>证据不足不出深度结论</span>
            <span>同一录音不重复扣费</span>
          </div>
          <div className="ielts-user-status">
            {userIdentity ? `已登录：${userIdentity}` : "未登录：深度报告解锁前需要登录"}
          </div>
          <a className="ielts-inline-link" href="#pricing">
            解锁扣分证据
          </a>
        </aside>
      </section>

      <section className="ielts-shell ielts-flow-strip" aria-label="诊断流程">
        {workflowSteps.map(([name, detail], index) => (
          <div className="ielts-flow-step" key={name}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{name}</strong>
            <em>{detail}</em>
          </div>
        ))}
      </section>

      <section id="topics" className="ielts-shell ielts-topic-section" aria-labelledby="topicTitle">
        <div className="ielts-section-heading">
          <p className="ielts-eyebrow">Topic Bank</p>
          <h2 id="topicTitle">选择一道题开始练习</h2>
          <p>题库页同时服务 SEO 和练习入口。每道题都直接连接录音与诊断，而不是只给范文。</p>
        </div>

        <div className="ielts-part-tabs" role="tablist" aria-label="雅思口语题型">
          {(Object.keys(partLabels) as Part[]).map((item) => (
            <button
              key={item}
              type="button"
              className={item === part ? "is-active" : undefined}
              onClick={() => setPart(item)}
              role="tab"
              aria-selected={item === part}
            >
              {partLabels[item]}
            </button>
          ))}
        </div>

        <div className="ielts-topic-grid">
          {visibleTopics.map((topic) => (
            <article key={topic.id} className={`ielts-topic-card ${topic.id === selectedTopicId ? "is-selected" : ""}`}>
              <div className="ielts-topic-meta">
                <span>{topic.tag}</span>
                <span>{topic.duration}</span>
              </div>
              <h3>{topic.title}</h3>
              <p>{topic.zh}</p>
              <div className="ielts-topic-footer">
                <span>{topic.difficulty}</span>
                <a
                  href="#record"
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setStatusMessage("已切换题目，可以开始录音。");
                  }}
                >
                  录音回答
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="record" className="ielts-shell ielts-record-section" aria-labelledby="recordTitle">
        <div className="ielts-record-copy">
          <p className="ielts-eyebrow">Low-pressure Recording</p>
          <h2 id="recordTitle">低压录音舱</h2>
          <p>录音页只保留题目、计时器和主按钮。系统不会在你开口前展示复杂评分标准，先完整说完更重要。</p>
          <ul>
            <li>小于 8 秒会提示有效内容过短。</li>
            <li>上传失败可重试，不丢失本地录音。</li>
            <li>录音中不展示四项评分，避免干扰表达。</li>
          </ul>
        </div>

        <div className={`ielts-record-panel is-${recordingState}`}>
          <div className="ielts-record-question">
            <span>{partLabels[selectedTopic.part]} · {selectedTopic.duration}</span>
            <strong>{selectedTopic.title}</strong>
          </div>
          <div className="ielts-timer" aria-live="polite">
            {recordingState === "recording"
              ? formatDuration(elapsedSeconds)
              : recordingState === "diagnosing"
                ? "评测中"
                : recordingState === "recorded"
                  ? formatDuration(elapsedSeconds)
                  : "准备"}
          </div>
          <button
            className="ielts-record-button"
            type="button"
            onClick={handleRecordAction}
            aria-label={recordingLabel}
            disabled={recordingState === "diagnosing"}
          >
            <span className="ielts-record-dot" aria-hidden="true" />
            {recordingLabel}
          </button>
          <div className="ielts-wave" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          {audioUrl ? (
            <audio className="ielts-audio-preview" src={audioUrl} controls preload="metadata">
              <track kind="captions" />
            </audio>
          ) : null}
          <p className="ielts-record-hint">{statusMessage}</p>
        </div>
      </section>

      <section id="report" className="ielts-shell ielts-report-section" aria-labelledby="reportTitle">
        <div className="ielts-report-main">
          <div className="ielts-section-heading">
            <p className="ielts-eyebrow">Evidence-driven Report</p>
            <h2 id="reportTitle">报告像诊断单，而不是聊天回复</h2>
            <p>基础报告给结论，深度报告给证据、逐句修改和训练处方。</p>
          </div>

          <div className="ielts-priority-banner" aria-label="当前最优先改进项">
            <span>优先改</span>
            <strong>过去时稳定性 + 复杂句前停顿</strong>
            <p>先把最拖分的 2 个问题修掉，再追求更多高分表达。</p>
          </div>

          <div className="ielts-basic-report">
            <div className="ielts-report-header">
              <span>AI 预估分，非官方成绩</span>
              <strong>{report.bandRange}</strong>
            </div>
            <div className="ielts-metric-strip">
              <div>
                <span>回答时长</span>
                <strong>{audioBlob ? formatDuration(elapsedSeconds) : report.duration}</strong>
              </div>
              <div>
                <span>语速</span>
                <strong>{report.wpm}</strong>
              </div>
              <div>
                <span>停顿</span>
                <strong>{report.pauses}</strong>
              </div>
              <div>
                <span>发音清晰度</span>
                <strong>{report.pronunciation}</strong>
              </div>
            </div>
            <div className="ielts-issue-list">
              {report.issues.map((issue) => (
                <div
                  key={`${issue.key}-${issue.title}`}
                  className={`ielts-issue-card ${issue.severity === "high" ? "is-high" : issue.severity === "medium" ? "is-medium" : ""}`}
                >
                  <span>{issue.key}</span>
                  <strong>{issue.title}</strong>
                  <p>证据：{issue.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ielts-score-grid" aria-label="深度报告四项分数示例">
            {report.scores.map((cell) => (
              <div className="ielts-score-cell" key={cell.key}>
                <div>
                  <span>{cell.key}</span>
                  <strong>{cell.score}</strong>
                </div>
                <p>{cell.label}</p>
                <em>{cell.issue}</em>
                <small>{cell.priority}</small>
              </div>
            ))}
          </div>
        </div>

        <aside className="ielts-action-rail">
          <div className="ielts-lock-panel">
            <span>深度报告锁定</span>
            <h3>解锁扣分证据和 7 天训练计划</h3>
            <ul>
              <li>四项预估分和优先级</li>
              <li>逐句修改建议</li>
              <li>SOE 支撑的发音问题</li>
              <li>同题重录任务</li>
            </ul>
            <button className="ielts-primary-button" type="button" onClick={handleUnlockReport}>
              ￥3.9 解锁本次报告
            </button>
          </div>
        </aside>
      </section>

      <section id="pricing" className="ielts-shell ielts-pricing-section" aria-labelledby="pricingTitle">
        <div className="ielts-section-heading">
          <p className="ielts-eyebrow">Pricing by Study Stage</p>
          <h2 id="pricingTitle">按备考阶段选择，而不是购买 AI 调用</h2>
          <p>免费基础报告用于判断方向；深度报告用于定位扣分证据。考前用户优先选择当季热题冲刺，而不是只买零散次数。</p>
        </div>
        <div className="ielts-pricing-grid">
          {pricingPlans.map((plan) => (
            <article className={`ielts-price-card ${plan.featured ? "is-featured" : ""}`} key={plan.name}>
              <span>{plan.badge}</span>
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.fit}</p>
              <ul>
                {plan.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  if (!userIdentity) {
                    setAuthOpen(true);
                    return;
                  }
                  window.location.hash = "report";
                }}
              >
                选择方案
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="ielts-shell ielts-admin-preview" aria-labelledby="adminTitle">
        <div className="ielts-section-heading">
          <p className="ielts-eyebrow">Report Quality</p>
          <h2 id="adminTitle">深度报告先过质量闸门，再给用户看</h2>
          <p>用户端只看到清晰建议，后台保留证据、状态和复核原因，避免输出空泛或过度自信的报告。</p>
        </div>
        <div className="ielts-agent-table">
          {qualityRows.map(({ name, status, statusClass, note }) => (
            <div className="ielts-agent-row" key={name}>
              <strong>{name}</strong>
              <span className={`is-${statusClass}`}>{status}</span>
              <p>{note}</p>
            </div>
          ))}
        </div>
      </section>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onVerified={(identity) => {
          setUserIdentity(identity);
          setAuthOpen(false);
          window.location.hash = "pricing";
        }}
      />
    </main>
  );
}
