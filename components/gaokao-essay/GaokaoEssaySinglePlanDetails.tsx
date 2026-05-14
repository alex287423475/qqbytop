"use client";

type ServiceIcon = "target" | "radar" | "shield" | "rocket" | "puzzle" | "database";

type ServiceItem = {
  title: string;
  description: string;
  icon: ServiceIcon;
  tag: string;
  featured?: boolean;
};

const SERVICE_ITEMS: ServiceItem[] = [
  {
    title: "逐句定位扣分点",
    description: "像用放大镜看试卷。精确到单个单词与标点，不仅告诉你错在哪，直接提供最优改写方案。",
    icon: "target",
    tag: "核心精批",
    featured: true,
  },
  {
    title: "高考维度评分",
    description: "按内容、语言、结构、衔接等维度拆出失分风险，帮你看清哪一块最拖后腿。",
    icon: "radar",
    tag: "评分诊断",
  },
  {
    title: "稳妥版范文",
    description: "匹配 18+ 分保底基准。剔除低级错误，重塑安全、扎实的行文框架。",
    icon: "shield",
    tag: "稳分基准",
  },
  {
    title: "进阶版范文",
    description: "直击 22+ 冲刺档位。注入高级从句、非谓语动词与地道亮点词汇。",
    icon: "rocket",
    tag: "冲刺拔高",
  },
  {
    title: "段落逻辑拆解",
    description: "拒绝中式“流水账”。拆解起承转合，让阅卷老师一眼看到清晰脉络。",
    icon: "puzzle",
    tag: "结构提档",
  },
  {
    title: "AI 演算母题库",
    description: "深度吞吐近 10 年真题语料，反向推演 2026 出题轨迹，锁定 5 大必考母题与高维范文。",
    icon: "database",
    tag: "算力预测",
  },
];

function LinearIcon({ icon, className }: { icon: ServiceIcon; className?: string }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (icon) {
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      );
    case "radar":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M8 19v-6" />
          <path d="M12 19V8" />
          <path d="M16 19v-9" />
          <path d="M20 19V4" />
          <path d="M3 19h18" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.5-4" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M14 4c2.5.4 4.6 2.5 5 5l-5.5 5.5-4-4L14 4Z" />
          <path d="M9.5 10.5 6 11l-2 3 4-.5" />
          <path d="M13.5 14.5 13 18.5l3-2 1-3.5" />
          <path d="M7 17c-1.2.3-2 .9-3 2 1.1-1 1.7-1.8 2-3" />
        </svg>
      );
    case "puzzle":
      return (
        <svg {...common}>
          <path d="M9 3h6v4a2 2 0 1 0 0 4v10H9v-4a2 2 0 1 1 0-4V3Z" />
          <path d="M9 7H5v6h4" />
          <path d="M15 11h4v6h-4" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="7" ry="3" />
          <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
          <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </svg>
      );
  }
}

function ServiceCard({ item, compact = false }: { item: ServiceItem; compact?: boolean }) {
  const cardClass = item.featured
    ? "rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50 px-4 py-4 shadow-sm shadow-amber-100/70"
    : "rounded-xl border border-blue-100 bg-white px-4 py-4 shadow-sm";
  const iconClass = item.featured
    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
    : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  const tagClass = item.featured ? "bg-amber-500 text-white" : "bg-blue-700 text-white";

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <LinearIcon icon={item.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className={compact ? "text-sm font-black text-slate-950" : "text-sm font-black text-slate-950"}>{item.title}</h5>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${tagClass}`}>{item.tag}</span>
          </div>
          <p className={compact ? "mt-2 text-xs leading-5 text-slate-600" : "mt-2 text-sm leading-6 text-slate-600"}>{item.description}</p>
        </div>
      </div>
    </div>
  );
}

export function GaokaoEssaySinglePlanCompact() {
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">99 元抢分包包含</p>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">20 篇深度精诊额度</span>
      </div>

      <div className="mt-3 grid gap-2">
        {SERVICE_ITEMS.slice(0, 2).map((item) => (
          <ServiceCard key={item.title} item={item} compact />
        ))}
      </div>

      <div className="mt-3 grid gap-2">
        {SERVICE_ITEMS.slice(2).map((item) => (
          <ServiceCard key={item.title} item={item} compact />
        ))}
      </div>
    </div>
  );
}

export function GaokaoEssaySinglePlanFull() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
      <h4 className="text-base font-black text-blue-950">99 元最后冲刺抢分包包含</h4>
      <p className="mt-2 text-sm leading-6 text-slate-700">包含 20 篇深度精诊额度；本次付款会立即解锁当前报告，并保留剩余额度给后续作文使用。</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {SERVICE_ITEMS.map((item) => (
          <ServiceCard key={item.title} item={item} />
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">说明：这是 20 篇完整报告额度包，不是无限次、月卡或人工逐篇一对一批改。</p>
    </div>
  );
}
