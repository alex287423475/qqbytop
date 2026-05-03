const state = {
  scenario: "linkedin",
  hasImage: false,
  imageData: "",
  lastReport: null,
  progressTimer: null,
  progressValue: 0,
  progressFlow: "",
  lastReferenceResult: null,
  lastStandardReport: null,
  lastProfessionalCopy: null,
  isSingleImageRetrying: false,
  canManageSamples: false,
  fixedSamples: {
    standardLoaded: false,
    professionalLoaded: false
  }
};

const sampleAdminToken = new URLSearchParams(window.location.search).get("sample_admin_token")
  || sessionStorage.getItem("sampleAdminToken")
  || "";

const scenarioNames = {
  linkedin: "LinkedIn 头像",
  founder: "出海创始人",
  expo: "展会洽谈",
  consultant: "顾问官网"
};

const fallbackReports = {
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
      "适合使用半身构图，保留办公或项目场景线索，让客户知道你不是匿名服务商。",
      "穿搭可以增加质感外套或针织层次，形成成熟但不压迫的商务气质。",
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

const portraitInput = document.querySelector("#portraitInput");
const portraitPreview = document.querySelector("#portraitPreview");
const uploadEmpty = document.querySelector("#uploadEmpty");
const roleInput = document.querySelector("#roleInput");
const audienceInput = document.querySelector("#audienceInput");
const generateBtn = document.querySelector("#generateBtn");
const emptyReport = document.querySelector("#emptyReport");
const reportContent = document.querySelector("#reportContent");
const scoreValue = document.querySelector("#scoreValue");
const mainIssue = document.querySelector("#mainIssue");
const styleDirection = document.querySelector("#styleDirection");
const scenarioLabel = document.querySelector("#scenarioLabel");
const reportMode = document.querySelector("#reportMode");
const demoNotice = document.querySelector("#demoNotice");
const insightList = document.querySelector("#insightList");
const leadBtn = document.querySelector("#leadBtn");
const leadForm = document.querySelector("#leadForm");
const formMessage = document.querySelector("#formMessage");
const planButtons = Array.from(document.querySelectorAll("[data-plan]"));
const sampleButtons = Array.from(document.querySelectorAll("[data-sample]"));
const sampleTabs = Array.from(document.querySelectorAll("[data-sample-tab]"));
const samplePanels = Array.from(document.querySelectorAll("[data-sample-panel]"));
const samplePreview = document.querySelector("#samplePreview");
const standardSampleToggle = document.querySelector("#standardSampleToggle");
const standardSampleList = document.querySelector("#standardSampleList");
const standardSampleReferences = document.querySelector("#standardSampleReferences");
const professionalSampleReport = document.querySelector("#professionalSampleReport");
const professionalSampleToggle = document.querySelector("#professionalSampleToggle");
const professionalSampleCopy = document.querySelector("#professionalSampleCopy");
const professionalSampleReferences = document.querySelector("#professionalSampleReferences");
const generatedResults = document.querySelector("#generatedResults");
const referenceBlock = document.querySelector("#referenceBlock");
const referenceGrid = document.querySelector("#referenceGrid");
const referenceMessage = document.querySelector("#referenceMessage");
const pricingMessage = document.querySelector("#pricingMessage");
const proForm = document.querySelector("#proForm");
const proCancelBtn = document.querySelector("#proCancelBtn");
const proFormMessage = document.querySelector("#proFormMessage");
const copyBlock = document.querySelector("#copyBlock");
const copyGrid = document.querySelector("#copyGrid");
const standardReportBlock = document.querySelector("#standardReportBlock");
const standardReportGrid = document.querySelector("#standardReportGrid");
const downloadAllBtn = document.querySelector("#downloadAllBtn");
const downloadReportBtn = document.querySelector("#downloadReportBtn");
const downloadCopyBtn = document.querySelector("#downloadCopyBtn");
const saveStandardSampleBtn = document.querySelector("#saveStandardSampleBtn");
const saveProfessionalSampleBtn = document.querySelector("#saveProfessionalSampleBtn");
const operationProgress = document.querySelector("#operationProgress");
const progressTitle = document.querySelector("#progressTitle");
const progressPercent = document.querySelector("#progressPercent");
const progressFill = document.querySelector("#progressFill");
const progressDetail = document.querySelector("#progressDetail");
const progressHint = document.querySelector("#progressHint");
const progressSteps = document.querySelector("#progressSteps");

const progressFlows = {
  diagnose: ["校验照片", "分析商务形象", "生成基础诊断"],
  standard: ["确认基础诊断", "生成 12 项报告", "生成参考形象图", "整理结果"],
  pro: ["确认基础诊断", "生成 12 项报告", "生成参考形象图", "生成英文简介", "整理专业形象包"],
  singleImage: ["确认场景提示词", "等待保脸生图", "更新图片卡片"]
};

const standardReportGroups = [
  { title: "照片呈现", range: [0, 5], note: "先解决头像是否可信、清楚、适合商务场景。" },
  { title: "信任定位", range: [5, 7], note: "让客户快速判断你是谁、服务谁、是否值得继续了解。" },
  { title: "文字触点", range: [7, 10], note: "让当前照片和 LinkedIn、英文简介、官网 About 的信任表达保持一致。" },
  { title: "执行清单", range: [10, 12], note: "把建议落到展会、名片、邮箱签名和 30 天更新计划。" }
];

loadFixedSamples();
initSampleAdminMode();

const reportPriorities = ["高", "高", "高", "中", "中", "高", "高", "高", "中", "中", "中", "高"];

portraitInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    flashButton("请上传图片文件");
    return;
  }

  uploadEmpty.hidden = false;
  portraitPreview.hidden = true;
  generateBtn.disabled = true;
  generateBtn.textContent = "正在压缩图片...";

  compressImageFile(file)
    .then((dataUrl) => {
      state.imageData = dataUrl;
    portraitPreview.src = state.imageData;
    portraitPreview.hidden = false;
    uploadEmpty.hidden = true;
    state.hasImage = true;
    state.lastReport = null;
    resetReportOutput();
    })
    .catch(() => {
      flashButton("图片处理失败");
    })
    .finally(() => {
      generateBtn.disabled = false;
      generateBtn.textContent = "生成基础诊断";
    });
});

