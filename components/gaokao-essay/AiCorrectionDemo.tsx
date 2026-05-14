"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type AnimationStage = 0 | 1 | 2 | 3 | 4;

type CorrectionScenario = {
  rawText: string;
  errors: string[];
  logicTags: string[];
  safeVersion: string;
  advancedVersion: string;
  advancedHighlights: string[];
  finalScore: string;
};

const CORRECTION_SCENARIOS: CorrectionScenario[] = [
  {
    rawText: "I very like play basketball, because it make me happy.",
    errors: ["very like", "play", "make"],
    logicTags: ["句式单一", "语法一致性错误", "缺乏高级词汇"],
    safeVersion: "I like playing basketball very much because it makes me happy.",
    advancedVersion: "Basketball appeals to me immensely, as it serves as a powerful source of joy and energy.",
    advancedHighlights: ["appeals to me immensely", "serves as", "joy and energy"],
    finalScore: "22+",
  },
];

const STAGE_DELAYS: Record<AnimationStage, number> = {
  0: 500,
  1: 1500,
  2: 1500,
  3: 3000,
  4: 2000,
};

const LOGIC_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.2 },
  },
};

const LOGIC_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function splitByTerms(text: string, terms: string[]) {
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(pattern).filter(Boolean);
}

function HighlightedRawText({
  scenario,
  stage,
  reducedMotion,
}: {
  scenario: CorrectionScenario;
  stage: AnimationStage;
  reducedMotion: boolean;
}) {
  const active = reducedMotion || stage >= 1;
  const parts = useMemo(() => splitByTerms(scenario.rawText, scenario.errors), [scenario]);

  return (
    <p className="text-xl font-semibold leading-9 text-slate-800 md:text-2xl">
      {parts.map((part, index) => {
        const isError = scenario.errors.includes(part);
        if (!isError) return <span key={`${part}-${index}`}>{part}</span>;

        return (
          <motion.span
            key={`${part}-${index}`}
            className="relative inline-block rounded-md px-1 font-black text-red-600"
            initial={false}
            animate={active ? { backgroundColor: "rgba(254,226,226,0.92)" } : { backgroundColor: "rgba(254,226,226,0)" }}
            transition={{ duration: 0.35, delay: reducedMotion ? 0 : index * 0.08 }}
          >
            <span>{part}</span>
            <motion.span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-0.5 w-full origin-left rounded-full bg-red-500"
              initial={{ scaleX: 0 }}
              animate={active ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : 0.2 + index * 0.08 }}
            />
          </motion.span>
        );
      })}
    </p>
  );
}

function TypewriterText({
  text,
  highlights,
  active,
  reducedMotion,
}: {
  text: string;
  highlights: string[];
  active: boolean;
  reducedMotion: boolean;
}) {
  const parts = useMemo(() => splitByTerms(text, highlights), [text, highlights]);
  const visible = active || reducedMotion;
  let charOffset = 0;

  return (
    <p className="text-lg font-semibold leading-8 text-slate-800 md:text-xl">
      {parts.map((part, partIndex) => {
        const isHighlight = highlights.includes(part);
        const chars = part.split("");
        const start = charOffset;
        charOffset += chars.length;

        return (
          <span key={`${part}-${partIndex}`} className={isHighlight ? "font-black text-amber-600" : undefined}>
            {chars.map((char, charIndex) => (
              <motion.span
                key={`${partIndex}-${charIndex}`}
                initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 4 }}
                animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: 0.12, delay: reducedMotion ? 0 : (start + charIndex) * 0.018 }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        );
      })}
    </p>
  );
}

