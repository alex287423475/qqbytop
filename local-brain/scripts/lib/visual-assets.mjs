import fs from "fs";
import path from "path";
import matter from "gray-matter";

const publicRoot = path.resolve("public");
const markerStart = "<!-- visual-assets:start -->";
const markerEnd = "<!-- visual-assets:end -->";

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeMode(value) {
  return String(value || "standard").trim() === "fact-source" ? "fact-source" : "standard";
}

function visualTitle() {
  return "\u53ef\u89c6\u5316\u5224\u65ad\u6846\u67b6";
}

function assetDefinitions(keyword, category) {
  const cleanKeyword = keyword || "SEO article";
  const cleanCategory = category || "Translation";

  return [
    {
      fileName: "evidence-chain.svg",
      title: `${cleanKeyword} - evidence chain`,
      alt: `${cleanKeyword} evidence chain diagram`,
      svg: buildEvidenceChainSvg(cleanKeyword, cleanCategory),
    },
    {
      fileName: "risk-matrix.svg",
      title: `${cleanKeyword} - risk matrix`,
      alt: `${cleanKeyword} risk matrix`,
      svg: buildRiskMatrixSvg(cleanKeyword, cleanCategory),
    },
    {
      fileName: "workflow-map.svg",
      title: `${cleanKeyword} - workflow map`,
      alt: `${cleanKeyword} professional workflow map`,
      svg: buildWorkflowSvg(cleanKeyword, cleanCategory),
    },
  ];
}

function coverDefinition(keyword, category) {
  const cleanKeyword = keyword || "SEO article";
  const cleanCategory = category || "Translation";

  return {
    fileName: "cover.svg",
    title: `${cleanKeyword} - cover`,
    alt: `${cleanKeyword} core fact source cover`,
    svg: buildCoverSvg(cleanKeyword, cleanCategory),
  };
}