document.querySelectorAll(".service-pill").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".service-pill").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.scenario = button.dataset.scenario;
    state.lastReport = null;
    resetReportOutput();
  });
});

generateBtn.addEventListener("click", async () => {
  if (!state.hasImage) {
    flashButton("请先上传一张照片");
    return;
  }

  generateBtn.textContent = "分析中...";
  generateBtn.disabled = true;
  startProgress("diagnose", "基础诊断生成中", "正在上传并分析当前商务头像。", 8, 88);

  try {
    updateProgress(28, "照片已读取，正在请求 AI 视觉分析。", 1);
    const response = await fetch("/api/business-image/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDiagnosisPayload())
    });

    if (!response.ok) throw new Error(`diagnose failed: ${response.status}`);
    updateProgress(78, "已收到分析结果，正在整理基础诊断。", 2);
    const report = await response.json();
    state.lastReport = report;
    renderReport(report);
    completeProgress("基础诊断已生成完成。");
  } catch (error) {
    const report = {
      ...fallbackReports[state.scenario],
      paidModules
    };
    state.lastReport = report;
    renderReport(report);
    completeProgress("接口暂不可用，已使用本地模板生成基础诊断。");
  } finally {
    generateBtn.textContent = "重新生成基础诊断";
    generateBtn.disabled = false;
  }
});

leadBtn.addEventListener("click", () => {
  openCustomLeadForm("我想了解定制方案压缩包。");
});

downloadAllBtn.addEventListener("click", async () => {
  downloadAllBtn.disabled = true;
  const originalText = downloadAllBtn.textContent;
  downloadAllBtn.textContent = "打包中...";
  try {
    await downloadAllResults();
  } finally {
    downloadAllBtn.disabled = false;
    downloadAllBtn.textContent = originalText;
  }
});

downloadReportBtn.addEventListener("click", () => {
  if (!state.lastStandardReport) return;
  downloadTextFile("business-image-standard-report.txt", buildStandardReportDownloadText(state.lastStandardReport));
});

downloadCopyBtn.addEventListener("click", () => {
  if (!state.lastProfessionalCopy) return;
  downloadTextFile("business-image-english-profile.txt", buildCopyDownloadText(state.lastProfessionalCopy));
});

saveStandardSampleBtn.addEventListener("click", async () => {
  await saveFixedStandardSampleFromCurrentResult();
});

saveProfessionalSampleBtn.addEventListener("click", async () => {
  await saveFixedProfessionalSampleFromCurrentResult();
});

async function generateReferenceOnline(plan, profile = {}) {
  const flow = plan === "pro" ? "pro" : "standard";
  const planName = plan === "pro" ? "专业形象包" : "标准报告";
  startProgress(
    flow,
    `${planName}生成中`,
    state.lastReport ? "正在准备在线生成内容。" : "将先补齐基础诊断，再继续生成套餐内容。",
    6,
    92
  );

  const hasReport = await ensureBaseReport();
  if (!hasReport) {
    failProgress("需要先上传头像后才能继续生成。");
    return;
  }

  setPlanButtonsDisabled(true);
  pricingMessage.textContent = `正在在线生成「${planName}」，生成图片可能需要 1-3 分钟。`;

  try {
    updateProgress(plan === "pro" ? 38 : 42, "基础诊断已确认，正在生成 12 项标准报告。", 1);
    if (state.imageData) {
      showProgressHint("保脸参考图需要调用图片编辑接口，通常需要 3-8 分钟；系统会自动等待和重试，请不要刷新页面或重复点击。");
    }
    const response = await fetch("/api/business-image/generate-reference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        scenario: state.scenario,
        role: getRoleValue(),
        audience: getAudienceValue(),
        imageData: state.imageData,
        report: state.lastReport,
        profile
      })
    });

    if (!response.ok) throw new Error(`reference failed: ${response.status}`);
    updateProgress(plan === "pro" ? 72 : 78, "报告内容已返回，正在整理参考图和展示结果。", plan === "pro" ? 3 : 2);
    const result = await response.json();
    renderStandardReport(result.standardReport);
    renderReferencePack(result);
    renderProfessionalCopy(result.professionalCopy);
    pricingMessage.textContent = result.imageStatus === "generated"
      ? `「${planName}」已生成完成，可在下方生成结果区查看。`
      : result.imageStatus === "partial"
        ? `「${planName}」的报告和文案已生成；参考图仅返回 ${result.generatedCount || 0}/${result.totalImageCount || result.references?.length || 0} 张，未返回图片的场景可再次点击在线生成重试。`
        : `「${planName}」的 12 项报告已生成；参考图接口暂未返回图片，已先展示参考提示词。`;
    finishPackageProgress(planName, result);
  } catch (error) {
    referenceMessage.textContent = "在线生成暂不可用，请稍后重试或选择定制海外商务形象设计方案。";
    pricingMessage.textContent = `「${planName}」生成失败，接口可能超时或暂不可用。`;
    failProgress(`「${planName}」生成失败，请稍后重试。`);
  } finally {
    setPlanButtonsDisabled(false);
  }
}

planButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    selectPlanCard(button);

    if (plan === "free") {
      resetGeneratedResults();
      referenceMessage.textContent = "免费版用于获客，只保留基础诊断。";
      pricingMessage.textContent = "当前为免费诊断版：可查看评分、主要问题和 3 条建议。";
      leadForm.hidden = true;
      return;
    }

    const planName = button.closest(".price-card").querySelector("span").textContent;
    if (plan === "standard" || plan === "pro") {
      leadForm.hidden = true;
      if (plan === "pro") {
        if (!state.hasImage) {
          proForm.hidden = true;
          pricingMessage.textContent = "请先上传头像，再填写专业形象包信息。";
          document.querySelector(".input-panel").scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        proForm.hidden = false;
        pricingMessage.textContent = "已选择「专业形象包」，请先补充业务信息，再在线生成英文简介和参考形象图。";
        proForm.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector("#proNameInput").focus();
        return;
      }
      proForm.hidden = true;
      pricingMessage.textContent = `已选择「${planName}」，将直接在线生成，不需要联系人工。`;
      generateReferenceOnline(plan);
      return;
    }

    proForm.hidden = true;
    leadForm.hidden = false;
    pricingMessage.textContent = `已选择「${planName}」，请在下方提交定制需求。`;
    fillCustomLeadFormDefaults(`我想了解${planName}。`);
    leadForm.scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelector("#contactInput").focus();
  });
});

sampleButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const sample = button.dataset.sample;
    await ensureFixedSample(sample);
    selectSampleTab(sample, true);
    const matchingPlanButton = document.querySelector(`[data-plan="${sample}"]`);
    if (matchingPlanButton) selectPlanCard(matchingPlanButton);
  });
});

sampleTabs.forEach((button) => {
  button.addEventListener("click", async () => {
    const sample = button.dataset.sampleTab;
    await ensureFixedSample(sample);
    selectSampleTab(sample, false);
  });
});

standardSampleToggle.addEventListener("click", () => {
  const isExpanded = standardSampleToggle.dataset.expanded === "true";
  document.querySelectorAll("#standardSampleList .sample-extra").forEach((item) => {
    item.hidden = isExpanded;
  });
  standardSampleToggle.dataset.expanded = String(!isExpanded);
  standardSampleToggle.textContent = isExpanded ? "展开查看 12 项完整样例" : "收起完整样例";
});

professionalSampleToggle.addEventListener("click", () => {
  const isExpanded = professionalSampleToggle.dataset.expanded === "true";
  document.querySelectorAll("#professionalSampleReport .sample-extra").forEach((item) => {
    item.hidden = isExpanded;
  });
  professionalSampleToggle.dataset.expanded = String(!isExpanded);
  professionalSampleToggle.textContent = isExpanded ? "展开查看 12 项完整样例" : "收起完整样例";
});

function selectPlanCard(button) {
  document.querySelectorAll("[data-plan]").forEach((item) => item.classList.remove("selected"));
  document.querySelectorAll(".price-card").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  button.closest(".price-card")?.classList.add("selected");
}

