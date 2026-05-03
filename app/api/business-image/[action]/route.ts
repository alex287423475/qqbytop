import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paidModules = [
  "头像构图与裁切",
  "表情与视线",
  "服装色彩",
  "背景与光线",
  "姿态与肩颈线条",
  "跨文化信任感",
  "行业身份匹配",
  "LinkedIn 首屏表达",
  "英文个人简介",
  "官网 About 页面",
  "展会/名片场景",
  "30 天执行清单",
];

const referenceScenes = [
  ["LinkedIn", "商务头像参考", "用于 LinkedIn 头像和个人资料首屏，强调清晰面部、简洁背景和可信顾问感。"],
  ["Website", "官网顾问形象", "用于官网 About 或顾问介绍区域，强调半身构图、办公场景和专业服务可信度。"],
  ["Expo", "展会洽谈形象", "用于展会资料、名片和线下会面场景，强调易接近、可识别和商务沟通感。"],
  ["Founder", "创始人介绍图", "用于创始人故事、媒体介绍或品牌说明，强调稳定、负责和个人品牌记忆点。"],
  ["Profile", "英文简介配图", "用于英文 About、服务简介或个人资料页，强调照片与英文文案的一致性。"],
  ["Social", "商务社媒头像", "用于微信、X、社媒封面等触点，强调小尺寸识别度和统一商务形象。"],
];

function corsHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: corsHeaders() });
}

function sanitize(value: unknown, fallback = "", max = 180) {
  const text = String(value || fallback).replace(/[<>]/g, "").trim();
  return text.slice(0, max);
}

function contextFrom(payload: Record<string, unknown>) {
  return {
    role: sanitize(payload.role, "跨境服务顾问", 80),
    audience: sanitize(payload.audience, "海外品牌方 / 外贸客户", 100),
    scenarioName: sanitize(payload.scenarioName, "LinkedIn 头像", 80),
  };
}

function buildDiagnosis(payload: Record<string, unknown>) {
  const context = contextFrom(payload);
  return {
    score: 76,
    issue: "照片中的商务定位信息还不够集中",
    direction: `面向${context.audience}的清爽可信顾问型形象`,
    summary: `建议围绕当前照片的构图、背景、服装和英文表达统一强化，让${context.role}身份在海外客户第一眼更容易被理解。`,
    quickInsights: [
      "优先检查头像裁切是否突出面部和肩颈线条，避免背景或生活化元素抢走注意力。",
      `服装和背景应服务于“${context.role}”定位，建议使用低饱和商务色和干净办公环境。`,
      `英文简介需要直接说明服务对象、交付内容和结果，降低${context.audience}的首次咨询阻力。`,
    ],
    paidModules,
    source: "demo",
    context,
  };
}

function buildStandardReport(payload: Record<string, unknown>) {
  const context = contextFrom(payload);
  const titles = paidModules;
  return titles.map((title, index) => ({
    title,
    priority: index < 3 || index === 5 || index === 7 || index === 11 ? "高" : "中",
    advice: `${title}需要和当前照片中的${context.role}定位保持一致，重点让${context.audience}快速判断你的专业边界、可信度和沟通风格。`,
    action: `围绕当前照片调整${title}相关元素，保留真实本人特征，减少无关背景、夸张姿态和模糊业务表达。`,
  }));
}

function buildReferences(payload: Record<string, unknown>, count: number) {
  const context = contextFrom(payload);
  return referenceScenes.slice(0, count).map(([label, title, description]) => ({
    label,
    title,
    description,
    prompt: `Create a professional business portrait reference for a ${context.role}. Scene: ${title}. Keep the person's real facial identity if a source photo is provided. Clean composition, credible cross-border business style, suitable for ${context.audience}.`,
    imageUrl: "",
    imageError: "当前线上版本已保留提示词，图片生成接口需配置生产环境图像模型后启用。",
    imageMode: "prompt_only",
  }));
}

function buildProfessionalCopy(payload: Record<string, unknown>) {
  const profile = (payload.profile || {}) as Record<string, unknown>;
  const name = sanitize(profile.name, "Your Name", 80);
  const title = sanitize(profile.title, "Cross-border Business Consultant", 120);
  const services = sanitize(profile.services, "translation, localization, and cross-border communication support", 200);
  const strengths = sanitize(profile.strengths, "clear delivery, compliance awareness, and practical communication", 200);
  const cta = sanitize(profile.cta, "Contact me to discuss your project.", 160);
  return {
    headline: `${title} | Helping overseas clients with ${services}`,
    about: `${name} helps overseas clients handle ${services}. The work focuses on ${strengths}, so clients can communicate clearly, reduce cross-border friction, and move projects forward with confidence. ${cta}`,
    websiteAbout: `${name} provides ${services} for international business teams. The service is designed for clients who need accurate communication, reliable delivery, and a professional overseas-facing presence.`,
    signature: `${name} | ${title} | ${services}`,
  };
}

async function handleLead(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const payload = isMultipart ? Object.fromEntries((await request.formData()).entries()) : await request.json().catch(() => ({}));
  const contact = sanitize(payload.contact, "", 120);
  if (!contact) return json({ ok: false, error: "contact_required" }, 400);
  return json({
    ok: true,
    id: crypto.randomUUID(),
    message: "需求已提交。线上生产环境可继续接入 Resend/SMTP 后自动邮件通知。",
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action === "sample-admin") return json({ ok: false });
  return json({ ok: false, error: "not_found" }, 404);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action === "leads") return handleLead(request);

  const payload = await request.json().catch(() => ({}));
  if (action === "diagnose") return json(buildDiagnosis(payload));

  if (action === "generate-reference") {
    const plan = sanitize(payload.plan, "standard", 20);
    const count = plan === "pro" ? 6 : 2;
    const references = buildReferences(payload, count);
    return json({
      message: plan === "pro" ? "专业形象包已生成报告和英文文案，图片提示词已保留。" : "标准报告已生成，参考图提示词已保留。",
      standardReport: buildStandardReport(payload),
      references,
      professionalCopy: plan === "pro" ? buildProfessionalCopy(payload) : null,
      imageStatus: "prompt_only",
      generatedCount: 0,
      totalImageCount: references.length,
      usesSourceImage: false,
    });
  }

  if (action === "generate-single-reference") {
    const [reference] = buildReferences(payload, 1);
    return json({ ...reference, imageStatus: "prompt_only" });
  }

  return json({ ok: false, error: "not_found" }, 404);
}