export function AiCorrectionDemo() {
  const reducedMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLElement | null>(null);
  const inView = useInView(containerRef, { once: false, margin: "-120px 0px" });
  const [currentScenario, setCurrentScenario] = useState(0);
  const [animationStage, setAnimationStage] = useState<AnimationStage>(reducedMotion ? 4 : 0);

  const scenario = CORRECTION_SCENARIOS[currentScenario];
  const staticFinal = reducedMotion || !inView;

  useEffect(() => {
    if (reducedMotion) {
      setAnimationStage(4);
      return;
    }

    if (!inView) {
      setAnimationStage(0);
      return;
    }

    const timer = window.setTimeout(() => {
      setAnimationStage((stage) => {
        if (stage >= 4) {
          setCurrentScenario((index) => (index + 1) % CORRECTION_SCENARIOS.length);
          return 1;
        }
        return (stage + 1) as AnimationStage;
      });
    }, STAGE_DELAYS[animationStage]);

    return () => window.clearTimeout(timer);
  }, [animationStage, inView, reducedMotion]);

  const renderedStage = staticFinal ? 4 : animationStage;
  const showAdvanced = renderedStage >= 3;
  const showScore = renderedStage >= 4;

  return (
    <section ref={containerRef} className="px-5 pt-10">
      <p className="sr-only">
        深度精诊引擎核心推演示例：原句 {scenario.rawText}；进阶版 {scenario.advancedVersion}；诊断包含 {scenario.logicTags.join("、")}；预估档位{" "}
        {scenario.finalScore}；已生成专属 AI 演算母题库。
      </p>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-100/70 lg:h-[560px]">
        <div className="grid gap-0 lg:h-full lg:items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="relative overflow-hidden bg-slate-950 p-6 text-white md:p-8 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.18),transparent_30%)]" />
            <div className="relative flex flex-col gap-8 lg:min-h-0 lg:flex-1 lg:justify-center lg:gap-12">
              <div className="flex max-w-xl flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">AI DIAGNOSTIC ENGINE</p>
                  <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">千万级语料实时演算</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  深度精诊引擎 <span className="font-light text-slate-400">· 核心推演</span>
                </h2>
                <p className="max-w-sm text-sm leading-relaxed text-blue-50/80">
                  先看底层引擎如何精准切除扣分点、重塑高级句式，再将你的作文粘贴至下方获取免费摘要。
                </p>
              </div>

              <div className="relative shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-5 text-slate-950 shadow-2xl shadow-slate-950/30">
                {renderedStage === 1 && !reducedMotion ? (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 right-0 z-10 h-12 bg-gradient-to-b from-transparent via-blue-400/35 to-transparent"
                    initial={{ top: "-20%" }}
                    animate={{ top: "105%" }}
                    transition={{ duration: 1.25, ease: "easeInOut" }}
                  />
                ) : null}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">原句扫描</span>
                  <span className="text-xs font-bold text-slate-400">逐句定位</span>
                </div>
                <HighlightedRawText scenario={scenario} stage={renderedStage} reducedMotion={reducedMotion} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 bg-gradient-to-br from-slate-50 to-blue-50 p-6 md:p-8 lg:h-full lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:gap-4 lg:overflow-hidden lg:p-6">
            <motion.div
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70 lg:p-4"
              variants={LOGIC_VARIANTS}
              initial="hidden"
              animate={renderedStage >= 2 ? "show" : "hidden"}
            >
              <div className="mb-4 flex items-center justify-between lg:mb-3">
                <h3 className="text-lg font-black text-slate-950 lg:text-base">逻辑诊断</h3>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">深度分析</span>
              </div>
              <div className="grid gap-2">
                {scenario.logicTags.map((tag) => (
                  <motion.div
                    key={tag}
                    variants={LOGIC_ITEM_VARIANTS}
                    className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-950 lg:py-2"
                  >
                    {tag}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70 lg:flex lg:flex-col lg:p-4">
              <div className="mb-4 flex items-center justify-between gap-3 lg:mb-3">
                <h3 className="text-lg font-black text-slate-950 lg:text-base">双轨重构</h3>
                <div className="rounded-full bg-slate-100 p-1 text-xs font-black">
                  <span className={`rounded-full px-3 py-1 transition ${showAdvanced ? "text-slate-500" : "bg-white text-blue-700 shadow"}`}>
                    稳妥版
                  </span>
                  <span className={`rounded-full px-3 py-1 transition ${showAdvanced ? "bg-slate-950 text-amber-300 shadow" : "text-slate-500"}`}>
                    进阶版
                  </span>
                </div>
              </div>

              <div className="lg:flex lg:min-h-0 lg:flex-1 lg:items-center">
                <AnimatePresence mode="wait">
                  {showAdvanced ? (
                    <motion.div
                      key="advanced"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: reducedMotion ? 0 : 0.28 }}
                    >
                      <TypewriterText text={scenario.advancedVersion} highlights={scenario.advancedHighlights} active={showAdvanced} reducedMotion={reducedMotion} />
                    </motion.div>
                  ) : (
                    <motion.p
                      key="safe"
                      className="text-lg font-semibold leading-8 text-slate-800 md:text-xl"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {scenario.safeVersion}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showScore ? (
                <motion.div
                  className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-xl shadow-amber-100 lg:p-4"
                  initial={{ scale: reducedMotion ? 1 : 1.5, opacity: 0, y: reducedMotion ? 0 : -10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.35, type: "spring", stiffness: 170, damping: 16 }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Estimated Score</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">高考作文表达升级后预估档位</p>
                    </div>
                    <div className="text-5xl font-black text-slate-950 lg:text-4xl">{scenario.finalScore}</div>
                  </div>
                  <motion.p
                    className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-blue-700 lg:mt-3 lg:py-2"
                    animate={reducedMotion ? undefined : { opacity: [0.72, 1, 0.72] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    已生成专属 AI 演算母题库，生成免费摘要后可查看解锁方案
                  </motion.p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