function selectSampleTab(target = "standard", shouldScroll = false) {
  const next = ["standard", "pro", "human"].includes(target) ? target : "standard";
  sampleTabs.forEach((button) => {
    const active = button.dataset.sampleTab === next;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  samplePanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.samplePanel === next);
  });
  if (shouldScroll) {
    samplePreview.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

selectSampleTab("standard", false);

async function loadFixedSamples() {
  await Promise.all([
    loadFixedStandardSample(),
    loadFixedProfessionalSample()
  ]);
}

async function loadFixedStandardSample() {
  try {
    const response = await fetch("/tools/business-image/data/standard-report-sample.json", { cache: "no-store" });
    if (!response.ok) return false;
    const sample = await response.json();
    renderFixedStandardSample(sample);
    state.fixedSamples.standardLoaded = true;
    return true;
  } catch {
    // Static HTML remains as fallback if the local sample file is unavailable.
    return false;
  }
}

async function loadFixedProfessionalSample() {
  try {
    const response = await fetch("/tools/business-image/data/professional-package-sample.json", { cache: "no-store" });
    if (!response.ok) return false;
    const sample = await response.json();
    renderFixedProfessionalSample(sample);
    state.fixedSamples.professionalLoaded = true;
    return true;
  } catch {
    // Static HTML remains as fallback if the local sample file is unavailable.
    return false;
  }
}

async function ensureFixedSample(sample) {
  if (sample === "standard") {
    return loadFixedStandardSample();
  }
  if (sample === "pro") {
    return loadFixedProfessionalSample();
  }
  return false;
}

async function initSampleAdminMode() {
  if (!sampleAdminToken) {
    updateDownloadAllVisibility();
    return;
  }

  try {
    const response = await fetch("/api/business-image/sample-admin", {
      headers: { "x-sample-admin-token": sampleAdminToken }
    });
    const result = await response.json();
    state.canManageSamples = Boolean(result.ok);
    if (state.canManageSamples) {
      sessionStorage.setItem("sampleAdminToken", sampleAdminToken);
    } else {
      sessionStorage.removeItem("sampleAdminToken");
    }
  } catch {
    state.canManageSamples = false;
  }
  updateDownloadAllVisibility();
}

function renderFixedStandardSample(sample = {}) {
  const report = Array.isArray(sample.standardReport) ? sample.standardReport : [];
  if (report.length >= 12) {
    standardSampleList.innerHTML = "";
    report.slice(0, 12).forEach((item, index) => {
      const card = document.createElement("article");
      if (index >= 4) card.className = "sample-extra";
      if (index >= 4) card.hidden = true;
      card.innerHTML = `
        <span>${String(index + 1).padStart(2, "0")} ${escapeHtml(item.title)}</span>
        <strong>判断</strong>
        <p>${escapeHtml(item.advice)}</p>
        <strong>动作</strong>
        <p>${escapeHtml(item.action)}</p>
      `;
      standardSampleList.appendChild(card);
    });
    standardSampleToggle.dataset.expanded = "false";
    standardSampleToggle.textContent = "展开查看 12 项完整样例";
  }

  const references = Array.isArray(sample.references) ? sample.references.slice(0, 2) : [];
  if (references.length) {
    standardSampleReferences.innerHTML = "";
    references.forEach((item, index) => {
      const card = document.createElement("article");
      const imageUrl = safeImageUrl(item.imageUrl);
      const imageMarkup = imageUrl
        ? `<img class="sample-reference-image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(item.title)}" loading="lazy" />`
        : `<div class="sample-image-placeholder ${index === 1 ? "website" : ""}">
            <span>${escapeHtml(item.label || (index === 0 ? "LinkedIn" : "Website"))}</span>
            <strong>${escapeHtml(item.title || "参考形象图")}</strong>
          </div>`;
      card.innerHTML = `
        ${imageMarkup}
        <h4>${escapeHtml(item.title || "参考形象图")}</h4>
        <p>${escapeHtml(item.description || "基于上传照片生成的参考形象图。")}</p>
        <em>实际生成会基于用户上传照片保留本人脸部特征。</em>
      `;
      standardSampleReferences.appendChild(card);
    });
  }
}

function renderFixedProfessionalSample(sample = {}) {
  const report = Array.isArray(sample.standardReport) ? sample.standardReport : [];
  if (professionalSampleReport && report.length) {
    professionalSampleReport.innerHTML = "";
    report.slice(0, 12).forEach((item, index) => {
      const card = document.createElement("article");
      if (index >= 4) card.className = "sample-extra";
      if (index >= 4) card.hidden = true;
      card.innerHTML = `
        <span>${String(index + 1).padStart(2, "0")} ${escapeHtml(item.title || "照片诊断项目")}</span>
        <strong>判断</strong>
        <p>${escapeHtml(item.advice || "根据上传照片判断当前商务形象问题。")}</p>
        <strong>动作</strong>
        <p>${escapeHtml(item.action || "按建议调整照片、文案和使用场景。")}</p>
      `;
      professionalSampleReport.appendChild(card);
    });
    if (professionalSampleToggle) {
      professionalSampleToggle.hidden = report.length <= 4;
      professionalSampleToggle.dataset.expanded = "false";
      professionalSampleToggle.textContent = "展开查看 12 项完整样例";
    }
  }

  const copy = sample.professionalCopy || {};
  if (professionalSampleCopy && (copy.headline || copy.about || copy.websiteAbout || copy.signature)) {
    professionalSampleCopy.innerHTML = [
      ["LinkedIn Headline", copy.headline],
      ["LinkedIn About", copy.about],
      ["Website About", copy.websiteAbout],
      ["Email Signature", copy.signature]
    ].map(([label, value]) => `
      <article>
        <span>${escapeHtml(label)}</span>
        <p>${escapeHtml(value || "")}</p>
      </article>
    `).join("");
  }

  const references = Array.isArray(sample.references) ? sample.references.slice(0, 6) : [];
  if (professionalSampleReferences && references.length) {
    professionalSampleReferences.innerHTML = "";
    references.forEach((item, index) => {
      const card = document.createElement("article");
      const imageUrl = safeImageUrl(item.imageUrl);
      const imageMarkup = imageUrl
        ? `<img class="sample-reference-image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(item.title)}" loading="lazy" />`
        : `<div class="sample-image-placeholder ${index === 1 ? "website" : ""}">
            <span>${escapeHtml(item.label || `Scene ${index + 1}`)}</span>
            <strong>${escapeHtml(item.title || "专业形象参考图")}</strong>
          </div>`;
      card.innerHTML = `
        ${imageMarkup}
        <h4>${escapeHtml(item.title || "专业形象参考图")}</h4>
        <p>${escapeHtml(item.description || "专业形象包会生成不同商务场景的参考图。")}</p>
        <em>实际生成会基于用户上传照片保留本人脸部特征。</em>
      `;
      professionalSampleReferences.appendChild(card);
    });
  }
}

proCancelBtn.addEventListener("click", () => {
  proForm.hidden = true;
  pricingMessage.textContent = "已收起专业形象包信息表。标准报告可直接在线生成；定制方案需要留下联系方式。";
});

proForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const profile = getProProfile();
  const submitButton = proForm.querySelector('button[type="submit"]');

  if (!profile.name || !profile.title || !profile.services || !profile.strengths) {
    showProFormMessage("请至少补充姓名/品牌、身份、主要服务和核心优势。", true);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "专业形象包生成中...";
  showProFormMessage("信息已收到，正在生成专业形象包。若尚未生成基础诊断，系统会先自动补齐。", false);
  try {
    await generateReferenceOnline("pro", profile);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "开始生成专业形象包";
  }
});

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const contact = document.querySelector("#contactInput").value.trim();
  const customRole = document.querySelector("#customRoleInput").value.trim();
  const customAudience = document.querySelector("#customAudienceInput").value.trim();
  const customScene = document.querySelector("#customSceneInput").value.trim();
  const customPhoto = document.querySelector("#customPhotoInput").value.trim();
  const customCopy = document.querySelector("#customCopyInput").value.trim();
  const note = document.querySelector("#noteInput").value.trim();
  const files = Array.from(document.querySelector("#customFilesInput").files || []);

  if (!contact) {
    showFormMessage("请留下微信或手机号，方便确认定制方案范围。", true);
    return;
  }

  try {
    const formData = new FormData();
    formData.append("contact", contact);
    formData.append("customRole", customRole);
    formData.append("customAudience", customAudience);
    formData.append("customScene", customScene);
    formData.append("customPhoto", customPhoto);
    formData.append("customCopy", customCopy);
    formData.append("note", note);
    formData.append("scenario", state.scenario);
    formData.append("role", getRoleValue());
    formData.append("audience", getAudienceValue());
    formData.append("reportSummary", state.lastReport?.summary || "");
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/business-image/leads", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error(`lead failed: ${response.status}`);
    showFormMessage("已收到定制需求和上传文件。后续可根据照片、业务信息和使用场景确认方案范围与报价。", false);
    leadForm.reset();
  } catch (error) {
    showFormMessage("当前静态预览无法保存线索；请使用 Node 服务地址打开。", true);
  }
});

function openCustomLeadForm(note = "") {
  leadForm.hidden = false;
  fillCustomLeadFormDefaults(note);
  leadForm.scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelector("#contactInput").focus();
}

function fillCustomLeadFormDefaults(note = "") {
  const roleInput = document.querySelector("#customRoleInput");
  const audienceInput = document.querySelector("#customAudienceInput");
  const sceneInput = document.querySelector("#customSceneInput");
  const noteInput = document.querySelector("#noteInput");
  if (roleInput && !roleInput.value.trim()) roleInput.value = getRoleValue();
  if (audienceInput && !audienceInput.value.trim()) audienceInput.value = getAudienceValue();
  if (sceneInput && !sceneInput.value.trim()) sceneInput.value = scenarioNames[state.scenario] || "";
  if (noteInput && note && !noteInput.value.trim()) noteInput.value = note;
}

