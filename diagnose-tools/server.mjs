import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { appendFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import net from "node:net";
import { extname, join, normalize, resolve, sep } from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const rootPath = resolve(root);
const standardSamplePath = join(root, "data", "standard-report-sample.json");
const professionalSamplePath = join(root, "data", "professional-package-sample.json");

loadEnvFile(join(root, ".env.local"));

const port = Number(process.env.PORT || 4188);
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiBaseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1");
const openaiModel = process.env.OPENAI_IMAGE_DIAGNOSIS_MODEL || "gpt-4.1-mini";
const imageGenerationModel = process.env.OPENAI_IMAGE_GENERATION_MODEL || openaiModel;
const textGenerationModel = process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_PROFILE_COPY_MODEL || "gpt-5.5";
const reportModel = process.env.OPENAI_REPORT_MODEL || textGenerationModel;
const profileCopyModel = process.env.OPENAI_PROFILE_COPY_MODEL || textGenerationModel;
const sampleAdminToken = process.env.SAMPLE_ADMIN_TOKEN || "";
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || smtpUser;
const leadNotifyEmail = process.env.LEAD_NOTIFY_EMAIL || "";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFrom = process.env.RESEND_FROM || smtpFrom;
const referenceImageMax = Number(process.env.REFERENCE_IMAGE_MAX || 2);
const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 90000);
const imageTimeoutMs = Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 300000);
const imageRetryAttempts = Number(process.env.OPENAI_IMAGE_RETRY_ATTEMPTS || 4);
const imageRetryDelayMs = Number(process.env.OPENAI_IMAGE_RETRY_DELAY_MS || 20000);
let imageRequestQueue = Promise.resolve();
const jsonBodyLimit = Number(process.env.JSON_BODY_LIMIT || 12_000_000);
const multipartBodyLimit = Number(process.env.MULTIPART_BODY_LIMIT || 22_000_000);
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 20);
const rateBuckets = new Map();
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || `http://127.0.0.1:${port},http://localhost:${port}`)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

process.on("uncaughtException", (error) => {
  console.error(`uncaughtException: ${error.stack || error.message || error}`);
});

process.on("unhandledRejection", (error) => {
  console.error(`unhandledRejection: ${error?.stack || error?.message || error}`);
});

const scenarioTemplates = {
  linkedin: {
    score: 76,
    issue: "背景与服装信息不足",
    direction: "清爽可信的顾问型形象",
    summary: "适合先从头像背景、服装颜色和英文简介定位三处改起。",
    quickInsights: [
      "头像需要减少生活化背景，让视线集中在面部和肩颈线条，适合 LinkedIn 与官网 About 页面。",
      "服装建议选择深海军蓝、冷灰或米白衬衫，避免过强花纹，强化专业服务感。",
      "英文简介建议突出行业、服务对象和结果，例如帮助海外客户降低沟通与合规成本。"
    ]
  },
  founder: {
    score: 82,
    issue: "个人品牌记忆点不够明确",
    direction: "稳定、可信、有判断力的创始人形象",
    summary: "适合把个人照片、业务定位和创始人叙事放在同一套表达里。",
    quickInsights: [
      "半身构图比大头照更适合创始人身份，可以保留办公、项目或行业场景线索。",
      "服装建议选择有质感的外套或针织层次，形成成熟但不压迫的商务气质。",
      "英文简介应从个人能力转向业务结果，突出跨境交付、风险控制和长期合作。"
    ]
  },
  expo: {
    score: 73,
    issue: "现场洽谈识别度偏弱",
    direction: "干练、易接近、可快速建立信任",
    summary: "展会场景更看重识别度、亲和力和扫码后 5 秒内的价值表达。",
    quickInsights: [
      "展会头像需要更强识别度，建议使用明亮背景、清晰轮廓和轻微微笑。",
      "穿搭重点是可长时间见客户的舒适商务风，不建议过于正式或过度休闲。",
      "资料页可搭配一句英文定位语，让客户在扫码后快速理解你能解决什么问题。"
    ]
  },
  consultant: {
    score: 79,
    issue: "专家感和亲和力需要平衡",
    direction: "专业咨询顾问形象",
    summary: "顾问官网头像要避免证件照感，同时保留专业边界和可信交付感。",
    quickInsights: [
      "官网照片建议采用自然光和中近景，避免证件照感，强调真实可信。",
      "适合选择低饱和色服装，配合简洁背景，减少与网站主视觉的冲突。",
      "英文介绍应包含服务边界、行业经验和典型交付物，降低客户首次咨询阻力。"
    ]
  }
};

const scenarioNames = {
  linkedin: "LinkedIn 头像",
  founder: "出海创始人",
  expo: "展会洽谈",
  consultant: "顾问官网"
};

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
  "30 天执行清单"
];

const referenceScenarioSpecs = {
  LinkedIn: {
    scene: "LinkedIn 头像首屏",
    composition: "胸像或半身近景，面部清晰，肩颈线条稳定，留出适合圆形头像裁切的空间",
    background: "浅灰、米白或柔和办公室背景，背景信息少，不能抢走人物注意力",
    styling: "深色西装、浅色衬衫或低饱和商务上装，整体简洁可信",
    expression: "自然正视镜头，轻微微笑，表达可靠、可沟通、专业边界清楚",
    avoid: "避免展会背景、夸张姿势、强滤镜、过度修图和社交写真感"
  },
  Website: {
    scene: "官网 About / 顾问介绍页",
    composition: "半身构图，人物略偏一侧，保留可放网页标题或介绍文字的留白",
    background: "明亮办公室、会议室或干净工作场景，能支撑顾问型服务可信度",
    styling: "正式但不过度压迫的商务服装，颜色要能融入官网视觉",
    expression: "亲和但克制，像可以预约咨询的专业服务者",
    avoid: "避免大头证件照、纯自拍感、背景过空或与网站页面难以搭配"
  },
  Expo: {
    scene: "展会洽谈和线下商务会面",
    composition: "中景或半身站姿，身体姿态开放，适合放在展会资料、名片或扫码落地页",
    background: "轻微虚化的展会、会议、商务洽谈环境，有现场感但不杂乱",
    styling: "便于长时间接待客户的干练商务装，可加入胸牌、资料夹等轻量线索",
    expression: "更主动、更易接近，像正在准备与客户开始对话",
    avoid: "避免过于严肃、静态证件照、背景人群过多、品牌 logo 侵权元素"
  },
  Founder: {
    scene: "创始人介绍图 / 品牌故事页",
    composition: "半身或环境人像，画面要有稳定掌控感，适合用于创始人故事和媒体介绍",
    background: "办公室、书架、工作台或行业相关但干净的空间，体现判断力和长期经营感",
    styling: "有质感的外套、衬衫或针织层次，比普通头像更有个人品牌记忆点",
    expression: "沉稳、自信、不过度亲昵，体现可信负责人气质",
    avoid: "避免普通员工照、过度销售感、过度年轻化写真和浮夸成功学风格"
  },
  Profile: {
    scene: "英文简介配图 / 个人资料页",
    composition: "横版或宽松半身构图，适合和英文 About、服务简介并排展示",
    background: "干净的工作场景或浅色空间，保留文字排版留白",
    styling: "清爽、有国际商务感的服装，减少本地生活照痕迹",
    expression: "可信、清晰、平易近人，服务对象能快速理解这是专业介绍图",
    avoid: "避免过近裁切、复杂背景、生活照感和与英文文案不匹配的造型"
  },
  Social: {
    scene: "商务社媒头像 / 社交平台封面头像",
    composition: "头像识别度更强，面部和上半身比例清晰，小尺寸也能看清",
    background: "简洁但略有品牌感的纯色、浅色办公或柔和几何背景",
    styling: "比 LinkedIn 略轻盈，但仍保持商务可信，适合微信、X、社媒头像",
    expression: "更有亲和力和记忆点，适合被快速识别和点击",
    avoid: "避免娱乐化写真、过强美颜、夸张背景和不适合商务客户的姿态"
  }
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "issue", "direction", "summary", "quickInsights", "paidModules"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    issue: { type: "string" },
    direction: { type: "string" },
    summary: { type: "string" },
    quickInsights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" }
    },
    paidModules: {
      type: "array",
      minItems: 12,
      maxItems: 12,
      items: { type: "string" }
    }
  }
};

const professionalCopySchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "about", "websiteAbout", "signature"],
  properties: {
    headline: { type: "string" },
    about: { type: "string" },
    websiteAbout: { type: "string" },
    signature: { type: "string" }
  }
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const isApiRequest = url.pathname.startsWith("/api/");

    if (request.method === "OPTIONS" && isApiRequest) {
      if (!isAllowedOrigin(request)) {
        return sendJson(response, { ok: false, error: "origin_not_allowed" }, 403);
      }
      response.writeHead(204, securityHeaders());
      return response.end();
    }

    if (isApiRequest && !isAllowedOrigin(request)) {
      return sendJson(response, { ok: false, error: "origin_not_allowed" }, 403);
    }

    if (isApiRequest && request.method === "POST" && !takeRateLimitSlot(request, url.pathname)) {
      return sendJson(response, { ok: false, error: "rate_limited" }, 429);
    }

    if (request.method === "POST" && url.pathname === "/api/diagnose") {
      const payload = await readJson(request);
      const report = await buildReport(payload);
      return sendJson(response, report);
    }

    if (request.method === "POST" && url.pathname === "/api/generate-reference") {
      const payload = await readJson(request);
      return sendJson(response, await generateReferencePack(payload));
    }

    if (request.method === "POST" && url.pathname === "/api/generate-single-reference") {
      const payload = await readJson(request);
      return sendJson(response, await generateSingleReference(payload));
    }

    if (request.method === "GET" && url.pathname === "/api/standard-sample") {
      return sendJson(response, await readStandardSample());
    }

    if (request.method === "GET" && url.pathname === "/api/sample-admin") {
      return sendJson(response, { ok: isSampleAdmin(request) });
    }

    if (request.method === "POST" && url.pathname === "/api/standard-sample") {
      if (!isSampleAdmin(request)) {
        return sendJson(response, { ok: false, error: "admin_required" }, 403);
      }
      const payload = await readJson(request);
      const sample = normalizeStandardSample(payload);
      await mkdir(join(root, "data"), { recursive: true });
      await writeFile(standardSamplePath, JSON.stringify(sample, null, 2), "utf8");
      return sendJson(response, { ok: true, savedAt: sample.savedAt });
    }

    if (request.method === "GET" && url.pathname === "/api/professional-sample") {
      return sendJson(response, await readProfessionalSample());
    }

    if (request.method === "POST" && url.pathname === "/api/professional-sample") {
      if (!isSampleAdmin(request)) {
        return sendJson(response, { ok: false, error: "admin_required" }, 403);
      }
      const payload = await readJson(request);
      const sample = normalizeProfessionalSample(payload);
      await mkdir(join(root, "data"), { recursive: true });
      await writeFile(professionalSamplePath, JSON.stringify(sample, null, 2), "utf8");
      return sendJson(response, { ok: true, savedAt: sample.savedAt });
    }

    if (request.method === "POST" && url.pathname === "/api/leads") {
      const payload = await readLeadPayload(request);
      const leadId = randomUUID();
      const record = {
        ...pickLeadFields(payload),
        uploadedFiles: await saveLeadUploads(leadId, payload.files || []),
        id: leadId,
        createdAt: new Date().toISOString()
      };
      await mkdir(join(root, "data"), { recursive: true });
      await appendFile(join(root, "data", "leads.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
      notifyLeadByEmail(record).catch((error) => {
        console.warn(`Lead email notification failed: ${error.message}`);
      });
      return sendJson(response, { ok: true, id: record.id });
    }

    if (request.method !== "GET") {
      response.writeHead(405);
      return response.end("Method not allowed");
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    const statusCode = Number(error.statusCode || error.status || 500);
    response.writeHead(statusCode, securityHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    response.end(JSON.stringify({ error: "internal_error", detail: String(error.message || error) }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Business image MVP running at http://127.0.0.1:${port}/`);
  console.log(openaiApiKey ? `AI mode enabled with ${openaiModel}.` : "Demo mode: set OPENAI_API_KEY to enable real image diagnosis.");
  console.log(`Report text model: ${reportModel}`);
  console.log(`Profile copy model: ${profileCopyModel}`);
});

async function buildReport(payload = {}) {
  const scenario = getScenario(payload.scenario);
  const context = getContext(payload);

  if (openaiApiKey && isDataUrlImage(payload.imageData)) {
    try {
      const report = await createAIReport(payload.imageData, scenario, context);
      return normalizeReport(report, context, "openai");
    } catch (error) {
      console.warn(`OpenAI diagnosis failed, falling back to demo template: ${error.message}`);
    }
  }

  return normalizeReport(buildTemplateReport(scenario, context), context, "demo");
}

async function createAIReport(imageData, scenario, context) {
  if (openaiBaseUrl === "https://api.openai.com/v1") {
    return createResponsesReport(imageData, scenario, context);
  }

  return createChatCompletionsReport(imageData, scenario, context);
}

async function createResponsesReport(imageData, scenario, context) {
  const prompt = [
    "你是一个商务形象顾问，只能基于用户上传照片中可见的非敏感视觉信息，给出商务形象和跨文化信任感建议。",
    "禁止推断或评价年龄、种族、民族、健康、面相、命运、性吸引力、宗教、政治倾向等敏感属性。",
    "不要做医学美容、健康诊断或颜值打分。评分只代表商务场景中的信任感和专业表达完整度。",
    `使用场景：${scenarioNames[scenario]}`,
    `用户身份：${context.role}`,
    `目标客户：${context.audience}`,
    `用户目标：${context.goals.join("、") || "商务形象优化"}`,
    "请输出简体中文 JSON。quickInsights 必须正好 3 条，每条要具体、可执行；paidModules 必须正好 12 条，沿用产品报告模块名称。"
  ].join("\n");

  const response = await fetchWithTimeout(`${openaiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: reportModel,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageData }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "business_image_report",
          schema: reportSchema,
          strict: true
        }
      },
      max_output_tokens: 1200
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI HTTP ${response.status}`);
  }

  const text = extractResponseText(data);
  if (!text) throw new Error("OpenAI response did not include text output");
  return JSON.parse(text);
}

async function createChatCompletionsReport(imageData, scenario, context) {
  const prompt = [
    "你是一个商务形象顾问，只能基于用户上传照片中可见的非敏感视觉信息，给出商务形象和跨文化信任感建议。",
    "禁止推断或评价年龄、种族、民族、健康、面相、命运、性吸引力、宗教、政治倾向等敏感属性。",
    "不要做医学美容、健康诊断或颜值打分。评分只代表商务场景中的信任感和专业表达完整度。",
    `使用场景：${scenarioNames[scenario]}`,
    `用户身份：${context.role}`,
    `目标客户：${context.audience}`,
    `用户目标：${context.goals.join("、") || "商务形象优化"}`,
    "请只输出 JSON，不要输出 Markdown 或解释文字。",
    "JSON 字段必须为：score 数字 0-100；issue 字符串；direction 字符串；summary 字符串；quickInsights 正好 3 条字符串；paidModules 正好 12 条字符串。"
  ].join("\n");

  const body = {
    model: reportModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageData } }
        ]
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 1200
  };

  let response = await fetchWithTimeout(`${openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify(body)
  });

  let data = await response.json();
  if (!response.ok && /response_format|json_object/i.test(data.error?.message || "")) {
    delete body.response_format;
    response = await fetchWithTimeout(`${openaiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(body)
    });
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data.error?.message || `Chat completions HTTP ${response.status}`);
  }

  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Chat completions response did not include content");
  return JSON.parse(stripMarkdownJson(text));
}

function buildTemplateReport(scenario, context) {
  const template = scenarioTemplates[scenario];
  return {
    ...template,
    quickInsights: template.quickInsights.map((line) =>
      line
        .replace("跨境交付", `${context.role}交付`)
        .replace("海外客户", context.audience)
    ),
    paidModules
  };
}