function svgFrame(title, subtitle, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 1200 680" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(subtitle)}</desc>
  <rect width="1200" height="680" fill="#f8fafc"/>
  <rect x="40" y="40" width="1120" height="600" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="80" y="105" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="34" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text x="80" y="145" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="18" fill="#475569">${escapeXml(subtitle)}</text>
  ${body}
</svg>
`;
}

function wrapText(value, max = 16) {
  const text = String(value || "").trim();
  if (!text) return [];
  const chars = Array.from(text);
  const lines = [];
  for (let index = 0; index < chars.length; index += max) {
    lines.push(chars.slice(index, index + max).join(""));
  }
  return lines.slice(0, 3);
}

function buildCoverSvg(keyword, category) {
  const titleLines = wrapText(keyword, 15);
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="90" y="${210 + index * 72}" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(keyword)}</title>
  <desc id="desc">${escapeXml(category)} core fact source cover image</desc>
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="58%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="70" y="70" width="1060" height="490" rx="30" fill="#0f172a" fill-opacity="0.58" stroke="#93c5fd" stroke-opacity="0.45"/>
  <text x="90" y="135" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="24" font-weight="700" fill="#93c5fd">北京全球博译翻译公司 · 核心事实源</text>
  ${titleSvg}
  <text x="90" y="470" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="25" fill="#dbeafe">${escapeXml(category)} · 判断标准 · 证据链 · 交付边界</text>
  <g transform="translate(790 150)">
    <rect x="0" y="0" width="270" height="270" rx="28" fill="#ffffff" fill-opacity="0.1" stroke="#bfdbfe" stroke-opacity="0.65"/>
    <path d="M58 78h154M58 128h154M58 178h98" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
    <circle cx="213" cy="181" r="36" fill="#22c55e"/>
    <path d="M197 181l12 12 26-34" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;
}

function buildEvidenceChainSvg(keyword, category) {
  const steps = [
    ["1", "Source material", "File, screenshot, record, or policy text"],
    ["2", "Context check", "Purpose, receiver, deadline, and required format"],
    ["3", "Term control", "Names, dates, product terms, legal terms"],
    ["4", "Delivery proof", "Bilingual output, notes, and revision trail"],
  ];

  const body = steps
    .map(([number, title, detail], index) => {
      const x = 90 + index * 270;
      return `
  <rect x="${x}" y="245" width="220" height="210" rx="16" fill="#eff6ff" stroke="#60a5fa" stroke-width="2"/>
  <circle cx="${x + 42}" cy="293" r="24" fill="#2563eb"/>
  <text x="${x + 42}" y="301" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${number}</text>
  <text x="${x + 28}" y="345" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="22" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <foreignObject x="${x + 28}" y="370" width="165" height="70">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,'Microsoft YaHei',sans-serif;font-size:15px;line-height:1.45;color:#475569">${escapeXml(detail)}</div>
  </foreignObject>
  ${index < steps.length - 1 ? `<path d="M ${x + 220} 350 L ${x + 260} 350" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/><path d="M ${x + 252} 338 L ${x + 266} 350 L ${x + 252} 362" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
    })
    .join("\n");

  return svgFrame(`${keyword}`, `${category}: evidence chain for reviewable translation decisions`, body);
}

function buildRiskMatrixSvg(keyword, category) {
  const cells = [
    ["Low urgency / low risk", "Basic reference translation", "#dcfce7", "#166534"],
    ["High urgency / low risk", "Fast delivery with format check", "#fef9c3", "#854d0e"],
    ["Low urgency / high risk", "Expert review and term sheet", "#dbeafe", "#1d4ed8"],
    ["High urgency / high risk", "Manual confirmation before delivery", "#fee2e2", "#991b1b"],
  ];

  const body = `
  <text x="350" y="220" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">Urgency</text>
  <text x="74" y="390" transform="rotate(-90 74 390)" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">Risk</text>
  ${cells
    .map(([title, detail, fill, color], index) => {
      const x = index % 2 === 0 ? 170 : 600;
      const y = index < 2 ? 240 : 430;
      return `
  <rect x="${x}" y="${y}" width="390" height="150" rx="14" fill="${fill}" stroke="${color}" stroke-width="2"/>
  <text x="${x + 28}" y="${y + 48}" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="23" font-weight="700" fill="${color}">${escapeXml(title)}</text>
  <foreignObject x="${x + 28}" y="${y + 70}" width="320" height="55">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,'Microsoft YaHei',sans-serif;font-size:16px;line-height:1.45;color:#334155">${escapeXml(detail)}</div>
  </foreignObject>`;
    })
    .join("\n")}
  <text x="170" y="590" font-family="Arial, sans-serif" font-size="15" fill="#64748b">Use this matrix to decide when human confirmation is required.</text>`;

  return svgFrame(`${keyword}`, `${category}: practical risk grading before quotation and delivery`, body);
}

function buildWorkflowSvg(keyword, category) {
  const lanes = [
    ["Input", "Collect files and usage scenario"],
    ["Assess", "Confirm receiver, deadline, and risk"],
    ["Translate", "Apply glossary and context rules"],
    ["Review", "Check terms, names, dates, and format"],
    ["Deliver", "Provide usable files and revision notes"],
  ];

  const body = lanes
    .map(([title, detail], index) => {
      const y = 220 + index * 72;
      const color = ["#2563eb", "#0891b2", "#059669", "#d97706", "#7c3aed"][index];
      return `
  <rect x="120" y="${y}" width="900" height="52" rx="12" fill="#f8fafc" stroke="#cbd5e1"/>
  <rect x="120" y="${y}" width="14" height="52" rx="7" fill="${color}"/>
  <text x="160" y="${y + 33}" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="22" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text x="330" y="${y + 33}" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="17" fill="#475569">${escapeXml(detail)}</text>
  ${index < lanes.length - 1 ? `<path d="M 1040 ${y + 26} L 1084 ${y + 26} L 1084 ${y + 98} L 1044 ${y + 98}" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><path d="M 1054 ${y + 88} L 1040 ${y + 98} L 1054 ${y + 108}" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
    })
    .join("\n");

  return svgFrame(`${keyword}`, `${category}: delivery workflow with quality checkpoints`, body);
}

function removeExistingVisualSection(content) {
  const pattern = new RegExp(`\\n?${markerStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "u");
  return content.replace(pattern, "\n\n").trim();
}

function insertVisualSection(content, assets) {
  const section = [
    "",
    markerStart,
    "",
    `## ${visualTitle()}`,
    "",
    ...assets.flatMap((asset) => [`![${asset.alt}](${asset.src})`, ""]),
    markerEnd,
    "",
  ].join("\n");

  const withoutOld = removeExistingVisualSection(content);
  if (/^# .+$/m.test(withoutOld)) {
    return withoutOld.replace(/^(# .+)$/m, `$1\n${section}`).trim() + "\n";
  }

  return `${section}\n${withoutOld}`.trim() + "\n";
}

export function ensureArticleVisualAssets(markdown, row) {
  const parsed = matter(markdown);
  const contentMode = normalizeMode(row.contentMode || parsed.data.contentMode);
  if (contentMode !== "fact-source") return markdown;

  const slug = row.slug || parsed.data.slug;
  const locale = row.locale || parsed.data.locale || "zh";
  const keyword = row.keyword || parsed.data.title || slug;
  const category = row.category || parsed.data.category || "Translation";
  if (!slug) return markdown;

  const assetDir = path.join(publicRoot, "article-assets", locale, slug);
  fs.mkdirSync(assetDir, { recursive: true });

  const cover = coverDefinition(keyword, category);
  const coverPath = path.join(assetDir, cover.fileName);
  fs.writeFileSync(coverPath, cover.svg, "utf-8");
  const coverAsset = {
    type: "cover",
    title: cover.title,
    alt: cover.alt,
    src: `/article-assets/${locale}/${slug}/${cover.fileName}`,
  };

  const assets = assetDefinitions(keyword, category).map((asset) => {
    const filePath = path.join(assetDir, asset.fileName);
    fs.writeFileSync(filePath, asset.svg, "utf-8");
    return {
      type: asset.fileName.replace(/\.svg$/u, ""),
      title: asset.title,
      alt: asset.alt,
      src: `/article-assets/${locale}/${slug}/${asset.fileName}`,
    };
  });

  parsed.data.contentMode = contentMode;
  parsed.data.coverImage = coverAsset.src;
  parsed.data.coverAlt = coverAsset.alt;
  parsed.data.visuals = assets.map(({ type, title, alt, src }) => ({ type, title, alt, src }));
  parsed.content = insertVisualSection(parsed.content, assets);

  return matter.stringify(parsed.content.trim(), parsed.data).trim() + "\n";
}

export function getArticleAssetPaths(locale, slug) {
  const assetDir = path.join(publicRoot, "article-assets", locale || "zh", slug);
  if (!fs.existsSync(assetDir)) return [];

  return fs
    .readdirSync(assetDir)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => path.join(assetDir, file));
}
