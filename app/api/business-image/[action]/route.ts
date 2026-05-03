import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiBaseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1");
const reportModel = process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5.5";
const profileCopyModel = process.env.OPENAI_PROFILE_COPY_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5.5";
const imageModel = process.env.OPENAI_IMAGE_GENERATION_MODEL || "gpt-image-2";
const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 60000);
const imageTimeoutMs = Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 55000);
const referenceImageMax = Number(process.env.REFERENCE_IMAGE_MAX || 1);
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFrom = process.env.RESEND_FROM || "";
const leadNotifyEmail = process.env.LEAD_NOTIFY_EMAIL || "";

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
] as const;

type Payload = Record<string, unknown>;

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizeBaseUrl(value: string) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function sanitize(value: unknown, fallback = "", max = 180) {
  const text = String(value || fallback).replace(/[<>]/g, "").trim();
  return text.slice(0, max);
}

function contextFrom(payload: Payload) {
  return {
    role: sanitize(payload.role, "跨境服务顾问", 80),
    audience: sanitize(payload.audience, "海外品牌方 / 外贸客户", 100),
    scenarioName: sanitize(payload.scenarioName, "LinkedIn 头像", 80),
    goals: Array.isArray(payload.goals) ? payload.goals.map((item) => sanitize(item, "", 60)).filter(Boolean) : [],
  };
}

function fallbackDiagnosis(payload: Payload, source = "demo") {
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
    source,
    context,
  };
}

function fallbackStandardReport(payload: Payload) {
  const context = contextFrom(payload);
  return paidModules.map((title, index) => ({
    title,
    priority: index < 3 || index === 5 || index === 7 || index === 11 ? "高" : "中",
    advice: `${title}需要和当前照片中的${context.role}定位保持一致，重点让${context.audience}快速判断你的专业边界、可信度和沟通风格。`,
    action: `围绕当前照片调整${title}相关元素，保留真实本人特征，减少无关背景、夸张姿态和模糊业务表达。`,
  }));
}

function fallbackProfessionalCopy(payload: Payload) {
  const profile = (payload.profile || {}) as Payload;
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

function buildReferences(payload: Payload, count: number) {
  const context = contextFrom(payload);
  return referenceScenes.slice(0, count).map(([label, title, description]) => ({
    label,
    title,
    description,
    prompt: [
      `Create a professional business portrait reference for a ${context.role}.`,
      `Scene: ${title}.`,
      "If a source photo is provided, preserve the same person's real facial identity and facial features.",
      "Keep a clean, credible cross-border business style.",
      `Target audience: ${context.audience}.`,
      "Avoid glamour, fantasy, over-retouching, medical claims, or identity changes.",
    ].join(" "),
    imageUrl: "",
    imageError: "图片生成尚未返回，可点击重新生成此图。",
    imageMode: "prompt_only",
  }));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonText(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned || "{}");
}

async function chatJson(prompt: string, imageData?: string, model = reportModel) {
  if (!openaiApiKey) throw new Error("OPENAI_API_KEY is not configured");
  const content: unknown[] = [{ type: "text", text: prompt }];
  if (imageData?.startsWith("data:image/")) {
    content.push({ type: "image_url", image_url: { url: imageData } });
  }

  const response = await fetchWithTimeout(`${openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1800,
    }),
  }, aiTimeoutMs);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  return parseJsonText(data.choices?.[0]?.message?.content || "{}");
}

async function createDiagnosis(payload: Payload) {
  const context = contextFrom(payload);
  const prompt = [
    "你是商务形象顾问，只能基于用户上传照片中可见的非敏感视觉信息，给出商务形象和跨文化信任感建议。",
    "禁止推断或评价年龄、种族、民族、健康、面相、命运、性吸引力、宗教、政治倾向等敏感属性。",
    "不要做医学美容、健康诊断或颜值打分。评分只代表商务场景中的信任感和专业表达完整度。",
    `使用场景：${context.scenarioName}`,
    `用户身份：${context.role}`,
    `目标客户：${context.audience}`,
    `用户目标：${context.goals.join("、") || "商务形象优化"}`,
    "只输出 JSON：score 数字 0-100；issue 字符串；direction 字符串；summary 字符串；quickInsights 正好 3 条字符串；paidModules 正好 12 条字符串。",
  ].join("\n");

  try {
    const report = await chatJson(prompt, String(payload.imageData || ""), reportModel);
    return { ...fallbackDiagnosis(payload, "openai"), ...report, paidModules, source: "openai" };
  } catch {
    return fallbackDiagnosis(payload, "demo");
  }
}

async function createStandardReport(payload: Payload) {
  const context = contextFrom(payload);
  const prompt = [
    "你是海外商务形象顾问。请基于用户照片诊断上下文生成 12 项标准报告。",
    "每一项必须和照片使用、照片呈现或照片在 LinkedIn/官网/展会等触点中的应用相关。",
    `用户身份：${context.role}`,
    `目标客户：${context.audience}`,
    `基础诊断：${JSON.stringify(payload.report || {})}`,
    `固定模块：${paidModules.join("、")}`,
    "只输出 JSON：items 为数组，正好 12 项。每项包含 title、priority、advice、action。priority 只能是 高/中/低。",
  ].join("\n");

  try {
    const data = await chatJson(prompt, String(payload.imageData || ""), reportModel);
    const items = Array.isArray(data.items) ? data.items : data.standardReport;
    if (Array.isArray(items) && items.length >= 12) return items.slice(0, 12);
  } catch {
    // Fall through to deterministic report.
  }
  return fallbackStandardReport(payload);
}

async function createProfessionalCopy(payload: Payload) {
  const profile = (payload.profile || {}) as Payload;
  const context = contextFrom(payload);
  const fallback = fallbackProfessionalCopy(payload);
  const prompt = [
    "You are a senior English business copywriter for cross-border professional service providers.",
    "Generate polished English profile copy only. Do not output Chinese characters, pinyin, markdown, explanations, or extra keys.",
    "The user may provide Chinese input. Translate and adapt it into natural business English instead of copying it.",
    `Name: ${sanitize(profile.name, "Your Name", 80)}`,
    `Role/title: ${sanitize(profile.title, context.role, 120)}`,
    `Target clients: ${context.audience}`,
    `Services: ${sanitize(profile.services, "translation, localization, and cross-border documentation support", 220)}`,
    `Strengths: ${sanitize(profile.strengths, "clear communication, reliable delivery, and cross-cultural business context", 220)}`,
    `Call to action: ${sanitize(profile.cta, "Book a consultation", 160)}`,
    "Return JSON exactly with these string fields: headline, about, websiteAbout, signature.",
  ].join("\n");

  try {
    const data = await chatJson(prompt, undefined, profileCopyModel);
    const copy = {
      headline: sanitize(data.headline, fallback.headline, 240),
      about: sanitize(data.about, fallback.about, 800),
      websiteAbout: sanitize(data.websiteAbout, fallback.websiteAbout, 800),
      signature: sanitize(data.signature, fallback.signature, 240),
    };
    return Object.values(copy).some((value) => /[\u3400-\u9fff]/.test(value)) ? fallback : copy;
  } catch {
    return fallback;
  }
}

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
  return new Blob([bytes], { type: match[1] });
}

function extractImageUrl(data: any) {
  const image = data?.data?.[0];
  if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`;
  if (image?.url) return image.url;
  return "";
}

async function generateImage(prompt: string, imageData?: string) {
  if (!openaiApiKey) throw new Error("OPENAI_API_KEY is not configured");

  if (imageData?.startsWith("data:image/")) {
    const form = new FormData();
    form.set("model", imageModel);
    form.set("prompt", prompt);
    form.set("size", "1024x1024");
    form.set("n", "1");
    form.set("image", dataUrlToBlob(imageData), "source.png");

    const editResponse = await fetchWithTimeout(`${openaiBaseUrl}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}` },
      body: form,
    }, imageTimeoutMs);
    const editData = await editResponse.json().catch(() => ({}));
    if (editResponse.ok) return extractImageUrl(editData);
  }

  const response = await fetchWithTimeout(`${openaiBaseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: imageModel, prompt, size: "1024x1024", n: 1 }),
  }, imageTimeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Image HTTP ${response.status}`);
  return extractImageUrl(data);
}