function buildDiagnosisPayload() {
  return {
    scenario: state.scenario,
    scenarioName: scenarioNames[state.scenario],
    role: getRoleValue(),
    audience: getAudienceValue(),
    goals: Array.from(document.querySelectorAll('input[name="goal"]:checked')).map((item) => item.value),
    imageData: state.imageData
  };
}

async function ensureBaseReport() {
  if (state.lastReport) {
    updateProgress(18, "基础诊断已存在，继续生成套餐内容。", 0);
    return true;
  }

  if (!state.hasImage) {
    pricingMessage.textContent = "请先上传头像，再生成报告。";
    referenceMessage.textContent = "上传头像后，系统会在当前页生成基础诊断、标准报告和专业形象包。";
    document.querySelector(".input-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return false;
  }

  pricingMessage.textContent = "正在先生成基础诊断，然后继续生成在线套餐。";
  try {
    updateProgress(18, "正在先生成基础诊断。", 0);
    const response = await fetch("/api/business-image/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDiagnosisPayload())
    });

    if (!response.ok) throw new Error(`diagnose failed: ${response.status}`);
    const report = await response.json();
    state.lastReport = report;
    renderReport(report);
    updateProgress(30, "基础诊断已完成，继续生成套餐内容。", 0);
    return true;
  } catch (error) {
    const report = {
      ...fallbackReports[state.scenario],
      paidModules
    };
    state.lastReport = report;
    renderReport(report);
    pricingMessage.textContent = "基础诊断接口暂不可用，已使用本地报告模板继续生成。";
    updateProgress(30, "基础诊断已用本地模板补齐，继续生成套餐内容。", 0);
    return true;
  }
}

function startProgress(flow, title, detail, initial = 5, cap = 90) {
  clearProgressTimer();
  state.progressFlow = flow;
  state.progressValue = initial;
  operationProgress.hidden = false;
  progressTitle.textContent = title;
  hideProgressHint();
  renderProgressSteps(flow, 0);
  setProgress(initial, detail);
  state.progressTimer = window.setInterval(() => {
    if (state.progressValue >= cap) return;
    const next = Math.min(cap, state.progressValue + (state.progressValue < 55 ? 6 : 3));
    setProgress(next, progressDetail.textContent);
  }, 1400);
}

function updateProgress(percent, detail, activeIndex = 0) {
  if (!operationProgress.hidden) {
    state.progressValue = Math.max(state.progressValue, percent);
    renderProgressSteps(state.progressFlow, activeIndex);
    setProgress(state.progressValue, detail);
  }
}

function completeProgress(detail) {
  clearProgressTimer();
  state.progressValue = 100;
  renderProgressSteps(state.progressFlow, progressFlows[state.progressFlow]?.length || 0);
  setProgress(100, detail);
  hideProgressHint();
  operationProgress.classList.remove("partial", "error");
  operationProgress.classList.add("complete");
}

function partialProgress(detail, title = "部分完成") {
  clearProgressTimer();
  state.progressValue = 92;
  progressTitle.textContent = title;
  renderProgressSteps(state.progressFlow, Math.max(0, (progressFlows[state.progressFlow]?.length || 1) - 1));
  setProgress(92, detail);
  hideProgressHint();
  operationProgress.classList.remove("complete", "error");
  operationProgress.classList.add("partial");
}

function failProgress(detail) {
  clearProgressTimer();
  setProgress(Math.max(state.progressValue, 100), detail);
  hideProgressHint();
  operationProgress.classList.remove("complete", "partial");
  operationProgress.classList.add("error");
}

function setProgress(percent, detail) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  progressPercent.textContent = `${safePercent}%`;
  progressFill.style.width = `${safePercent}%`;
  progressDetail.textContent = detail;
}

function showProgressHint(text) {
  progressHint.textContent = text;
  progressHint.hidden = false;
}

function hideProgressHint() {
  progressHint.textContent = "";
  progressHint.hidden = true;
}

function renderProgressSteps(flow, activeIndex) {
  const steps = progressFlows[flow] || [];
  progressSteps.innerHTML = "";
  operationProgress.classList.remove("complete", "partial", "error");
  steps.forEach((label, index) => {
    const item = document.createElement("span");
    item.textContent = label;
    item.className = index < activeIndex ? "done" : index === activeIndex ? "active" : "";
    progressSteps.appendChild(item);
  });
}

function clearProgressTimer() {
  if (state.progressTimer) {
    window.clearInterval(state.progressTimer);
    state.progressTimer = null;
  }
}

function getRoleValue() {
  return roleInput.value.trim() || "跨境服务顾问";
}

function getAudienceValue() {
  return audienceInput.value.trim() || "海外客户";
}

function renderReport(report) {
  resetGeneratedResults();
  emptyReport.hidden = true;
  reportContent.hidden = false;
  scoreValue.textContent = report.score;
  mainIssue.textContent = report.issue;
  styleDirection.textContent = report.direction;
  scenarioLabel.textContent = scenarioNames[state.scenario];
  reportMode.textContent = report.source === "openai" ? "OpenAI" : "Demo";
  reportMode.classList.toggle("demo", report.source !== "openai");
  demoNotice.hidden = report.source === "openai";
  insightList.innerHTML = "";

  const insights = report.quickInsights || report.insights || [];
  insights.forEach((text, index) => {
    const item = document.createElement("article");
    item.className = "insight-item";
    item.innerHTML = `<b>${index + 1}</b><p>${escapeHtml(text)}</p>`;
    insightList.appendChild(item);
  });

}