async function generateReferencePack(payload = {}) {
  const pack = await buildReferencePack(payload);
  if (payload.previewOnly) return pack;
  if (!openaiApiKey) return pack;
  const usesSourceImage = Boolean(parseDataUrlImage(payload.imageData));

  const limit = getReferenceImageLimit(pack.plan, pack.references.length);
  if (!limit) return pack;

  const attempts = [];
  for (const item of pack.references.slice(0, limit)) {
    try {
      attempts.push({ ok: true, item: { ...item, ...(await createReferenceImageWithRetry(item.prompt, payload.imageData)) } });
    } catch (error) {
      console.warn(`Reference image failed for ${item.label}: ${error.message}`);
      attempts.push({ ok: false, item: { ...item, imageError: publicImageError(error) } });
    }
    await delay(800);
  }

  const generatedCount = attempts.filter((item) => item.ok).length;
  const references = [
    ...attempts.map((item) => item.item),
    ...pack.references.slice(limit)
  ];
  const totalImageCount = pack.references.length;
  const imageStatus = generatedCount === 0
    ? "prompt_only"
    : generatedCount === totalImageCount
      ? "generated"
      : "partial";
  const identityPreserved = references.some((item) => item.imageMode === "source_edit");
  const hasIdentityFallback = references.some((item) => item.imageMode === "prompt_generation" && item.identityWarning);
  const message = [
    buildReferenceMessage(pack.message, imageStatus, generatedCount, totalImageCount, usesSourceImage),
    hasIdentityFallback ? "注意：当前接口拒绝基于上传图编辑，已改用普通参考图生成，不能保证使用上传图的脸。" : ""
  ].filter(Boolean).join(" ");

  return {
    ...pack,
    imageStatus,
    usesSourceImage,
    generatedCount,
    totalImageCount,
    references,
    identityPreserved,
    hasIdentityFallback,
    message
  };
}

async function generateSingleReference(payload = {}) {
  const scenario = getScenario(payload.scenario);
  const role = sanitize(payload.role || "跨境服务顾问", 80);
  const audience = sanitize(payload.audience || "海外客户", 80);
  const title = sanitize(payload.title || "商务参考形象", 80);
  const label = sanitize(payload.label || "Reference", 40);
  const description = sanitize(payload.description || buildReferenceDescription({ label, role, audience }), 220);
  const prompt = sanitize(payload.prompt || buildReferencePrompt({ scenario, role, audience, label, title }), 1200);

  const baseItem = { label, title, description, prompt };
  if (!openaiApiKey) {
    return { ok: false, item: { ...baseItem, imageError: "当前未配置图片接口。" } };
  }

  try {
    const imageResult = await createReferenceImageWithRetry(prompt, payload.imageData);
    return { ok: true, item: { ...baseItem, ...imageResult } };
  } catch (error) {
    console.warn(`Single reference image failed for ${label}: ${error.message}`);
    return { ok: false, item: { ...baseItem, imageError: publicImageError(error) } };
  }
}

async function createReferenceImage(prompt, sourceImageData) {
  const sourceImage = parseDataUrlImage(sourceImageData);
  if (sourceImage) {
    try {
      return {
        imageUrl: await createReferenceImageEdit(prompt, sourceImage),
        imageMode: "source_edit"
      };
    } catch (error) {
      throw error;
    }
  }

  return {
    imageUrl: await createReferenceImageGeneration(prompt),
    imageMode: "prompt_generation"
  };
}

async function createReferenceImageWithRetry(prompt, sourceImageData) {
  return enqueueImageRequest(() => createReferenceImageWithRetryNow(prompt, sourceImageData));
}

async function createReferenceImageWithRetryNow(prompt, sourceImageData) {
  let lastError;
  for (let attempt = 1; attempt <= imageRetryAttempts; attempt += 1) {
    try {
      return await createReferenceImage(prompt, sourceImageData);
    } catch (error) {
      lastError = error;
      if (attempt >= imageRetryAttempts || !isRetryableImageError(error)) break;
      console.warn(`Image generation attempt ${attempt}/${imageRetryAttempts} failed: ${error.message}; retrying in ${imageRetryDelayMs}ms`);
      await delay(imageRetryDelayMs);
    }
  }
  throw lastError;
}

function enqueueImageRequest(task) {
  const run = imageRequestQueue.catch(() => {}).then(task);
  imageRequestQueue = run.catch(() => {});
  return run;
}

function isRetryableImageError(error) {
  if (error.status === 429) return false;
  return error.name === "AbortError"
    || [408, 409, 500, 502, 503, 504].includes(error.status)
    || /temporarily unavailable|timeout|timed out|No available compatible accounts/i.test(error.message || "");
}

function buildReferenceMessage(baseMessage, imageStatus, generatedCount, totalImageCount, usesSourceImage) {
  if (imageStatus === "generated") {
    return usesSourceImage
      ? `${baseMessage} 已基于上传照片生成 ${generatedCount} 张保留本人脸部特征的参考形象图。`
      : `${baseMessage} 已生成 ${generatedCount} 张参考形象图。`;
  }

  if (imageStatus === "partial") {
    return usesSourceImage
      ? `${baseMessage} 已基于上传照片生成 ${generatedCount}/${totalImageCount} 张参考形象图，未返回图片的场景已保留提示词，可再次点击在线生成重试。`
      : `${baseMessage} 已生成 ${generatedCount}/${totalImageCount} 张参考形象图，未返回图片的场景已保留提示词，可再次点击在线生成重试。`;
  }

  return usesSourceImage
    ? `${baseMessage} 当前图片编辑接口未返回可用图片，未生成不保脸的替代图；请稍后重试保留本人脸部特征的生成。`
    : `${baseMessage} 当前图片接口未返回可用图片，先展示可用于生成的参考提示词。`;
}

function getReferenceImageLimit(plan, referenceCount) {
  const max = plan === "pro" ? referenceImageMax : Math.min(referenceImageMax, 2);
  return Math.max(0, Math.min(max, referenceCount));
}

async function createReferenceImageEdit(prompt, sourceImage) {
  const form = new FormData();
  form.append("model", imageGenerationModel);
  form.append("prompt", buildIdentityPreservingPrompt(prompt));
  form.append("size", "1024x1024");
  form.append("n", "1");
  form.append(
    "image",
    new Blob([sourceImage.bytes], { type: sourceImage.mimeType }),
    `source.${sourceImage.extension}`
  );

  const response = await fetchWithTimeout(`${openaiBaseUrl}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: form
  }, imageTimeoutMs);

  const data = await readUpstreamJson(response, "Image edit");

  return extractGeneratedImageUrl(data);
}

async function createReferenceImageGeneration(prompt) {
  const response = await fetchWithTimeout(`${openaiBaseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: imageGenerationModel,
      prompt: buildReferenceOnlyPrompt(prompt),
      size: "1024x1024",
      n: 1
    })
  }, imageTimeoutMs);

  const data = await readUpstreamJson(response, "Image generation");

  return extractGeneratedImageUrl(data);
}

async function readUpstreamJson(response, label) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: { message: text.slice(0, 240) || `${label} returned a non-JSON response` } };
  }

  if (!response.ok) {
    const message = data.error?.message || data.message || `${label} HTTP ${response.status}`;
    console.warn(`${label} failed: HTTP ${response.status} ${String(message).slice(0, 500)}`);
    throw httpError(message, response.status);
  }

  if (data.error?.message) {
    console.warn(`${label} returned error payload: ${String(data.error.message).slice(0, 500)}`);
    throw httpError(data.error.message, response.status);
  }

  return data;
}