async function attachImages(references: ReturnType<typeof buildReferences>, imageData?: string) {
  const limit = Math.max(0, Math.min(referenceImageMax, references.length));
  for (let index = 0; index < limit; index += 1) {
    try {
      const imageUrl = await generateImage(references[index].prompt, imageData);
      references[index].imageUrl = imageUrl;
      references[index].imageError = imageUrl ? "" : "图片接口暂未返回可用图片。";
      references[index].imageMode = imageData ? "source_edit" : "generation";
    } catch (error) {
      references[index].imageError = error instanceof Error ? error.message : "图片生成失败。";
    }
  }
  return references;
}

async function handleLead(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const payload = isMultipart ? Object.fromEntries((await request.formData()).entries()) : await request.json().catch(() => ({}));
  const contact = sanitize(payload.contact, "", 120);
  if (!contact) return json({ ok: false, error: "contact_required" }, 400);

  const id = crypto.randomUUID();
  if (resendApiKey && resendFrom && leadNotifyEmail) {
    await fetchWithTimeout("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: leadNotifyEmail,
        subject: `海外商务形象定制需求 ${id}`,
        text: Object.entries(payload).map(([key, value]) => `${key}: ${String(value).slice(0, 500)}`).join("\n"),
      }),
    }, 20000).catch(() => null);
  }

  return json({ ok: true, id, message: "需求已提交。" });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action === "sample-admin") return json({ ok: false });
  return json({ ok: false, error: "not_found" }, 404);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action === "leads") return handleLead(request);
  if (action === "standard-sample" || action === "professional-sample") {
    return json({ ok: false, error: "sample_write_disabled_on_production" }, 403);
  }

  const payload = await request.json().catch(() => ({}));
  if (action === "diagnose") return json(await createDiagnosis(payload));

  if (action === "generate-reference") {
    const plan = sanitize(payload.plan, "standard", 20);
    const count = plan === "pro" ? 6 : 2;
    const standardReport = await createStandardReport(payload);
    const professionalCopy = plan === "pro" ? await createProfessionalCopy(payload) : null;
    const references = await attachImages(buildReferences(payload, count), String(payload.imageData || ""));
    const generatedCount = references.filter((item) => item.imageUrl).length;

    return json({
      message: generatedCount
        ? `已生成 ${generatedCount}/${references.length} 张参考形象图。`
        : "报告和提示词已生成，图片接口暂未返回可用图片。",
      standardReport,
      references,
      professionalCopy,
      imageStatus: generatedCount === references.length ? "generated" : generatedCount > 0 ? "partial" : "prompt_only",
      generatedCount,
      totalImageCount: references.length,
      usesSourceImage: Boolean(payload.imageData),
    });
  }

  if (action === "generate-single-reference") {
    const reference = buildReferences(payload, 1)[0];
    const [withImage] = await attachImages([reference], String(payload.imageData || ""));
    return json(withImage);
  }

  return json({ ok: false, error: "not_found" }, 404);
}
