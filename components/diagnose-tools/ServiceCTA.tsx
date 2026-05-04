"use client";

import Link from "next/link";
import type { ServiceName } from "@/lib/diagnose-tools/types";

const serviceCards: { label: string; service: ServiceName; reason: string }[] = [
  { label: "我只需要英文润色", service: "文书基础润色", reason: "适合结构基本清楚、主要问题在语法、用词和英文自然度的文书。" },
  { label: "我需要重写结构和逻辑", service: "文书深度优化", reason: "适合主题不清、经历顺序松散或段落之间缺少递进的初稿。" },
  { label: "我不确定 PS/SOP 怎么写", service: "SOP / PS 结构重写", reason: "适合文书类型不确定、动机和项目匹配需要重新搭建的情况。" },
  { label: "我还有 CV、推荐信、成绩单", service: "申请材料包审核", reason: "适合需要同时检查多份申请材料是否互相支撑的申请者。" },
  { label: "我还需要英文简历一起优化", service: "英文简历优化", reason: "适合文书经历和英文 CV 需要统一表达、补强成果呈现的用户。" },
];

export function ServiceCTA({
  primaryService,
}: {
  primaryService?: ServiceName;
}) {
  return (
    <section className="essay-cta-block">
      <div className="essay-section-heading">
        <p>下一步服务分流</p>
        <h2>根据问题选择解决方案</h2>
      </div>
      <div className="essay-service-grid">
        {serviceCards.map((card) => {
          const href = `/tools/study-abroad-essay-check/request?service=${encodeURIComponent(card.service)}`;

          return (
            <Link
              key={card.service}
              href={href}
              className={`essay-service-card ${card.service === primaryService ? "is-primary" : ""}`}
            >
              <span>{card.label}</span>
              <strong>{card.service}</strong>
              <small>{card.reason}</small>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
