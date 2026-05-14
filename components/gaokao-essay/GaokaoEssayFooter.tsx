import Link from "next/link";
import type { ReactNode } from "react";
import {
  GAOKAO_ESSAY_COMPANY_NAME,
  GAOKAO_ESSAY_ICP,
  GAOKAO_ESSAY_SUPPORT_TICKET_URL,
  GAOKAO_ESSAY_TOOL_BASE_PATH,
} from "@/lib/gaokao-essay/constants";

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a className="text-sm font-semibold text-slate-300 transition hover:text-white" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link className="text-sm font-semibold text-slate-300 transition hover:text-white" href={href}>
      {children}
    </Link>
  );
}

export function GaokaoEssayFooter() {
  const refundHref = `${GAOKAO_ESSAY_TOOL_BASE_PATH}/refund-policy`;
  const privacyHref = `${GAOKAO_ESSAY_TOOL_BASE_PATH}/privacy-policy`;
  const ticketHref = GAOKAO_ESSAY_SUPPORT_TICKET_URL || refundHref;

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Gaokao Essay AI</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">2026 高考英语智能诊断引擎</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            基于千万级真实语料构建，对标最新高考阅卷大纲。全天候自动化秒级批改，彻底规避人工主观偏差。
          </p>
          <p className="mt-5 text-xs text-slate-500">© 2026 {GAOKAO_ESSAY_COMPANY_NAME} 版权所有</p>
          <a className="mt-2 inline-block text-xs text-slate-500 transition hover:text-slate-300" href={GAOKAO_ESSAY_ICP.href} target="_blank" rel="noreferrer">
            {GAOKAO_ESSAY_ICP.text}
          </a>
        </div>

        <nav aria-label="高考英语作文诊断工具底部规则链接" className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <FooterLink href={refundHref}>服务与退款规则</FooterLink>
          <FooterLink href={privacyHref}>数据与隐私安全</FooterLink>
          <FooterLink href={ticketHref}>🛡️ 售后保障工单</FooterLink>
          <p className="pt-2 text-xs leading-5 text-slate-500">
            纯血 AI 自动化引擎，不提供人工辅导。如遇支付异常或额度未到账，请自助提交工单，系统将于 12 小时内核实并处理。
          </p>
        </nav>
      </div>
    </footer>
  );
}