function extractGeneratedImageUrl(data) {
  const image = data.data?.[0];
  if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`;
  if (image?.url) return image.url;
  throw new Error("Image generation response did not include an image");
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function publicImageError(error) {
  if (error.status === 429 || /Concurrency limit exceeded/i.test(error.message || "")) {
    return "第三方图片账号并发已满，请等待上一张图片结束后再重新生成此图。";
  }
  if (/No available compatible accounts/i.test(error.message || "")) {
    return "第三方图片账号池暂时不可用，请稍后重新生成此图。";
  }
  if (/Upstream request failed/i.test(error.message || "")) {
    return "第三方图片接口上游请求失败，通常是图片账号池繁忙或上游超时，请稍后重试。";
  }
  if (error.status === 401 || error.status === 403) {
    return "图片接口拒绝请求，请检查该模型是否支持当前图片生成/编辑接口。";
  }
  if ([408, 500, 502, 503, 504].includes(error.status)) {
    return `第三方图片接口暂时不可用（HTTP ${error.status}），请稍后重新生成此图。`;
  }
  if (error.name === "AbortError") {
    return "保留本人脸部特征的图片生成等待超时，请稍后重试。";
  }
  return "保留本人脸部特征的图片接口暂未返回可用图片。";
}

function buildIdentityPreservingPrompt(prompt) {
  const scene = sanitizePromptForImage(prompt, 360);
  return [
    "Use the uploaded image as the same person reference.",
    "Keep the same face identity and natural likeness.",
    "Create a clean professional business portrait.",
    scene
  ].join("\n");
}

function sanitizePromptForImage(value, maxLength) {
  return String(value || "")
    .replace(/[\u4e00-\u9fff]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function buildReferenceOnlyPrompt(prompt) {
  return [
    "生成商务形象参考图。",
    "如果没有提供源照片，不要声称保留某个真实人物身份。",
    prompt
  ].join("\n");
}

async function buildReferencePack(payload = {}) {
  const plan = ["standard", "pro", "human"].includes(payload.plan) ? payload.plan : "standard";
  const scenario = getScenario(payload.scenario);
  const role = sanitize(payload.role || "跨境服务顾问", 80);
  const audience = sanitize(payload.audience || "海外客户", 80);
  const count = plan === "standard" ? 2 : plan === "pro" ? 6 : 3;
  const labels = [
    ["LinkedIn", "商务头像参考"],
    ["Website", "官网顾问形象"],
    ["Expo", "展会洽谈形象"],
    ["Founder", "创始人介绍图"],
    ["Profile", "英文简介配图"],
    ["Social", "商务社媒头像"]
  ];

  const basePack = {
    ok: true,
    plan,
    message: plan === "standard"
      ? "标准版建议生成 2 张参考图：头像方向和官网方向。"
      : "专业版包含 6 个不同场景方案：LinkedIn、官网、展会、创始人介绍、英文简介配图和商务社媒头像。",
    standardReport: buildStandardReport(payload.report, role, audience),
    professionalCopy: plan === "pro" ? await buildProfessionalCopy(payload.profile, role, audience) : null,
    references: labels.slice(0, count).map(([label, title]) => ({
      label,
      title,
      description: buildReferenceDescription({ label, role, audience }),
      prompt: buildReferencePrompt({ scenario, role, audience, label, title })
    }))
  };

  if (!openaiApiKey) return basePack;

  try {
    return mergeReferenceTextPlan(
      basePack,
      await createReferenceTextPlanWithAi({ payload, plan, scenario, role, audience, references: basePack.references })
    );
  } catch (error) {
    console.warn(`Reference text AI failed, falling back to template text: ${error.message}`);
    return basePack;
  }
}

function buildReferenceDescription({ label = "LinkedIn", role, audience }) {
  const descriptions = {
    LinkedIn: `用于 LinkedIn 头像首屏。重点优化当前照片的头像裁切、面部清晰度、肩颈比例和可信顾问感，适合${role}面向${audience}建立第一印象。`,
    Website: `用于官网 About / 顾问介绍页。重点优化当前照片的半身构图、网页留白、办公室背景和预约咨询信任感，适合放在官网个人介绍区域。`,
    Expo: `用于展会洽谈和线下商务会面。重点优化当前照片的站姿、亲和表情、现场商务感和客户接近感，适合展会资料、名片和扫码落地页。`,
    Founder: `用于创始人介绍图 / 品牌故事页。重点优化当前照片的环境人像、负责人气质、稳定判断力和个人品牌记忆点，适合公司介绍和媒体资料。`,
    Profile: `用于英文简介配图 / 个人资料页。重点优化当前照片与英文 About 文案的匹配度，保留横版留白，让服务对象、专业能力和交付可信度更清楚。`,
    Social: `用于商务社媒头像。重点优化当前照片在小尺寸头像中的识别度、亲和力和轻品牌感，适合微信、X、社媒主页等触点。`
  };
  return descriptions[label] || descriptions.LinkedIn;
}

function buildReferencePrompt({ scenario, role, audience, label = "LinkedIn", title }) {
  const spec = referenceScenarioSpecs[label] || referenceScenarioSpecs.LinkedIn;
  return [
    `${title}，用于${spec.scene}，并服务于用户选择的${scenarioNames[scenario]}业务场景。`,
    `人物定位：${role}，目标客户：${audience}。`,
    `构图：${spec.composition}。`,
    `背景：${spec.background}。`,
    `服装：${spec.styling}。`,
    `表情姿态：${spec.expression}。`,
    "整体风格：专业、可信、简洁、跨文化友好，必须像真实商务形象参考图。",
    `避免：${spec.avoid}。`,
    "用途：作为拍摄参考和商务形象方向图，不承诺替代真实职业照。"
  ].join(" ");
}

async function createReferenceTextPlanWithAi({ payload, plan, scenario, role, audience, references }) {
  const prompt = [
    "你是一个海外商务形象顾问和 AI 图像提示词专家。",
    "任务：基于用户照片诊断摘要、身份、目标客户和套餐，生成更个性化的标准报告和参考形象图方案。",
    "必须遵守：只能基于照片可见的商务呈现问题给建议；不要推断年龄、种族、民族、健康、宗教、政治、性吸引力、面相或命运；不要做颜值评价。",
    "输出必须是 JSON，不要 Markdown，不要解释。",
    `套餐：${plan}`,
    `业务场景：${scenarioNames[scenario]}`,
    `用户身份：${role}`,
    `目标客户：${audience}`,
    `基础诊断主要问题：${sanitize(payload.report?.issue || "商务形象信息不足", 180)}`,
    `基础诊断推荐方向：${sanitize(payload.report?.direction || "清晰可信的商务形象", 180)}`,
    `基础诊断摘要：${sanitize(payload.report?.summary || "从头像、服装、背景和英文表达统一优化。", 260)}`,
    `需要生成的参考场景：${references.map((item) => `${item.label}:${item.title}`).join("；")}`,
    "JSON 结构：",
    "{",
    "  \"standardReport\": [{\"title\":\"固定模块名\", \"priority\":\"高/中/低\", \"advice\":\"结合当前照片的判断，40-90字\", \"action\":\"具体执行动作，30-80字\"}],",
    "  \"references\": [{\"label\":\"LinkedIn/Website/Expo/Founder/Profile/Social\", \"description\":\"页面展示用中文说明，40-90字\", \"prompt\":\"英文图像生成提示词，必须明确构图、背景、服装、表情姿态、用途，不能要求替代真实职业照\"}]",
    "}",
    `standardReport 必须正好 12 项，title 必须按顺序使用：${paidModules.join("、")}。`,
    `references 必须正好 ${references.length} 项，只使用上述 label。`,
    "prompt 必须为英文，适合交给图片生成模型；description 必须为简体中文。"
  ].join("\n");

  return createJsonViaChat(prompt, textGenerationModel, 2200);
}

function mergeReferenceTextPlan(basePack, aiPlan = {}) {
  const reportByTitle = new Map(
    Array.isArray(aiPlan.standardReport)
      ? aiPlan.standardReport.map((item) => [sanitize(item.title, 80), item])
      : []
  );
  const referenceByLabel = new Map(
    Array.isArray(aiPlan.references)
      ? aiPlan.references.map((item) => [sanitize(item.label, 40), item])
      : []
  );

  return {
    ...basePack,
    standardReport: basePack.standardReport.map((item) => {
      const next = reportByTitle.get(item.title);
      return next
        ? {
            title: item.title,
            priority: ["高", "中", "低"].includes(next.priority) ? next.priority : item.priority,
            advice: sanitize(next.advice || item.advice, 260),
            action: sanitize(next.action || item.action, 220)
          }
        : item;
    }),
    references: basePack.references.map((item) => {
      const next = referenceByLabel.get(item.label);
      return next
        ? {
            ...item,
            description: sanitize(next.description || item.description, 220),
            prompt: sanitize(next.prompt || item.prompt, 1200)
          }
        : item;
    })
  };
}

function buildStandardReport(report = {}, role, audience) {
  const issue = sanitize(report.issue || "当前商务形象信息还不够集中", 180);
  const direction = sanitize(report.direction || "清晰、可信、专业的海外商务形象", 180);
  const summary = sanitize(report.summary || "建议从头像、服装、背景和英文表达四个方面统一优化。", 240);
  const modules = paidModules;
  const advice = [
    `当前照片的裁切要围绕「${direction}」服务，让面部、肩颈和上半身比例适合 LinkedIn、官网 About 和商务资料页。`,
    "当前照片中的表情和视线会直接影响信任感，应降低自拍感，保持自然、稳定、可交流的状态。",
    "当前照片里的服装色彩会影响专业度，建议减少花纹、强休闲元素和过亮色块，优先低饱和商务色。",
    `当前照片背景需要服务于「${role}」的专业定位，避免杂乱环境抢走注意力。`,
    "当前照片的姿态和肩颈线条决定是否显得可靠、开放、可接近，应避免俯拍、仰拍和过近自拍。",
    `当前照片面向${audience}时，要减少本地生活化和滤镜化痕迹，突出跨文化沟通中的专业边界和可信度。`,
    `当前照片暴露出的主要问题是「${issue}」，需要让头像、简介和服务定位表达同一套身份信息。`,
    "当前头像需要和 LinkedIn Headline、背景图形成同一条信息线，让客户从照片到标题都能看出你服务谁、解决什么问题。",
    "英文个人简介应承接当前照片传递出的专业感，避免照片显得商务而文字却只泛泛介绍能力。",
    "官网 About 页面要让头像、个人介绍和服务说明互相支撑，避免照片看起来可信但页面文字没有说明服务范围和交付方式。",
    "展会、名片和邮件签名场景需要沿用当前照片的统一形象，避免客户在不同触点看到不一致的头像风格。",
    `${summary} 30 天计划应以当前照片优化为起点：先确定头像版本，再同步 LinkedIn、官网、名片和商务资料。`
  ];
  const actions = [
    "基于当前照片重新裁切 LinkedIn 头像版、官网头像版和商务资料页头像版。",
    "从当前照片中筛选表情最自然的一张；如果不够稳定，重拍一张轻微微笑、正视镜头的版本。",
    "对比当前照片中的服装，保留最稳重的一版；必要时重拍 2 套低饱和商务服装照片。",
    "替换或重拍当前照片背景，优先使用简洁办公室、浅色墙面或自然光环境。",
    "把当前照片调整为半身构图，保留肩部和上胸空间，避免脸部过大或身体线条缺失。",
    "删除当前照片中过度生活化、滤镜化或场景不清晰的版本，只保留跨文化商务场景可用的头像。",
    "为当前照片写 3 个个人品牌关键词，确保头像、服务定位和英文简介使用同一套关键词。",
    "用当前头像搭配一条 120 字以内的 LinkedIn Headline，并检查两者是否传递同一定位。",
    "生成 3 个英文 About 版本，选择最能解释当前照片中专业形象的一版。",
    "在官网 About 区加入当前头像、服务对象和典型交付物，形成照片和文字互相支撑的介绍区。",
    "统一名片、邮件签名、WhatsApp、微信和展会资料中的头像版本，避免不同平台使用不同照片。",
    "按 7 天、14 天、30 天分阶段更新当前照片在 LinkedIn、官网、名片、邮箱签名和商务资料中的使用。"
  ];

  const priorities = ["高", "高", "高", "中", "中", "高", "高", "高", "中", "中", "中", "高"];

  return modules.map((title, index) => ({
    title,
    priority: priorities[index],
    advice: advice[index],
    action: actions[index]
  }));
}

async function buildProfessionalCopy(profile = {}, role, audience) {
  const fallback = buildTemplateProfessionalCopy(profile, role, audience);
  if (!openaiApiKey) return fallback;

  try {
    const copy = await createProfessionalCopyWithAi(profile, role, audience, fallback);
    return normalizeProfessionalCopy(copy, fallback);
  } catch (error) {
    console.warn(`Professional copy AI failed, falling back to template: ${error.message}`);
    return fallback;
  }
}

async function createProfessionalCopyWithAi(profile = {}, role, audience, fallback) {
  const prompt = [
    "You are a senior English business copywriter for cross-border professional service providers.",
    "Generate polished English profile copy only. Do not output Chinese characters, pinyin, markdown, explanations, or extra keys.",
    "The user may provide Chinese input. Translate and adapt it into natural business English instead of copying it.",
    "Avoid hype. Keep the tone credible, concise, consultant-like, and suitable for LinkedIn and a service website.",
    `Name: ${sanitize(profile.name || "Your Name", 80)}`,
    `Role/title: ${sanitize(profile.title || role, 120)}`,
    `Target clients: ${sanitize(audience || "overseas clients", 120)}`,
    `Services: ${sanitize(profile.services || "translation, localization, and cross-border documentation support", 220)}`,
    `Strengths: ${sanitize(profile.strengths || "clear communication, reliable delivery, and cross-cultural business context", 220)}`,
    `Call to action: ${sanitize(profile.cta || "Book a consultation", 160)}`,
    "Return JSON exactly with these string fields: headline, about, websiteAbout, signature.",
    `Fallback style reference: ${JSON.stringify(fallback)}`
  ].join("\n");

  const responsesError = await tryCreateProfessionalCopyViaResponses(prompt);
  if (!responsesError.error) return responsesError.copy;
  return createProfessionalCopyViaChat(prompt, responsesError.error);
}

async function tryCreateProfessionalCopyViaResponses(prompt) {
  try {
    const response = await fetchWithTimeout(`${openaiBaseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: profileCopyModel,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "english_profile_copy",
            schema: professionalCopySchema,
            strict: true
          }
        },
        max_output_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Responses HTTP ${response.status}`);
    const text = extractResponseText(data);
    if (!text) throw new Error("Responses output did not include text");
    return { copy: JSON.parse(text) };
  } catch (error) {
    return { error };
  }
}

async function createProfessionalCopyViaChat(prompt, previousError) {
  try {
    return await createJsonViaChat(prompt, profileCopyModel, 700, 0.3);
  } catch (error) {
    throw new Error(`${error.message}; responses fallback reason: ${previousError.message}`);
  }
}

async function createJsonViaChat(prompt, model, maxTokens = 1200, temperature = 0.3) {
  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature,
    max_tokens: maxTokens
  };

  let response = await fetchWithTimeout(`${openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify(body)
  });

  let data = await response.json();
  if (!response.ok && /response_format|json_object/i.test(data.error?.message || "")) {
    delete body.response_format;
    response = await fetchWithTimeout(`${openaiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(body)
    });
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data.error?.message || `Chat completions HTTP ${response.status}`);
  }

  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Chat completions output did not include content");
  return JSON.parse(stripMarkdownJson(text));
}

function normalizeProfessionalCopy(copy = {}, fallback) {
  const normalized = {
    headline: sanitize(copy.headline || fallback.headline, 240),
    about: sanitize(copy.about || fallback.about, 800),
    websiteAbout: sanitize(copy.websiteAbout || fallback.websiteAbout, 800),
    signature: sanitize(copy.signature || fallback.signature, 240)
  };

  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [key, hasCjk(value) ? fallback[key] : value])
  );
}

function buildTemplateProfessionalCopy(profile = {}, role, audience) {
  const name = toEnglishName(profile.name || "Your Name");
  const title = toEnglishPhrase(profile.title || role, "Cross-border Compliance Translator", englishTitleTerms);
  const targetAudience = toEnglishPhrase(audience, "overseas brands and export clients", englishAudienceTerms);
  const services = toEnglishPhrase(
    profile.services || "translation, localization, and cross-border documentation support",
    "legal translation, technical translation, and cross-border documentation support",
    englishServiceTerms
  );
  const strengths = toEnglishPhrase(
    profile.strengths || "clear communication, reliable delivery, and cross-cultural business context",
    "clear communication, reliable delivery, and familiarity with EU and US compliance requirements",
    englishStrengthTerms
  );
  const cta = toEnglishPhrase(profile.cta || "contact me to discuss your next cross-border project", "Book a consultation", englishCtaTerms);

  return {
    headline: `${title} | Helping ${targetAudience} with ${services}`,
    about: `${name} helps ${targetAudience} handle ${services}. The work focuses on ${strengths}, so clients can communicate clearly, reduce cross-border friction, and move projects forward with confidence. ${cta}.`,
    websiteAbout: `${name} provides ${services} for ${targetAudience}. With a focus on ${strengths}, the service is designed for teams that need accurate communication and a professional international presence.`,
    signature: `${name} | ${title} | ${services}`
  };
}

const englishTitleTerms = [
  ["跨境合规翻译", "Cross-border Compliance Translator"],
  ["合规翻译", "Compliance Translator"],
  ["跨境服务顾问", "Cross-border Service Consultant"],
  ["翻译公司负责人", "Translation Company Founder"],
  ["翻译负责人", "Translation Lead"],
  ["技术翻译", "Technical Translator"],
  ["法律翻译", "Legal Translator"],
  ["顾问", "Consultant"],
  ["翻译", "Translator"]
];

const englishAudienceTerms = [
  ["海外品牌方", "overseas brands"],
  ["外贸客户", "export clients"],
  ["海外客户", "overseas clients"],
  ["制造商", "manufacturers"],
  ["律师事务所", "law firms"],
  ["律所", "law firms"],
  ["品牌方", "brand teams"],
  ["客户", "clients"]
];

const englishServiceTerms = [
  ["法律翻译", "legal translation"],
  ["技术翻译", "technical translation"],
  ["合规翻译", "compliance translation"],
  ["合同翻译", "contract translation"],
  ["网站本地化", "website localization"],
  ["本地化", "localization"],
  ["跨境文档", "cross-border documentation"],
  ["说明书翻译", "manual translation"],
  ["翻译", "translation"]
];

const englishStrengthTerms = [
  ["熟悉欧美合规", "familiarity with EU and US compliance requirements"],
  ["欧美合规", "EU and US compliance requirements"],
  ["清晰沟通", "clear communication"],
  ["交付可靠", "reliable delivery"],
  ["跨文化", "cross-cultural business context"],
  ["专业", "professional execution"],
  ["准确", "accuracy"]
];

const englishCtaTerms = [
  ["预约咨询", "Book a consultation"],
  ["联系我", "Contact me"],
  ["获取报价", "Request a quote"],
  ["咨询", "Book a consultation"]
];

function toEnglishName(value) {
  const clean = sanitize(value || "Your Name", 80);
  return hasCjk(clean) ? "Your Name" : clean;
}

function toEnglishPhrase(value, fallback, terms) {
  const clean = sanitize(value || fallback, 240);
  if (!hasCjk(clean)) return clean;

  const pieces = clean
    .split(/[、，,\/|；;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const translated = pieces
    .map((piece) => translateChinesePiece(piece, terms))
    .filter(Boolean);

  if (translated.length) return joinEnglishList([...new Set(translated)]);
  const matched = translateChinesePiece(clean, terms);
  return matched || fallback;
}

function translateChinesePiece(piece, terms) {
  const exact = terms.find(([source]) => piece === source);
  if (exact) return exact[1];
  const partial = terms.find(([source]) => piece.includes(source) || source.includes(piece));
  return partial?.[1] || "";
}

function joinEnglishList(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value));
}

function normalizeReport(report, context, source) {
  return {
    score: clampInteger(report.score, 0, 100, 76),
    issue: sanitize(report.issue || "商务形象信息不足", 160),
    direction: sanitize(report.direction || "清爽可信的商务顾问形象", 180),
    summary: sanitize(report.summary || "适合从头像、服装和英文简介三处优先优化。", 220),
    quickInsights: normalizeStringArray(report.quickInsights, 3, "建议补充更清晰的商务头像信息。"),
    paidModules,
    source,
    context
  };
}

async function serveStatic(pathname, response) {
  if (pathname === "/") pathname = "/index.html";

  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = safePath.replace(/^[/\\]/, "");
  const filePath = resolve(rootPath, requestedPath);

  if (filePath !== rootPath && !filePath.startsWith(`${rootPath}${sep}`)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat || !fileStat.isFile()) {
    response.writeHead(404);
    return response.end("Not found");
  }

  const body = await readFile(filePath);
  response.writeHead(200, securityHeaders({
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  }));
  response.end(body);
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > jsonBodyLimit) throw httpError("Payload too large", 413);
  }
  return body ? JSON.parse(body) : {};
}

async function readLeadPayload(request) {
  const contentType = request.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return readMultipartForm(request, contentType);
  }
  return readJson(request);
}

async function readMultipartForm(request, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw new Error("Missing multipart boundary");
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    chunks.push(buffer);
    total += buffer.length;
    if (total > multipartBodyLimit) throw httpError("Payload too large", 413);
  }
  return parseMultipartBuffer(Buffer.concat(chunks), boundary);
}

function parseMultipartBuffer(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const result = { files: [] };
  let start = buffer.indexOf(delimiter);
  while (start !== -1) {
    start += delimiter.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const next = buffer.indexOf(delimiter, start);
    if (next === -1) break;
    const part = buffer.subarray(start, next - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headerText = part.subarray(0, headerEnd).toString("utf8");
      const content = part.subarray(headerEnd + 4);
      const name = headerText.match(/name="([^"]+)"/i)?.[1] || "";
      const filename = headerText.match(/filename="([^"]*)"/i)?.[1] || "";
      const contentType = headerText.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "application/octet-stream";
      if (name) {
        if (filename) {
          result.files.push({
            field: name,
            originalName: sanitizeFilename(filename),
            contentType,
            size: content.length,
            buffer: content
          });
        } else {
          result[name] = content.toString("utf8");
        }
      }
    }
    start = next;
  }
  return result;
}

async function saveLeadUploads(leadId, files) {
  const safeFiles = Array.isArray(files) ? files.filter((file) => file?.buffer?.length) : [];
  if (!safeFiles.length) return [];
  const uploadDir = join(root, "data", "lead-uploads", leadId);
  await mkdir(uploadDir, { recursive: true });
  const saved = [];
  for (const [index, file] of safeFiles.slice(0, 12).entries()) {
    const filename = `${String(index + 1).padStart(2, "0")}_${file.originalName || "upload.bin"}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, file.buffer);
    saved.push({
      field: file.field,
      originalName: file.originalName,
      filename,
      contentType: file.contentType,
      size: file.size,
      path: `data/lead-uploads/${leadId}/${filename}`
    });
  }
  return saved;
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, securityHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }));
  response.end(JSON.stringify(payload));
}

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self'",
      "img-src 'self' data: blob: http: https:",
      "connect-src 'self'",
      "font-src 'self' data:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; "),
    ...extra
  };
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