function resetGeneratedResults() {
  state.lastReferenceResult = null;
  state.lastStandardReport = null;
  state.lastProfessionalCopy = null;
  downloadAllBtn.hidden = true;
  downloadReportBtn.hidden = true;
  downloadCopyBtn.hidden = true;
  saveStandardSampleBtn.hidden = true;
  saveProfessionalSampleBtn.hidden = true;
  generatedResults.hidden = true;
  standardReportBlock.hidden = true;
  referenceBlock.hidden = true;
  copyBlock.hidden = true;
  standardReportGrid.innerHTML = "";
  referenceGrid.innerHTML = "";
  copyGrid.innerHTML = "";
  referenceMessage.textContent = "";
  hideProgressHint();
}

function resetReportOutput() {
  clearProgressTimer();
  operationProgress.hidden = true;
  emptyReport.hidden = false;
  reportContent.hidden = true;
  scoreValue.textContent = "--";
  mainIssue.textContent = "";
  styleDirection.textContent = "";
  scenarioLabel.textContent = "";
  reportMode.textContent = "Demo report";
  reportMode.classList.remove("demo");
  demoNotice.hidden = true;
  insightList.innerHTML = "";
  resetGeneratedResults();
}

function renderReferencePack(result) {
  state.lastReferenceResult = result;
  updateDownloadAllVisibility();
  generatedResults.hidden = false;
  referenceBlock.hidden = false;
  referenceGrid.innerHTML = "";
  result.references.forEach((item, index) => {
    const card = document.createElement("article");
    const imageUrl = safeImageUrl(item.imageUrl);
    card.className = `reference-card ${imageUrl ? "ready" : "missing"}`;
    card.dataset.referenceIndex = String(index);
    card.innerHTML = `
      ${imageUrl
        ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(item.title)}" loading="lazy" />`
        : `<div class="reference-placeholder">
            <strong>图片未返回</strong>
            <small>${escapeHtml(item.imageError || "已保留提示词，可重试生成")}</small>
            <button type="button" class="retry-reference-btn" data-reference-index="${index}">重新生成此图</button>
          </div>`}
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      ${item.identityWarning ? `<em class="reference-warning">${escapeHtml(item.identityWarning)}</em>` : ""}
      <p>${escapeHtml(item.description || "已保留该场景的图片生成提示词，可点击上方按钮重新生成图片。")}</p>
      <div class="reference-card-actions">
        ${imageUrl ? `<button type="button" class="download-image-btn" data-reference-index="${index}">下载图片</button>` : ""}
      </div>
    `;
    referenceGrid.appendChild(card);
  });
  referenceMessage.textContent = result.message;
}

referenceGrid.addEventListener("click", async (event) => {
  const downloadButton = event.target.closest(".download-image-btn");
  if (downloadButton) {
    const index = Number(downloadButton.dataset.referenceIndex);
    const item = state.lastReferenceResult?.references?.[index];
    const imageUrl = safeImageUrl(item?.imageUrl);
    if (imageUrl) {
      downloadImage(imageUrl, `${slugify(item.label || "reference")}-${index + 1}.png`);
    }
    return;
  }

  const button = event.target.closest(".retry-reference-btn");
  if (!button) return;
  if (state.isSingleImageRetrying) {
    showProgressHint("已有一张参考图正在重新生成，请等待当前请求完成后再重试下一张。");
    return;
  }
  const index = Number(button.dataset.referenceIndex);
  const item = state.lastReferenceResult?.references?.[index];
  if (!item) return;

  button.disabled = true;
  button.textContent = "重新生成中...";
  state.isSingleImageRetrying = true;
  setRetryReferenceButtonsDisabled(true);
  await retryReferenceImage(index, item, button);
});

async function retryReferenceImage(index, item, button) {
  try {
    startProgress("singleImage", "单张保脸参考图生成中", `正在重新生成「${item.title || item.label}」，图片接口可能需要数分钟返回。`, 12, 94);
    showProgressHint("正在保留上传照片中的本人脸部特征生成图片。等待期间请不要刷新页面；如果提示账号并发已满，请等当前请求结束后再试。");
    const response = await fetch("/api/business-image/generate-single-reference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: state.scenario,
        role: getRoleValue(),
        audience: getAudienceValue(),
        imageData: state.imageData,
        label: item.label,
        title: item.title,
        description: item.description,
        prompt: item.prompt
      })
    });

    if (!response.ok) throw new Error(`single reference failed: ${response.status}`);
    const result = await response.json();
    const nextItem = { ...item, ...(result.item || {}), imageError: result.item?.imageError || item.imageError };
    state.lastReferenceResult.references[index] = nextItem;
    renderReferencePack(state.lastReferenceResult);
    refreshReferenceProgress();
  } catch (error) {
    const nextItem = { ...item, imageError: "单张重试失败，请稍后再试。" };
    state.lastReferenceResult.references[index] = nextItem;
    renderReferencePack(state.lastReferenceResult);
    failProgress("单张保脸参考图生成失败，请稍后再次点击重试。");
  } finally {
    state.isSingleImageRetrying = false;
    setRetryReferenceButtonsDisabled(false);
    button.disabled = false;
    button.textContent = "重新生成此图";
  }
}

function refreshReferenceProgress() {
  const references = state.lastReferenceResult?.references || [];
  const generated = references.filter((item) => item.imageUrl).length;
  state.lastReferenceResult.generatedCount = generated;
  state.lastReferenceResult.imageStatus = generated === 0
    ? "prompt_only"
    : generated === references.length
      ? "generated"
      : "partial";
  finishPackageProgress(state.lastReferenceResult.plan === "pro" ? "专业形象包" : "标准报告", state.lastReferenceResult);
}

function finishPackageProgress(planName, result) {
  const total = result.totalImageCount || result.references?.length || 0;
  const generated = result.generatedCount || result.references?.filter((item) => item.imageUrl).length || 0;
  if (result.imageStatus === "generated") {
    completeProgress(`「${planName}」已生成完成。`);
    return;
  }

  if (result.imageStatus === "partial") {
    partialProgress(`「${planName}」部分完成：报告和文案已生成，参考图返回 ${generated}/${total} 张。`, `${planName}部分完成`);
    return;
  }

  partialProgress(`「${planName}」图片未生成：报告和文案已生成，但参考图接口未返回图片。`, `${planName}图片未生成`);
}

function renderStandardReport(items) {
  if (!Array.isArray(items) || items.length === 0) {
    standardReportBlock.hidden = true;
    standardReportGrid.innerHTML = "";
    return;
  }

  generatedResults.hidden = false;
  state.lastStandardReport = items;
  updateDownloadAllVisibility();
  downloadReportBtn.hidden = false;
  standardReportGrid.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "standard-report-summary";
  summary.innerHTML = `
    <strong>阅读顺序</strong>
    <p>先看高优先级项，再按「照片呈现 → 信任定位 → 文字触点 → 执行清单」执行。每项只保留一个判断和一个动作。</p>
  `;
  standardReportGrid.appendChild(summary);

  standardReportGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "standard-report-group";
    section.innerHTML = `
      <div class="standard-report-group-title">
        <h4>${escapeHtml(group.title)}</h4>
        <p>${escapeHtml(group.note)}</p>
      </div>
    `;

    const list = document.createElement("div");
    list.className = "standard-report-list";
    items.slice(group.range[0], group.range[1]).forEach((item, offset) => {
      const index = group.range[0] + offset;
      const card = document.createElement("article");
      const priority = item.priority || reportPriorities[index] || "中";
      card.className = `standard-report-card priority-${priority === "高" ? "high" : "normal"}`;
      card.innerHTML = `
        <div class="standard-card-meta">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <b>${escapeHtml(priority)}优先级</b>
        </div>
        <strong>${escapeHtml(item.title)}</strong>
        <dl>
          <div>
            <dt>判断</dt>
            <dd>${escapeHtml(item.advice)}</dd>
          </div>
          <div>
            <dt>动作</dt>
            <dd>${escapeHtml(item.action)}</dd>
          </div>
        </dl>
      `;
      list.appendChild(card);
    });
    section.appendChild(list);
    standardReportGrid.appendChild(section);
  });
  standardReportBlock.hidden = false;
  generatedResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveFixedStandardSampleFromCurrentResult() {
  const report = state.lastStandardReport;
  const references = (state.lastReferenceResult?.references || []).filter((item) => item.imageUrl).slice(0, 2);
  if (!Array.isArray(report) || report.length < 12 || references.length < 2) {
    pricingMessage.textContent = "当前结果还不能保存为标准报告样例：需要 12 项报告和至少 2 张已生成参考图。";
    return;
  }

  const sample = {
    source: "generated",
    savedAt: new Date().toISOString(),
    note: "以下为脱敏固定样例，实际报告会根据用户上传照片生成。",
    standardReport: report.slice(0, 12),
    references: references.map((item) => ({
      label: item.label,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      imageMode: item.imageMode
    }))
  };

  await saveFixedSample({
    button: saveStandardSampleBtn,
    endpoint: "/api/business-image/standard-sample",
    sample,
    onSaved: () => renderFixedStandardSample(sample),
    successMessage: "当前生成结果已保存为标准报告固定样例。"
  });
}

async function saveFixedProfessionalSampleFromCurrentResult() {
  const report = state.lastStandardReport;
  const references = (state.lastReferenceResult?.references || []).filter((item) => item.imageUrl).slice(0, 6);
  const professionalCopy = state.lastProfessionalCopy;
  if (!Array.isArray(report) || report.length < 12 || references.length < 6 || !professionalCopy) {
    pricingMessage.textContent = "当前结果还不能保存为专业形象包样例：需要 12 项报告、英文简介和 6 张已生成参考图。";
    return;
  }

  const sample = {
    source: "generated",
    savedAt: new Date().toISOString(),
    note: "以下为专业形象包固定样例，实际内容会根据用户上传照片和业务信息生成。",
    standardReport: report.slice(0, 12),
    professionalCopy,
    references: references.map((item) => ({
      label: item.label,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      imageMode: item.imageMode
    }))
  };

  await saveFixedSample({
    button: saveProfessionalSampleBtn,
    endpoint: "/api/business-image/professional-sample",
    sample,
    onSaved: () => renderFixedProfessionalSample(sample),
    successMessage: "当前生成结果已保存为专业形象包固定样例。"
  });
}

async function saveFixedSample({ button, endpoint, sample, onSaved, successMessage }) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "保存中...";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sample-admin-token": sampleAdminToken
      },
      body: JSON.stringify(sample)
    });
    if (response.ok) {
      onSaved();
      pricingMessage.textContent = successMessage;
      return;
    }
    throw new Error(`save failed: ${response.status}`);
  } catch {
    pricingMessage.textContent = "固定样例保存失败，请稍后重试。";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function renderProfessionalCopy(copy) {
  if (!copy) {
    copyBlock.hidden = true;
    copyGrid.innerHTML = "";
    state.lastProfessionalCopy = null;
    downloadCopyBtn.hidden = true;
    updateDownloadAllVisibility();
    return;
  }

  const items = [
    ["LinkedIn Headline", copy.headline],
    ["LinkedIn About", copy.about],
    ["Website About", copy.websiteAbout],
    ["Email Signature", copy.signature]
  ].filter(([, value]) => value);

  copyGrid.innerHTML = "";
  items.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "copy-card";
    card.innerHTML = `<span>${escapeHtml(label)}</span><p>${escapeHtml(value)}</p>`;
    copyGrid.appendChild(card);
  });
  if (items.length > 0) {
    generatedResults.hidden = false;
    state.lastProfessionalCopy = copy;
    updateDownloadAllVisibility();
    downloadCopyBtn.hidden = false;
  }
  copyBlock.hidden = items.length === 0;
}

function updateDownloadAllVisibility() {
  const hasReport = Array.isArray(state.lastStandardReport) && state.lastStandardReport.length > 0;
  const hasCopy = Boolean(state.lastProfessionalCopy);
  const hasReferences = Array.isArray(state.lastReferenceResult?.references) && state.lastReferenceResult.references.length > 0;
  downloadAllBtn.hidden = !(hasReport || hasCopy || hasReferences);
  saveStandardSampleBtn.hidden = !state.canManageSamples || !canSaveStandardSample();
  saveProfessionalSampleBtn.hidden = !state.canManageSamples || !canSaveProfessionalSample();
}

function canSaveStandardSample() {
  const report = state.lastStandardReport;
  const references = (state.lastReferenceResult?.references || []).filter((item) => item.imageUrl);
  return Array.isArray(report) && report.length >= 12 && references.length >= 2;
}

function canSaveProfessionalSample() {
  const report = state.lastStandardReport;
  const references = (state.lastReferenceResult?.references || []).filter((item) => item.imageUrl);
  return Array.isArray(report) && report.length >= 12 && references.length >= 6 && Boolean(state.lastProfessionalCopy);
}

function buildStandardReportDownloadText(items) {
  const lines = [
    "海外商务第一印象诊断 - 12 项标准报告",
    `生成时间：${new Date().toLocaleString()}`,
    `场景：${scenarioNames[state.scenario]}`,
    `身份：${getRoleValue()}`,
    `目标客户：${getAudienceValue()}`,
    ""
  ];

  items.forEach((item, index) => {
    lines.push(`${String(index + 1).padStart(2, "0")} ${item.title || ""}`);
    lines.push(`优先级：${item.priority || ""}`);
    lines.push(`判断：${item.advice || ""}`);
    lines.push(`动作：${item.action || ""}`);
    lines.push("");
  });
  return lines.join("\n");
}

function buildCopyDownloadText(copy) {
  return [
    "海外商务第一印象诊断 - 英文商务简介",
    `生成时间：${new Date().toLocaleString()}`,
    "",
    `LinkedIn Headline\n${copy.headline || ""}`,
    "",
    `LinkedIn About\n${copy.about || ""}`,
    "",
    `Website About\n${copy.websiteAbout || ""}`,
    "",
    `Email Signature\n${copy.signature || ""}`
  ].join("\n");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

function downloadImage(url, filename) {
  const imageUrl = safeImageUrl(url);
  if (imageUrl) triggerDownload(imageUrl, filename);
}

async function downloadAllResults() {
  const files = [];
  if (state.lastStandardReport) {
    files.push({
      name: "standard-report.txt",
      data: textToBytes(buildStandardReportDownloadText(state.lastStandardReport))
    });
  }

  if (state.lastProfessionalCopy) {
    files.push({
      name: "english-profile.txt",
      data: textToBytes(buildCopyDownloadText(state.lastProfessionalCopy))
    });
  }

  const references = state.lastReferenceResult?.references || [];
  const manifest = [];
  for (let index = 0; index < references.length; index += 1) {
    const item = references[index];
    const baseName = `${String(index + 1).padStart(2, "0")}-${slugify(item.label || item.title || "reference")}`;
    let imageStatus = item.imageError || "未生成";
    if (item.imageUrl) {
      const imageFile = await imageUrlToZipFile(item.imageUrl, `${baseName}.png`);
      if (imageFile) {
        files.push(imageFile);
        imageStatus = "已打包图片";
      } else {
        imageStatus = "图片已生成，但浏览器无法打包该远程图片，可在页面单独下载";
      }
    }
    manifest.push(`${baseName}: ${imageStatus}`);
    manifest.push(`标题：${item.title || ""}`);
    manifest.push(`提示词：${item.prompt || ""}`);
    manifest.push("");
  }

  if (manifest.length > 0) {
    files.push({ name: "reference-images-manifest.txt", data: textToBytes(manifest.join("\n")) });
  }

  if (files.length === 0) return;
  const zipBlob = createZipBlob(files);
  const url = URL.createObjectURL(zipBlob);
  triggerDownload(url, `business-image-results-${dateStamp()}.zip`);
  URL.revokeObjectURL(url);
}

async function imageUrlToZipFile(url, filename) {
  try {
    const imageUrl = safeImageUrl(url);
    if (!imageUrl) return null;
    if (imageUrl.startsWith("data:")) {
      return { name: filename, data: dataUrlToBytes(imageUrl) };
    }
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`image download failed: ${response.status}`);
    return { name: filename, data: new Uint8Array(await response.arrayBuffer()) };
  } catch (error) {
    return null;
  }
}

function createZipBlob(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((file) => {
    const nameBytes = textToBytes(file.name);
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    chunks.push(local, data);

    const centralItem = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralItem.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralItem.set(nameBytes, 46);
    central.push(centralItem);
    offset += local.length + data.length;
  });

  const centralStart = offset;
  central.forEach((item) => {
    chunks.push(item);
    offset += item.length;
  });
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, offset - centralStart, true);
  endView.setUint32(16, centralStart, true);
  chunks.push(end);
  return new Blob(chunks, { type: "application/zip" });
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function dataUrlToBytes(url) {
  const base64 = url.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function compressImageFile(file, maxSide = 1280, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => {
      const source = String(reader.result || "");
      const image = new Image();
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dateStamp() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, "") || "reference";
}

function setPlanButtonsDisabled(disabled) {
  planButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function setRetryReferenceButtonsDisabled(disabled) {
  document.querySelectorAll(".retry-reference-btn").forEach((button) => {
    button.disabled = disabled;
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function safeImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(url)) return url;
  return "";
}

function flashButton(text) {
  const original = generateBtn.textContent;
  generateBtn.textContent = text;
  setTimeout(() => {
    generateBtn.textContent = original;
  }, 1400);
}

function showFormMessage(message, isError) {
  formMessage.hidden = false;
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function showProFormMessage(message, isError) {
  proFormMessage.hidden = false;
  proFormMessage.textContent = message;
  proFormMessage.classList.toggle("error", isError);
}

function getProProfile() {
  return {
    name: document.querySelector("#proNameInput").value.trim(),
    title: document.querySelector("#proTitleInput").value.trim(),
    services: document.querySelector("#proServicesInput").value.trim(),
    strengths: document.querySelector("#proStrengthsInput").value.trim(),
    cta: document.querySelector("#proCtaInput").value.trim()
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