function takeRateLimitSlot(request, pathname) {
  const now = Date.now();
  const ip = String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "local").split(",")[0].trim();
  const key = `${ip}:${pathname}`;
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt > rateLimitWindowMs) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= rateLimitMax;
}

function isSampleAdmin(request) {
  if (!sampleAdminToken) return false;
  const token = request.headers["x-sample-admin-token"];
  return typeof token === "string" && token === sampleAdminToken;
}

function getScenario(value) {
  return value && scenarioTemplates[value] ? value : "linkedin";
}

function getContext(payload) {
  return {
    role: sanitize(payload.role || "跨境服务顾问", 80),
    audience: sanitize(payload.audience || "海外客户", 80),
    goals: Array.isArray(payload.goals) ? payload.goals.map((item) => sanitize(item, 40)).filter(Boolean) : []
  };
}

function pickLeadFields(payload) {
  return {
    contact: sanitize(payload.contact || "", 120),
    customRole: sanitize(payload.customRole || "", 120),
    customAudience: sanitize(payload.customAudience || "", 120),
    customScene: sanitize(payload.customScene || "", 160),
    customPhoto: sanitize(payload.customPhoto || "", 160),
    customCopy: sanitize(payload.customCopy || "", 160),
    note: sanitize(payload.note || "", 300),
    scenario: getScenario(payload.scenario),
    role: sanitize(payload.role || "", 80),
    audience: sanitize(payload.audience || "", 80),
    reportSummary: sanitize(payload.reportSummary || "", 200)
  };
}

async function notifyLeadByEmail(record) {
  if (!leadNotifyEmail) {
    console.warn("Lead email notification skipped: LEAD_NOTIFY_EMAIL is not configured.");
    return;
  }

  const subject = `新的定制方案需求 - ${record.contact || record.id}`;
  const body = buildLeadEmailBody(record);
  if (resendApiKey && resendFrom) {
    await sendResendMail({
      from: resendFrom,
      to: leadNotifyEmail,
      subject,
      text: body
    });
    return;
  }

  if (!smtpHost || !smtpFrom) {
    console.warn("Lead email notification skipped: RESEND_API_KEY or SMTP_HOST/SMTP_FROM is not configured.");
    return;
  }

  await sendSmtpMail({
    from: smtpFrom,
    to: leadNotifyEmail,
    subject,
    text: body
  });
}

async function sendResendMail({ from, to, subject, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text
    })
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Resend HTTP ${response.status}: ${body.slice(0, 300)}`);
  }
}

function buildLeadEmailBody(record) {
  const files = Array.isArray(record.uploadedFiles) && record.uploadedFiles.length
    ? record.uploadedFiles.map((file, index) => [
        `${index + 1}. ${file.originalName}`,
        `   类型：${file.contentType}`,
        `   大小：${file.size} bytes`,
        `   路径：${join(root, file.path)}`
      ].join("\n")).join("\n")
    : "无上传文件";

  return [
    "收到一条新的定制方案需求。",
    "",
    `线索 ID：${record.id}`,
    `提交时间：${record.createdAt}`,
    `联系方式：${record.contact || "-"}`,
    "",
    "定制需求：",
    `当前身份/业务：${record.customRole || record.role || "-"}`,
    `目标客户：${record.customAudience || record.audience || "-"}`,
    `使用场景：${record.customScene || record.scenario || "-"}`,
    `照片情况：${record.customPhoto || "-"}`,
    `英文文案需求：${record.customCopy || "-"}`,
    `补充需求：${record.note || "-"}`,
    "",
    `基础诊断摘要：${record.reportSummary || "-"}`,
    "",
    "上传文件：",
    files,
    "",
    `本地线索文件：${join(root, "data", "leads.jsonl")}`
  ].join("\n");
}

async function sendSmtpMail({ from, to, subject, text }) {
  const client = await createSmtpClient();
  try {
    await client.expect([220]);
    await client.command(`EHLO ${smtpHost}`, [250]);
    if (!smtpSecure) {
      await client.command("STARTTLS", [220]);
      await client.upgradeToTls();
      await client.command(`EHLO ${smtpHost}`, [250]);
    }
    if (smtpUser || smtpPass) {
      await client.command("AUTH LOGIN", [334]);
      await client.command(Buffer.from(smtpUser).toString("base64"), [334]);
      await client.command(Buffer.from(smtpPass).toString("base64"), [235]);
    }
    await client.command(`MAIL FROM:<${extractEmailAddress(from)}>`, [250]);
    await client.command(`RCPT TO:<${extractEmailAddress(to)}>`, [250, 251]);
    await client.command("DATA", [354]);
    await client.writeData(buildEmailMessage({ from, to, subject, text }));
    await client.expect([250]);
    await client.command("QUIT", [221]).catch(() => {});
  } finally {
    client.close();
  }
}

function createSmtpClient() {
  return new Promise((resolve, reject) => {
    const socket = smtpSecure
      ? tls.connect({ host: smtpHost, port: smtpPort, servername: smtpHost })
      : net.connect({ host: smtpHost, port: smtpPort });
    socket.setEncoding("utf8");
    socket.setTimeout(30000);
    socket.once("error", reject);
    if (smtpSecure) {
      socket.once("secureConnect", () => resolve(wrapSmtpSocket(socket)));
    } else {
      socket.once("connect", () => resolve(wrapSmtpSocket(socket)));
    }
    socket.once("timeout", () => reject(new Error("SMTP connection timed out")));
  });
}

function wrapSmtpSocket(socket) {
  let buffer = "";
  const waiters = [];

  socket.on("data", (chunk) => {
    buffer += chunk;
    flushSmtpWaiters();
  });

  socket.on("error", (error) => {
    while (waiters.length) waiters.shift().reject(error);
  });

  function flushSmtpWaiters() {
    while (waiters.length) {
      const response = readSmtpResponse();
      if (!response) return;
      waiters.shift().resolve(response);
    }
  }

  function readSmtpResponse() {
    const lines = buffer.split(/\r?\n/);
    if (lines.length < 2) return null;
    const completeIndex = lines.findIndex((line) => /^\d{3} /.test(line));
    if (completeIndex === -1) return null;
    const responseLines = lines.slice(0, completeIndex + 1);
    buffer = lines.slice(completeIndex + 1).join("\n");
    return responseLines.join("\n");
  }

  async function expect(codes) {
    const response = await new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      flushSmtpWaiters();
    });
    const code = Number(response.slice(0, 3));
    if (!codes.includes(code)) {
      throw new Error(`SMTP expected ${codes.join("/")} but got ${code}: ${response}`);
    }
    return response;
  }

  return {
    expect,
    async command(command, codes) {
      socket.write(`${command}\r\n`);
      return expect(codes);
    },
    async writeData(message) {
      socket.write(`${dotStuff(message)}\r\n.\r\n`);
    },
    async upgradeToTls() {
      const secureSocket = tls.connect({ socket, servername: smtpHost });
      return new Promise((resolve, reject) => {
        secureSocket.once("secureConnect", () => {
          socket = secureSocket;
          resolve();
        });
        secureSocket.once("error", reject);
      });
    },
    close() {
      socket.end();
    }
  };
}

function buildEmailMessage({ from, to, subject, text }) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text
  ].join("\r\n");
}

function dotStuff(message) {
  return String(message).replace(/\r?\n\./g, "\r\n..");
}

function extractEmailAddress(value) {
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

async function readStandardSample() {
  const body = await readFile(standardSamplePath, "utf8").catch(() => "");
  if (!body) return defaultStandardSample();
  try {
    return normalizeStandardSample(JSON.parse(body));
  } catch {
    return defaultStandardSample();
  }
}

async function readProfessionalSample() {
  const body = await readFile(professionalSamplePath, "utf8").catch(() => "");
  if (!body) return defaultProfessionalSample();
  try {
    return normalizeProfessionalSample(JSON.parse(body));
  } catch {
    return defaultProfessionalSample();
  }
}

function normalizeStandardSample(payload = {}) {
  const report = Array.isArray(payload.standardReport)
    ? payload.standardReport.map((item, index) => ({
        title: sanitize(item.title || paidModules[index] || `报告项 ${index + 1}`, 80),
        priority: ["高", "中", "低"].includes(item.priority) ? item.priority : "中",
        advice: sanitize(item.advice || "基于当前照片判断该项需要优化。", 280),
        action: sanitize(item.action || "按报告建议调整照片、文案和使用场景。", 240)
      })).slice(0, 12)
    : [];

  const references = Array.isArray(payload.references)
    ? payload.references.map((item) => ({
        label: sanitize(item.label || "Reference", 40),
        title: sanitize(item.title || "参考形象图", 80),
        description: sanitize(item.description || "基于上传照片生成的参考形象图。", 220),
        imageUrl: isDataUrlImage(item.imageUrl) || /^https?:\/\//i.test(String(item.imageUrl || "")) ? item.imageUrl : "",
        imageMode: sanitize(item.imageMode || "source_edit", 40)
      })).filter((item) => item.imageUrl).slice(0, 2)
    : [];

  return {
    ok: true,
    source: payload.source === "generated" ? "generated" : "default",
    savedAt: sanitize(payload.savedAt || new Date().toISOString(), 40),
    note: sanitize(payload.note || "以下为脱敏固定样例，实际报告会根据用户上传照片生成。", 160),
    standardReport: fillStandardSampleReport(report),
    references: references.length >= 2 ? references : defaultStandardSampleReferences()
  };
}

function normalizeProfessionalSample(payload = {}) {
  const base = normalizeStandardSample(payload);
  const references = Array.isArray(payload.references)
    ? payload.references.map((item, index) => ({
        label: sanitize(item.label || professionalReferenceLabels[index]?.[0] || `Scene ${index + 1}`, 40),
        title: sanitize(item.title || professionalReferenceLabels[index]?.[1] || "专业形象参考图", 80),
        description: sanitize(item.description || "基于上传照片生成的专业形象场景图。", 360),
        imageUrl: isDataUrlImage(item.imageUrl) || /^https?:\/\//i.test(String(item.imageUrl || "")) ? item.imageUrl : "",
        imageMode: sanitize(item.imageMode || "source_edit", 40)
      })).slice(0, 6)
    : [];

  return {
    ...base,
    source: payload.source === "generated" ? "generated" : "default",
    note: sanitize(payload.note || "以下为专业形象包固定样例，实际内容会根据用户上传照片和业务信息生成。", 160),
    professionalCopy: normalizeProfessionalCopy(payload.professionalCopy || {}, defaultProfessionalSampleCopy()),
    references: references.length >= 6 ? references : defaultProfessionalSampleReferences()
  };
}

function fillStandardSampleReport(items) {
  const defaults = defaultStandardSampleReport();
  return paidModules.map((title, index) => ({
    ...defaults[index],
    ...(items[index] || {}),
    title
  }));
}

function defaultStandardSample() {
  return {
    ok: true,
    source: "default",
    savedAt: new Date().toISOString(),
    note: "以下为脱敏固定样例，实际报告会根据用户上传照片生成。",
    standardReport: defaultStandardSampleReport(),
    references: defaultStandardSampleReferences()
  };
}

function defaultProfessionalSample() {
  return {
    ok: true,
    source: "default",
    savedAt: new Date().toISOString(),
    note: "以下为专业形象包固定样例，实际内容会根据用户上传照片和业务信息生成。",
    standardReport: defaultStandardSampleReport(),
    professionalCopy: defaultProfessionalSampleCopy(),
    references: defaultProfessionalSampleReferences()
  };
}

function defaultStandardSampleReport() {
  const advice = [
    "当前头像面部识别清楚，但肩颈和上半身空间不足，放到 LinkedIn 圆形头像后容易显得紧张。",
    "表情需要稳定、自然、可交流，避免过度严肃或自拍感，才能让海外客户愿意继续了解服务。",
    "服装颜色偏生活化，和跨境合规翻译的专业定位不够一致，容易削弱首次信任感。",
    "背景需要服务于专业身份，如果环境信息杂乱，会让头像看起来像生活照而不是商务资料照。",
    "肩颈线条决定头像是否显得稳定可靠，过近裁切或身体倾斜会削弱顾问型信任感。",
    "面对海外客户时，照片需要减少本地生活化表达，突出清晰、克制、可信的专业边界。",
    "跨境合规翻译的头像要让客户感到准确、可靠、懂业务语境，不能只表达普通翻译能力。",
    "头像、Headline 和背景图需要同时说明你服务谁、解决什么问题，否则客户只看到翻译，看不到专业边界。",
    "英文简介要承接头像传递的专业感，避免只罗列能力，而没有说明服务对象和业务结果。",
    "官网 About 页要让头像、个人介绍和服务范围互相支撑，降低首次咨询阻力。",
    "展会、名片、邮箱签名和社媒头像如果风格不一致，会让客户对服务专业度产生犹豫。",
    "如果只换头像，不同步官网、名片和邮箱签名，客户在不同触点看到的专业形象会不一致。"
  ];
  const action = [
    "裁成胸上半身构图，头顶保留 8%-12% 留白，肩部完整露出，让头像在小尺寸下仍然稳定可信。",
    "选择轻微微笑、正视镜头的版本，眼神保持清晰，避免俯拍、仰拍和距离过近的自拍角度。",
    "优先选择深海军蓝、西装灰或白衬衫组合，减少图案和强休闲元素，形成更清晰的顾问型形象。",
    "使用浅灰、米白或明亮办公室背景，保持柔和正面光，减少强阴影和明显滤镜痕迹。",
    "采用自然打开的肩线，身体略微面向镜头，保留上胸空间，让姿态更从容。",
    "统一服装、背景和表情风格，避免强美颜、夸张姿势和过度社交化头像。",
    "在头像和简介中同步出现合规、法律、技术文档等关键词，强化服务边界。",
    "用头像建立可信感，Headline 写成 Cross-border Compliance Translator | Legal and Technical Translation for Export Teams。",
    "用 3-5 句话写清服务对象、交付内容、优势和预约行动，语气保持可信、具体、不过度营销。",
    "在头像旁边加入服务对象、典型文件类型、交付方式和联系方式，不让客户自己猜测服务边界。",
    "沿用同一张核心头像，分别裁切出 LinkedIn、官网、名片和邮件签名版本。",
    "第 1 周确定头像版本，第 2 周更新 LinkedIn 和官网 About，第 3-4 周同步名片、邮件签名和商务资料页。"
  ];
  const priorities = ["高", "高", "高", "中", "中", "高", "高", "高", "中", "中", "中", "高"];
  return paidModules.map((title, index) => ({ title, priority: priorities[index], advice: advice[index], action: action[index] }));
}

function defaultStandardSampleReferences() {
  return [
    {
      label: "LinkedIn",
      title: "LinkedIn 商务头像参考",
      description: "方形头像构图，浅色背景，深色西装或低饱和商务上装，适合 LinkedIn 圆形裁切。",
      imageUrl: "",
      imageMode: "sample_placeholder"
    },
    {
      label: "Website",
      title: "官网顾问形象",
      description: "半身构图，保留网页留白，背景偏办公室或咨询场景，适合 About 页面展示。",
      imageUrl: "",
      imageMode: "sample_placeholder"
    }
  ];
}

const professionalReferenceLabels = [
  ["LinkedIn", "商务头像参考"],
  ["Website", "官网顾问形象"],
  ["Expo", "展会洽谈形象"],
  ["Founder", "创始人介绍图"],
  ["Profile", "英文简介配图"],
  ["Social", "商务社媒头像"]
];

function defaultProfessionalSampleReferences() {
  return professionalReferenceLabels.map(([label, title], index) => ({
    label,
    title,
    description: [
      "方形头像构图，浅色背景，深色西装或低饱和商务上装，适合 LinkedIn 圆形裁切。",
      "半身构图，保留网页留白，背景偏办公室或咨询场景，适合 About 页面展示。",
      "明亮展会或会议空间，姿态开放，适合会前资料、名片二维码页和现场社交。",
      "更稳定的半身商务肖像，突出创始人可信度、判断力和真实服务感。",
      "适合放在英文简介旁的半身照片，背景干净，视觉重点服务于文案。",
      "更轻量的商务社媒头像，适合头像、文章署名和内容平台主页。"
    ][index],
    imageUrl: "",
    imageMode: "sample_placeholder"
  }));
}

function defaultProfessionalSampleCopy() {
  return {
    headline: "Cross-border Compliance Translator | Legal and Technical Translation for Overseas Brands and Export Clients",
    about: "Ms. Li helps overseas brands and export clients handle legal and technical translation for cross-border business. Her work focuses on accuracy, compliance context, and clear communication, helping clients reduce misunderstandings and move international projects forward with confidence.",
    websiteAbout: "Ms. Li provides legal translation, technical translation, and cross-border documentation support for export teams. The service is designed for clients who need accurate communication, reliable delivery, and a professional international presence.",
    signature: "Ms. Li | Cross-border Compliance Translator | Legal and Technical Translation"
  };
}

function sanitize(value, maxLength = 120) {
  return String(value).trim().slice(0, maxLength);
}

function sanitizeFilename(value) {
  const clean = String(value || "upload.bin")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
  return clean || "upload.bin";
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeStringArray(value, length, fallbackItem, defaultItems = []) {
  const items = Array.isArray(value) ? value.map((item) => sanitize(item, 180)).filter(Boolean) : [];
  const merged = [...items, ...defaultItems, fallbackItem].filter(Boolean);
  return merged.slice(0, length);
}

function isDataUrlImage(value) {
  return typeof value === "string" && /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
}

function parseDataUrlImage(value) {
  if (!isDataUrlImage(value)) return null;
  const match = String(value).match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/i);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const extension = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";

  return {
    mimeType,
    extension,
    bytes: Buffer.from(match[3], "base64")
  };
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function stripMarkdownJson(value) {
  const text = String(value).trim();
  const match = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1] : text;
}

async function fetchWithTimeout(url, options, timeoutMs = aiTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const [rawKey, ...rawValueParts] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValueParts.join("=").trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}
