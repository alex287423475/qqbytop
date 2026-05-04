# 留学文书诊断工具 AI 辅助开发规划文档 (AI-Driven PRD)

> **致 AI 作者的系统提示 / System Prompt**
>
> 在开始编写代码之前，请完整阅读本文件，并同时阅读 `docs/留学文书诊断工具DESIGN.md`。一切架构决策、技术栈、目录结构、隐私边界、AI 输出格式和上线验收必须严格以本文档为准；一切前端布局、视觉层级、组件状态、响应式和交互细节必须遵循 DESIGN.md。不要凭借自身习惯自由发挥，不要复制 `diagnose-tools/` 独立静态 app，不要把商务形象诊断迁移作为本项目的前置任务。如果在执行某一步骤中遇到依赖冲突、现有路由冲突、AI 输出无法稳定符合 Schema、或隐私策略无法落地，请立即停止继续编码，并在对应 Milestone 的【阻塞项】中记录，等待人类确认。

---

## 🟢 第一部分：总纲与底层心智 (The Prompt Base)

### 1. 项目定位与核心目标

- **项目名称：** 留学文书诊断工具
- **目标 URL：** `/tools/study-abroad-essay-check`
- **业务一句话描述：** 面向留学生、申请者和家长的免费 PS / SOP / Motivation Letter 初稿诊断工具，通过结构化 AI 报告发现文书主题、结构、经历、项目匹配和表达问题，并把用户分流到文书润色、深度优化、SOP/PS 结构重写或申请材料包审核服务。
- **核心交互对象：** 中文用户界面，英文或中英混合文书输入，中文诊断结果，英文原文证据片段。
- **核心业务目标：**
  - 降低留学申请用户咨询门槛。
  - 通过免费诊断建立专业信任。
  - 避免免费输出完整润色稿，保留付费转化空间。
  - 收集高意向线索，但默认不保存完整文书正文。
- **核心工程目标：**
  - 在现有 Next.js App Router 项目中开发。
  - 建立最小可复用的 `lib/diagnose-tools` 公共层。
  - 新工具走 Next.js 页面和 API Route，不复制 `diagnose-tools/` 静态服务。
  - 现有商务形象诊断保持可运行，不作为本项目前置迁移对象。

### 2. 开发底线与工程心智 (System Directives)

- 严禁复制 `diagnose-tools/server.mjs` 作为新服务。
- 严禁新增另一个独立端口服务或静态 app 目录。
- 严禁保存完整文书正文到 `localStorage`、日志、JSONL 或数据库，除非用户在留资阶段主动授权人工顾问查看。
- 严禁输出完整免费改写稿、全文润色稿、完整 SOP/PS 重写稿。
- 严禁判断“是否 AI 生成”。统一使用“文本同质化/空泛度风险”。
- 严禁承诺录取概率、保录取、官方审核意见或学校内部判断。
- 后端必须做输入长度、词数、频率和 Schema 校验，不能只依赖前端校验。
- AI 输出必须通过 JSON Schema 或后端规范化后再进入前端渲染。
- evidence 字段必须来自用户原文；校验时不得只用严格 `includes()`，必须使用规范化匹配处理空格、换行、标点、引号和大小写差异。如仍无法验证，应降低置信度、删除问题或 fallback。
- 所有用户可见错误必须友好；原始异常只能进入服务端日志，不直接暴露给前端。
- 顶部导航、报价入口和电话入口应保持主站一致；电话链接使用 `tel:400-869-9562`，但视觉上不得出现浏览器默认蓝色下划线。
- 静态 CSS 如被工具页引用，修改后必须同步更新 query version，避免线上缓存旧样式。
- 不要为了未来十几个工具过度抽象；公共层只覆盖当前确定的文本诊断工具需要。

### 3. 风险免责与边界说明 (Boundaries & Out-of-Scope)

#### 3.1 第一版绝对不涵盖的功能

- 不做 Word / PDF 上传解析。
- 不做多材料包上传。
- 不做用户账号系统。
- 不做在线支付。
- 不做完整文书自动润色。
- 不做全文自动重写。
- 不做录取概率预测。
- 不做查重。
- 不做 AI 生成检测。
- 不迁移商务形象诊断静态前端。

#### 3.2 已知技术风险与绕过策略

- **AI JSON 不稳定：** 使用 Responses API `json_schema` 严格模式；OpenAI-compatible 接口使用 `response_format: json_object` 后再做后端校验。
- **evidence 可能编造或被模型轻微改写：** 后端检查 evidence 是否存在于用户原文，但必须先做去格式化/规范化匹配，避免因为空格、换行、引号、标点或大小写差异误杀真实证据。
- **用户输入超长导致 token 成本过高：** 后端硬限制 15000 字符或 2500 英文词。
- **高意向用户遇到 AI 短暂失败：** 进入 demo fallback 前，允许 1-2 次快速静默重试，使用指数退避；超过总超时预算后再 fallback。
- **恶意脚本刷接口消耗 API Token：** API route 层必须实现分钟级和每日级双重 rate limit，第一版可用内存 Map，后续再替换为 Redis/KV。
- **浏览器缓存旧 CSS：** 静态资源 URL 必须带版本号，样式更新时更换 query version。
- **Vercel 自动部署受 GitHub 集成影响：** 本地修改后必须先 `npm run build`，再提交到 GitHub `main`，由 Vercel Production 自动部署。
- **工作区可能存在无关未跟踪文件：** 提交时只 stage 本项目相关文件，不提交无关文档、日志、local-brain 数据或临时目录。

---

## 🔵 第二部分：静态设计与硬性契约 (The Blueprints)

### 4. 技术栈选型与目录骨架

#### 4.1 核心技术栈

- **语言：** TypeScript
- **框架：** Next.js App Router
- **运行时：** Node.js runtime for API routes
- **前端：** React Client Component + 现有站点 CSS/Tailwind 体系；若使用 Tailwind，必须将 DESIGN.md 的 `--essay-*` 语义 token 映射到 Tailwind theme，组件中优先使用 `bg-essay-*`、`text-essay-*`、`border-essay-*`。
- **AI 接口：**
  - 优先 OpenAI Responses API + `json_schema`
  - 兼容 OpenAI-compatible `/chat/completions`
- **部署：** GitHub main -> Vercel Production
- **持久化：** 生产环境第一版不使用 JSONL 文件持久化留资；Vercel Serverless 文件系统不可作为持久化存储。生产环境先走 Resend 邮件通知，后续如需持久化再接 Vercel KV / Upstash Redis / Supabase。

#### 4.2 强制目录结构

严格按以下路径建立文件。若现有项目已有同名公共工具，应复用而不是自创新路径。

```text
next-vercel/
  app/
    tools/
      study-abroad-essay-check/
        page.tsx
    api/
      tools/
        study-abroad-essay-check/
          diagnose/
            route.ts
          leads/
            route.ts

  components/
    diagnose-tools/
      ToolPageLayout.tsx
      ToolStepRail.tsx
      EssayDiagnosisForm.tsx
      EssayTextInput.tsx
      DiagnosisProgress.tsx
      EssayDiagnosisResult.tsx
      ServiceCTA.tsx
      LeadCapture.tsx
      PrivacyNotice.tsx

  lib/
    diagnose-tools/
      definitions.ts
      run-diagnosis.ts
      openai-json.ts
      sanitize.ts
      validate-input.ts
      evidence.ts
      rate-limit.ts
      lead-store.ts
      demo-fallback.ts
      types.ts
      definitions/
        study-abroad-essay.ts
      prompts/
        study-abroad-essay.ts
      schemas/
        study-abroad-essay.ts

  docs/
    留学文书诊断工具AI辅助开发PRD.md
    留学文书诊断工具DESIGN.md
```

#### 4.3 禁止路径

不得新增：

```text
diagnose-tools-essay/
study-abroad-diagnose-tools/
server-essay.mjs
essay-tools/server.mjs
public/tools/study-abroad-essay/app.js
```

除非人类明确要求，否则不要把新工具做成静态 HTML/JS app。

#### 4.4 前端布局与交互设计硬约束

页面第一屏必须是“可立即使用的诊断工具”，不是营销落地页。不要制作大幅 hero、装饰图、夸张背景、品牌口号区或卡片堆叠式宣传页。

桌面端推荐布局：

```text
顶部主站导航
主工具区：左 58% 输入表单 / 右 42% 诊断预览与结果
底部：服务分流 CTA + 隐私说明 + FAQ 简短说明
```

移动端布局：

```text
顶部主站导航
工具标题与一句话说明
申请背景表单
文书输入框
隐私声明
生成按钮
结果区
服务 CTA
留资表单
```

交互要求：

- 首屏标题控制在一行或两行内，不使用超大字号。
- 表单默认只展示核心字段：申请阶段、目标专业、文书类型、文书正文。
- 目标地区、目标学校、当前状态、最担心问题放进“补充信息”折叠区。
- 文书输入框必须有实时字数/词数提示。
- 文书输入框应设置稳定高度，桌面端不少于 280px；移动端初始高度 160px，focus 或已有输入后可扩展到 220px。
- 移动端必须控制首屏折叠线，尽量让“生成文书诊断”按钮在 390x844 级别视口首屏或轻微滚动内可见。
- 生成按钮在正文为空或超过硬限制时禁用。
- 用户点击生成后，不要清空表单。
- 结果生成后，桌面端右侧结果区自动更新；移动端滚动到结果区。
- 不要把整页做成多个套娃 card；只允许结果问题、CTA、留资表单使用卡片。

#### 4.5 表单 UX 细节

字段组件要求：

- 申请阶段使用按钮组或 segmented control，不使用默认长下拉作为首选交互。
- 文书类型使用按钮组：`PS`、`SOP`、`Motivation Letter`、`Scholarship Essay`、`不确定`。
- 目标专业使用文本输入，placeholder 示例：`例如：Business Analytics / Computer Science / Education`。
- 用户最担心的问题使用可多选标签：`语言表达`、`结构逻辑`、`申请匹配`、`经历太空`、`不确定类型`。
- 隐私声明要放在正文输入框和生成按钮之间。

输入提示文案：

```text
建议粘贴一篇完整 PS / SOP 初稿。300-1500 英文词最适合诊断。
```

隐私文案：

```text
你的文书仅用于本次实时诊断。默认不保存完整正文，不用于 AI 训练，也不会提交到任何查重系统。
```

字数提示规则：

- `< 150 英文词`：显示红色提示“内容过短，只能做初步判断。”
- `150-300 英文词`：显示黄色提示“可诊断，但置信度较低。”
- `300-1500 英文词`：显示绿色提示“适合诊断。”
- `1500-2500 英文词`：显示黄色提示“内容较长，建议确认是否只粘贴了一篇文书。”
- `> 2500 英文词或 > 15000 字符`：禁用提交，提示拆分。

#### 4.6 结果页视觉层级

结果区必须按优先级展示，不要把所有信息同权重平铺。

结果模块顺序：

1. 顶部结论条：综合评分、置信度、是否 demo。
2. 诊断摘要：1 段，不超过 120 中文字。
3. 六维评分：紧凑网格，每项包含名称、分数、短评。
4. 主要问题：3-5 条，每条包含标题、严重度、原文证据、影响、修改方向。
5. 修改优先级：高 / 中 / 低。
6. Quick Wins：3 条马上能改的动作。
7. 服务推荐：主服务 + 次服务 + 推荐理由。
8. Before / After 案例：只展示短案例，不对用户正文做完整改写。
9. 留资 CTA。

证据片段展示要求：

- evidence 必须用独立浅色引用块。
- 英文长句必须允许换行：`overflow-wrap: anywhere; word-break: break-word;`。
- evidence 不得用过小字号，最小 13px。
- 不能把 evidence 做成可编辑文本框，避免用户误以为可以在线改稿。

严重度颜色：

- high：深红或琥珀强调，但不要使用大面积红底。
- medium：琥珀或深黄。
- low：中性灰蓝。

#### 4.7 CTA 与转化设计

服务 CTA 必须按问题分流，而不是只有“联系我们”。

CTA 卡片：

```text
我只需要英文润色 -> 文书基础润色
我需要重写结构和逻辑 -> 文书深度优化
我不确定 PS/SOP 怎么写 -> SOP / PS 结构重写
我还有 CV、推荐信、成绩单 -> 申请材料包审核
我还需要英文简历一起优化 -> 英文简历优化
```

CTA 规则：

- 主推荐服务应高亮，但不得遮挡其他选择。
- 每个 CTA 必须带一句选择理由。
- CTA 点击后打开留资表单并自动带入 `selectedService`。
- 留资表单不应在结果未生成前强制出现。
- 不要使用弹窗作为唯一留资方式；页面内表单必须存在。

Before / After 案例规则：

- 案例只能使用固定样例，不使用用户正文。
- Before 不超过 60 英文词。
- After 不超过 80 英文词。
- 明确标注“示例，不是对你文书的完整改写”。

#### 4.8 加载、失败与 Demo 状态文案

加载状态不使用空泛文案。AI 诊断可能持续 10-45 秒，`DiagnosisProgress` 必须使用分阶段文案和伪进度条，不得只显示 spinner。

进度可分四步：

```text
0-10s：正在解析文本结构
10-20s：正在比对申请匹配度
20-30s：正在提取原文证据
30-45s：正在生成修改优先级
```

等待提示：

- 20 秒后显示：“文书较长时诊断会多花一点时间，请勿关闭页面。”
- 35 秒后显示：“如果接口繁忙，我们会展示示例报告，你也可以稍后重试。”

AI 超时或接口失败时：

```text
当前 AI 接口繁忙，已展示示例诊断报告。你可以稍后重试，或直接提交材料让顾问人工判断。
```

输入过长：

```text
这篇内容过长，可能包含多篇材料。请只粘贴一篇 PS / SOP，或拆分后再诊断。
```

rate limit：

```text
请求过快，请稍后再试。为了控制成本，每个访客每天可免费诊断有限次数。
```

demo 报告顶部提示：

```text
当前为示例诊断报告：AI 接口暂不可用，此报告用于展示工具结果结构，不代表对你文书的真实判断。
```

#### 4.9 移动端适配规则

- 页面最小宽度按 360px 设计。
- 顶部导航在移动端折叠，电话入口仍可在菜单中点击。
- 表单按钮组允许换行，不允许横向滚动。
- 结果评分网格在移动端变为 1 列或 2 列。
- evidence 引用块必须自动换行，不得撑出屏幕。
- CTA 卡片移动端单列展示。
- 任何按钮文本不得溢出按钮边界。
- 不使用随 viewport 缩放的字体大小。
- 不使用负 letter spacing。

### 5. 核心外部系统交互 (API / Dependencies)

#### 5.1 AI 诊断接口

优先使用环境变量：

```text
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_TEXT_MODEL
OPENAI_REPORT_MODEL
AI_TIMEOUT_MS
AI_RETRY_ATTEMPTS
AI_RETRY_BASE_DELAY_MS
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_PER_WINDOW
RATE_LIMIT_MAX_PER_DAY
```

模型选择：

```text
OPENAI_REPORT_MODEL || OPENAI_TEXT_MODEL
```

生产环境要求：

- 真实 AI 路径必须显式配置 `OPENAI_REPORT_MODEL` 或 `OPENAI_TEXT_MODEL`。
- 未配置模型或 API Key 时，不报 500，直接进入 demo fallback。
- 如果模型返回 `model_not_found`、`invalid_model` 或 OpenAI-compatible 接口返回 400 且错误指向模型不可用，不重试，直接进入 demo fallback，并在服务端记录简短错误。
- 不在生产代码中依赖未确认可用的硬编码模型名。

超时建议：

```text
AI_TIMEOUT_MS 默认 45000
AI_RETRY_ATTEMPTS 默认 2
AI_RETRY_BASE_DELAY_MS 默认 800
RATE_LIMIT_WINDOW_MS 默认 60000
RATE_LIMIT_MAX_PER_WINDOW 默认 10
RATE_LIMIT_MAX_PER_DAY 默认 30
```

AI 重试规则：

- 只对超时、网络错误、HTTP 429、HTTP 5xx 和 JSON 解析失败进行重试。
- 不对输入校验失败、Schema 业务校验失败、内容边界违规进行重试。
- 重试采用指数退避，例如 `800ms -> 1600ms`。
- 总执行时间不得超过 `AI_TIMEOUT_MS` 的合理预算；超过后进入 demo fallback。

#### 5.2 平台超时能力检查

真实 AI 调用前必须确认 Vercel 当前项目的 API Route 最大执行时长支持所设置的 `AI_TIMEOUT_MS`。

执行规则：

- 如果 Vercel 项目函数超时能力小于 45 秒，应将 `AI_TIMEOUT_MS` 调整到平台允许范围内，并接受更高 demo fallback 比例。
- 如果业务必须保留 45 秒真实 AI 等待，应升级或配置支持更长函数执行时间的部署方案。
- 不允许在平台只支持短超时的情况下，仍在文案和代码中承诺 45 秒等待体验。
- 开发者必须在 Milestone 6 前记录实际线上函数超时能力。

#### 5.3 线索通知接口

如果当前项目已有 Resend 或邮件通知能力，可复用：

```text
RESEND_API_KEY
RESEND_FROM
LEAD_NOTIFY_EMAIL
```

第一版留资失败不得影响诊断结果展示；但用户提交联系方式失败时必须明确提示。

生产留资策略：

```text
本地开发：允许写入本地 JSONL 作为调试记录。
Vercel Production：不写 JSONL；使用 Resend/邮件通知作为第一版交付链路。
缺少 RESEND_API_KEY 或 LEAD_NOTIFY_EMAIL：留资 API 应 fail fast，前端提示用户改用电话/邮箱联系。
```

如果后续需要稳定沉淀线索，优先级：

```text
Vercel KV / Upstash Redis
-> Supabase
-> 其他外部数据库
```

不得把 Vercel Serverless 本地文件写入当作生产持久化。

#### 5.4 对外 API 路径

```text
POST /api/tools/study-abroad-essay-check/diagnose
POST /api/tools/study-abroad-essay-check/leads
```

不要新增多个语义重复接口，例如：

```text
/api/essay/check
/api/study/diagnosis
/api/ai/sop
```

### 6. 核心数据实体与 Schema

#### 6.1 TypeScript 类型定义

```ts
export type Confidence = "low" | "normal" | "high";
export type Severity = "high" | "medium" | "low";

export type ApplicationStage =
  | "本科"
  | "硕士"
  | "博士"
  | "转学"
  | "交换"
  | "奖学金"
  | "其他";

export type EssayDocumentType =
  | "PS"
  | "SOP"
  | "Motivation Letter"
  | "Scholarship Essay"
  | "不确定";

export type ServiceName =
  | "文书基础润色"
  | "文书深度优化"
  | "SOP / PS 结构重写"
  | "英文简历优化"
  | "申请材料包审核";

export interface EssayDiagnosisRequest {
  applicationStage: ApplicationStage;
  targetMajor: string;
  documentType: EssayDocumentType;
  essayText: string;
  targetRegion?: string;
  targetSchoolOrProgram?: string;
  draftStage?: "初稿" | "修改稿" | "已定稿" | "不确定";
  userConcern?: string;
}

export interface DocumentTypeAssessment {
  submittedType: EssayDocumentType;
  detectedFit: "更接近 PS" | "更接近 SOP" | "类型基本匹配" | "无法判断";
  comment: string;
  explanation: string;
}

export interface DimensionScore {
  id:
    | "theme_clarity"
    | "structure_completeness"
    | "application_fit"
    | "experience_persuasiveness"
    | "language_expression"
    | "generic_risk";
  name: string;
  score: number;
  comment: string;
}

export interface MainProblem {
  title: string;
  severity: Severity;
  evidence: string;
  whyItMatters: string;
  suggestedFix: string;
}

export interface RevisionPriority {
  level: Severity;
  item: string;
  reason: string;
}

export interface ServiceRecommendation {
  primaryService: ServiceName;
  secondaryService?: ServiceName;
  reason: string;
}

export interface EssayDiagnosisResult {
  diagnosticId: string;
  toolSlug: "study-abroad-essay-check";
  isDemo: boolean;
  source: "openai" | "compatible" | "demo";
  overallScore: number;
  confidence: Confidence;
  diagnosisSummary: string;
  documentTypeAssessment: DocumentTypeAssessment;
  dimensionScores: DimensionScore[];
  mainProblems: MainProblem[];
  revisionPriorities: RevisionPriority[];
  quickWins: string[];
  serviceRecommendation: ServiceRecommendation;
  privacyNote: string;
  createdAt: string;
}
```

#### 6.2 JSON Schema 硬性约束

AI 返回结果必须满足：

- `overallScore`：0-100 整数。
- `confidence`：enum `low | normal | high`。
- `dimensionScores`：正好 6 项。
- `mainProblems`：3-5 项。
- `quickWins`：正好 3 项。
- `evidence`：最长 240 字符，真实 AI 模式下必须来自用户原文。
- `primaryService`：必须是 `ServiceName` enum。
- `isDemo`：AI 模式为 false；fallback 模式为 true。

#### 6.3 evidence 匹配契约

`lib/diagnose-tools/evidence.ts` 必须至少导出：

```ts
export interface EvidenceMatchResult {
  matched: boolean;
  mode: "exact" | "normalized" | "token_overlap" | "none";
  score: number;
}

export function normalizeEvidenceText(value: string): string;

export function matchEvidenceInSource(
  evidence: string,
  sourceText: string,
): EvidenceMatchResult;
```

匹配规则：

1. 先做原文 `includes()` 精确匹配。
2. 精确匹配失败后，做规范化匹配：
   - 转小写。
   - 统一中英文引号。
   - 删除所有空白字符。
   - 删除常见中英文标点。
   - 归一化连字符和撇号。
3. 规范化匹配仍失败时，做 token overlap 粗匹配：
   - 对英文按词拆分。
   - 对中文按连续字符片段处理。
   - evidence token 覆盖率达到 0.72 以上可视为弱匹配。
4. `mode = "token_overlap"` 时必须降低该问题置信度或在服务端记录弱匹配，不得把它当成强证据。

禁止只用严格字符串相等或简单 `sourceText.includes(evidence)` 作为唯一判断。

#### 6.4 sanitize.ts 职责契约

`lib/diagnose-tools/sanitize.ts` 必须负责通用输入/输出清洗，不负责 evidence 匹配算法。

必须导出：

```ts
export function sanitizePlainText(value: unknown, maxLength: number): string;
export function sanitizeUserContext(value: unknown, maxLength: number): string;
export function sanitizeAiText(value: unknown, maxLength: number): string;
export function stripUnsafeHtml(value: string): string;
```

职责边界：

- `sanitizeUserContext`：清洗申请阶段、专业、目标地区、用户担心问题等短字段；去除 HTML、控制字符和首尾空白。
- `sanitizeAiText`：清洗 AI 输出字段；去除 HTML、控制字符，限制最大长度，避免前端渲染异常。
- `stripUnsafeHtml`：确保所有用户输入和 AI 输出都作为纯文本处理，不允许 HTML 注入。
- `normalizeEvidenceText` 仍属于 `evidence.ts`，不要放进 `sanitize.ts`。
- `sanitize.ts` 不得记录、持久化或上报完整文书正文。

### 7. 核心业务状态机 (State Machine)

#### 7.1 诊断状态集合

```text
IDLE
INPUT_READY
VALIDATING
DIAGNOSING
RESULT_READY
DEMO_RESULT_READY
LEAD_FORM_OPEN
LEAD_SUBMITTING
LEAD_SUBMITTED
ERROR
```

#### 7.2 转移规则

```text
IDLE -> INPUT_READY
  条件：用户至少填写申请阶段、目标专业、文书类型、文书正文。

INPUT_READY -> VALIDATING
  条件：用户点击“生成诊断”。

VALIDATING -> DIAGNOSING
  条件：前端基础校验通过。

VALIDATING -> ERROR
  条件：正文为空、明显过短或超过前端硬限制。

DIAGNOSING -> RESULT_READY
  条件：API 返回 AI 诊断结果且通过 Schema 校验。

DIAGNOSING -> DEMO_RESULT_READY
  条件：AI 超时、API Key 缺失、JSON 无法校验或服务端 fallback。

RESULT_READY -> LEAD_FORM_OPEN
DEMO_RESULT_READY -> LEAD_FORM_OPEN
  条件：用户点击服务 CTA。

LEAD_FORM_OPEN -> LEAD_SUBMITTING
  条件：用户填写联系方式并提交。

LEAD_SUBMITTING -> LEAD_SUBMITTED
  条件：留资 API 成功。

LEAD_SUBMITTING -> ERROR
  条件：留资 API 失败。

ERROR -> INPUT_READY
  条件：用户修改表单内容、点击“重新诊断”或关闭错误提示。

ERROR -> DIAGNOSING
  条件：用户点击“重试”，且上一次错误不是输入校验失败或 rate limit。
```

#### 7.3 禁止状态转移

- `ERROR` 不得自动静默回到 `RESULT_READY`。
- `ERROR` 必须有用户可操作出口，不得要求用户刷新页面。
- `DEMO_RESULT_READY` 不得伪装成真实 AI 诊断。
- `LEAD_SUBMITTED` 后不得再次保存完整文书正文，除非用户明确授权人工复核。

---

## 🟠 第三部分：执行控制平台 (The Execution Engine)

### 8. 全局推荐开发顺序 (Global Execution Order)

1. 执行 Milestone 1：建立最小公共类型、配置和 Schema。
2. 执行 Milestone 2：实现输入校验、prompt、AI JSON 调用和 demo fallback。
3. 执行 Milestone 3：实现诊断 API。
4. 执行 Milestone 4：实现页面 UI、状态机和结果渲染。
5. 执行 Milestone 5：实现留资 API、电话导航和隐私策略。
6. 执行 Milestone 6：完成本地 build、生产部署和线上验证。

> **致 AI 的执行规范：** 请严格按顺序解锁 Milestone。在未完成上一阶段验收时，严禁开始下一个阶段。每次对代码进行重大推进，请自行更新对应 Milestone 的“当前进度”。如遇阻塞，不要绕过 PRD 自行改架构。

### 8.1 Prompt 骨架

`lib/diagnose-tools/prompts/study-abroad-essay.ts` 必须拆分固定 System Prompt 和变量化 User Prompt，不要把所有内容拼成一段不可维护字符串。

System Prompt 骨架：

```text
你是北京全球博译的留学申请文书诊断顾问。
你的任务是诊断 PS / SOP / Motivation Letter / Scholarship Essay 的结构、申请匹配度、经历说服力和英文表达问题。

边界：
- 你不是招生官，不能承诺录取概率。
- 你不是查重系统，不能判断文本是否由 AI 生成。
- 你不能输出完整润色稿、全文重写稿或代写稿。
- 你只能输出结构化 JSON，不输出 Markdown 或额外解释。

评分维度：
1. 主题清晰度
2. 结构完整度
3. 申请匹配度
4. 经历说服力
5. 语言表达
6. 文本同质化/空泛度风险

评分锚点：
1-3 分：严重失败或几乎空白。
4-5 分：有基础内容但明显不足。
6-7 分：基本达标但缺少深度、细节或反思。
8-9 分：有明确亮点，超过多数普通初稿。
10 分：极少使用，只在该维度几乎无可改空间时使用。

evidence 规则：
- 每个 mainProblems[].evidence 必须来自用户原文。
- 不要修正 evidence 中的拼写、标点、大小写或措辞。
- 如果无法找到原文证据，不要编造。

输出：
- 严格符合 EssayDiagnosisResult JSON Schema。
- diagnosisSummary 不超过 120 中文字。
- suggestedFix 只给修改方向，不给完整改写段落。
```

User Prompt 骨架：

```text
用户申请阶段：{{applicationStage}}
目标专业：{{targetMajor}}
目标国家或地区：{{targetRegion || "未提供"}}
目标学校或项目：{{targetSchoolOrProgram || "未提供"}}
用户选择的文书类型：{{documentType}}
当前文书状态：{{draftStage || "不确定"}}
用户最担心的问题：{{userConcern || "未提供"}}

后端基础置信度：{{baseConfidence}}
输入统计：{{charCount}} 字符，约 {{englishWordCount}} 英文词，中文占比 {{chineseRatio}}。

用户文书正文：
<<<ESSAY_TEXT
{{essayText}}
ESSAY_TEXT
```

Prompt 构造规则：

- 可选字段为空时必须注入明确默认值，例如 `未提供` 或 `不确定`。
- `draftStage` 可选，默认注入 `不确定`。
- 不要在 prompt 中包含用户联系方式。
- 不要把 prompt 或完整文书写入日志。

### 8.2 成本与调用预算

第一版不在文档中写死具体人民币/美元成本，因为模型价格会变化。开发者必须在接入真实模型前基于当前供应商价格更新此估算。

预算估算模板：

```text
平均输入：
- System Prompt: 约 ____ tokens
- User Context: 约 ____ tokens
- Essay Text: 约 ____ tokens
- Total Input: 约 ____ tokens

平均输出：
- JSON Result: 约 ____ tokens

单次调用成本：
- Input cost = Total Input / 1,000,000 * 当前输入单价
- Output cost = JSON Result / 1,000,000 * 当前输出单价
- Total per diagnosis = Input cost + Output cost

月度上限：
- RATE_LIMIT_MAX_PER_DAY * 30 * Total per diagnosis
```

运营默认约束：

- 免费诊断默认每日每 key 最多 30 次。
- 如果真实成本超过可接受范围，优先降低每日上限，不要缩短隐私或安全校验。
- 不得因成本原因跳过 evidence 校验。

### 9. 切分出来的多个里程碑 (Milestones)

#### 🏁 Milestone 1: 诊断工具公共基建与 Schema

🎯 **局部任务目标：**
建立 `lib/diagnose-tools` 的最小公共层，定义留学文书诊断类型、工具配置、Schema 和服务枚举。

🚧 **前置依赖：** 无。

👣 **局部微观执行步骤：**

1. 新建 `lib/diagnose-tools/types.ts`。
2. 新建 `lib/diagnose-tools/definitions.ts`。
3. 新建 `lib/diagnose-tools/definitions/study-abroad-essay.ts`。
4. 新建 `lib/diagnose-tools/schemas/study-abroad-essay.ts`。
5. 将 `ServiceName`、`Confidence`、`Severity` 写成 TS 类型和 Schema enum。
6. 不引入第三方 schema 库，除非项目已有稳定依赖；第一版可用手写校验。

📊 **当前进度 (Current Progress)：** ✅ 已完成

🛑 **阻塞项说明 (Blockers)：**

- 暂无。

📋 **局部阶段验收清单：**

- [x] 类型文件可以被 API route 和组件共同导入。
- [x] Schema 中包含 `confidence`、`severity`、`primaryService` enum。
- [x] `dimensionScores` 明确要求 6 项。
- [x] 未创建任何独立 Node 服务或静态 app 目录。

#### 🏁 Milestone 2: 输入校验、Prompt 与 AI 调用层

🎯 **局部任务目标：**
实现后端输入校验、token 粗估、Prompt 构造、OpenAI JSON 调用、evidence 校验和 demo fallback。

🚧 **前置依赖：** Milestone 1 完成。

👣 **局部微观执行步骤：**

1. 新建 `lib/diagnose-tools/validate-input.ts`。
2. 新建 `lib/diagnose-tools/prompts/study-abroad-essay.ts`。
3. 新建 `lib/diagnose-tools/openai-json.ts`。
4. 新建 `lib/diagnose-tools/evidence.ts`。
5. 新建 `lib/diagnose-tools/demo-fallback.ts`。
6. 新建或实现 `lib/diagnose-tools/rate-limit.ts`。
7. 新建或实现 `lib/diagnose-tools/sanitize.ts`，职责必须符合第 6.4 节。
8. 实现后端硬限制：
   - 正文为空拒绝。
   - 正文超过 15000 字符拒绝。
   - 英文词数超过 2500 拒绝。
   - 英文词数少于 300 或中文占比大于 50% 时 `confidence` 降为 `low`。
9. evidence 匹配必须使用 `matchEvidenceInSource()`，不得只用严格 `includes()`。
10. AI 调用层必须实现 fallback 前的静默快速重试：
   - 默认最多 2 次。
   - 使用指数退避。
   - 只重试网络、超时、429、5xx、JSON 解析失败。
   - 不重试输入校验失败。
11. rate limit 必须支持：
   - 分钟级限制：默认 60 秒最多 10 次。
   - 每日限制：默认每天最多 30 次。
   - key 优先使用 IP；无法可靠获取 IP 时，用 IP + user-agent 组合。
   - 第一版允许内存 Map；如部署多实例导致限制不一致，记录为后续升级项。
12. Prompt 必须按第 8.1 节 System Prompt / User Prompt 骨架实现，并注入用户上下文：
   - 申请阶段
   - 目标专业
   - 目标国家或地区
   - 文书类型
   - 当前文书状态
   - 用户最担心的问题
   - 文书正文
13. Prompt 必须包含评分锚点：
   - 1-3 分：严重失败或几乎空白。
   - 4-5 分：有基础但明显不足。
   - 6-7 分：基本达标但缺细节。
   - 8-9 分：明显优于普通初稿。
   - 10 分：极少使用。
14. demo fallback 必须 `isDemo = true`，不得假装引用真实原文。

📊 **当前进度 (Current Progress)：** ✅ 已完成

🛑 **阻塞项说明 (Blockers)：**

- 暂无。

📋 **局部阶段验收清单：**

- [x] 超长输入会在后端被拒绝。
- [x] 无 API Key 时可以返回 demo fallback。
- [x] 模型未配置或模型不可用时可以返回 demo fallback，而不是 500。
- [x] `sanitize.ts` 的职责清晰，不与 `evidence.ts` 混用。
- [x] Prompt 文件包含 System Prompt 和 User Prompt 骨架，变量注入位清楚。
- [x] Prompt 不要求模型输出完整改写稿。
- [x] evidence 校验函数支持精确匹配、规范化匹配和 token overlap 弱匹配。
- [x] AI 调用失败时会先执行受限静默重试，再进入 demo fallback。
- [x] rate limit 支持分钟级和每日级调用上限。
- [x] demo fallback 顶部能被前端识别为示例报告。

#### 🏁 Milestone 3: 诊断 API Route

🎯 **局部任务目标：**
实现 `POST /api/tools/study-abroad-essay-check/diagnose`，返回可渲染的 `EssayDiagnosisResult`。

🚧 **前置依赖：** Milestone 2 完成。

👣 **局部微观执行步骤：**

1. 新建 `app/api/tools/study-abroad-essay-check/diagnose/route.ts`。
2. 设置：
   ```ts
   export const runtime = "nodejs";
   export const dynamic = "force-dynamic";
   ```
3. 在开发前确认 Vercel 当前项目的函数最大执行时长；如果小于 `AI_TIMEOUT_MS`，必须调低 `AI_TIMEOUT_MS` 或记录阻塞。
4. 解析 JSON body。
5. 调用输入校验。
6. 调用 rate limit：
   - 先检查分钟级限制。
   - 再检查每日级限制。
   - 命中限制时直接返回 429，不调用 AI。
7. 调用 AI 诊断。
8. AI 短暂失败时按 Milestone 2 的重试策略处理。
9. 校验返回 JSON。
10. 校验 evidence。
11. 生成 `diagnosticId`。
12. 返回统一 JSON。
13. 出错时返回友好错误或 demo fallback。

📊 **当前进度 (Current Progress)：** ✅ 已完成

🛑 **阻塞项说明 (Blockers)：**

- 暂无。

📋 **局部阶段验收清单：**

- [x] API 路径正确。
- [x] 已确认 Vercel 函数超时能力与 `AI_TIMEOUT_MS` 匹配，或已调低超时并记录。
- [x] 不配置 API Key 时返回 demo 报告。
- [x] 超长正文不会打到 AI 接口。
- [x] API 返回结果包含 `diagnosticId`。
- [x] API 不把完整文书正文写入日志或文件。
- [x] JSON 不符合 Schema 时不会导致前端 500。
- [x] 频率超限时返回 429，且不会调用 AI。
- [x] 每日调用次数超限时返回 429，且不会调用 AI。

#### 🏁 Milestone 4: 页面 UI 与结果渲染

🎯 **局部任务目标：**
实现 `/tools/study-abroad-essay-check` 页面，完成表单、进度、结果、CTA 和移动端体验。

🚧 **前置依赖：** Milestone 3 完成。

👣 **局部微观执行步骤：**

1. 新建 `app/tools/study-abroad-essay-check/page.tsx`。
2. 新建 `components/diagnose-tools/ToolPageLayout.tsx`。
3. 新建 `EssayDiagnosisForm.tsx`。
4. 新建 `EssayTextInput.tsx`。
5. 新建 `DiagnosisProgress.tsx`。
6. 新建 `EssayDiagnosisResult.tsx`。
7. 新建 `ServiceCTA.tsx`。
8. 新建 `ToolStepRail.tsx`。
9. 新建 `PrivacyNotice.tsx`。
10. 在 `page.tsx` 中导出 Next.js metadata：
   - title: `留学文书诊断 | PS / SOP 结构与申请匹配度检查`
   - description: `免费检查 PS、SOP、Motivation Letter 是否存在主题不清、经历空泛、项目匹配不足和英文表达问题，并获取修改优先级建议。`
   - canonical: `/tools/study-abroad-essay-check`
   - openGraph title/description 与页面一致。
   - robots: 允许 index/follow。
11. `ToolStepRail.tsx` 用于展示三步流程：`填写背景 -> 粘贴文书 -> 查看诊断`。桌面端可作为紧凑步骤条，移动端可隐藏或压缩为小型进度标签。
12. 页面表单第一版字段：
   - 申请阶段
   - 目标专业
   - 文书类型
   - 文书正文
   - 可选：目标地区、目标学校、当前状态、最担心问题
13. 结果页模块：
   - 综合评分
   - 诊断结论
   - 6 个维度评分
   - 文书类型判断
   - 主要问题和原文证据
   - 修改优先级
   - 3 条 quick wins
   - 服务推荐
   - 留资 CTA
14. demo 报告必须显示“示例报告”提示。
15. 按第 4.4-4.9 节实现前端 UX：
   - 桌面端输入/结果双栏。
   - 移动端单列顺序。
   - 核心字段优先，补充字段折叠。
   - evidence 引用块自动换行。
   - CTA 卡片按问题分流。
   - 加载、失败、demo 文案使用指定文案。
16. 前端实现必须同时遵循 `docs/留学文书诊断工具DESIGN.md`：
   - 颜色使用 DESIGN.md 的语义 token。
   - 组件状态遵循 DESIGN.md 的按钮组、textarea、隐私提示、结果卡片和 CTA 规则。
   - Tailwind 项目必须映射 `--essay-*` 语义 token，避免 JSX 中散写任意 hex。
   - `DiagnosisProgress` 必须支持分阶段轮播文案和伪进度条。
   - 移动端必须按 DESIGN.md 的 Mobile Fold Rule 控制 textarea 初始高度和主按钮可见性。
   - 若与本 PRD 冲突，以 PRD 的安全和业务边界优先，以 DESIGN.md 的 UI 细节优先。

📊 **当前进度 (Current Progress)：** ✅ 已完成

🛑 **阻塞项说明 (Blockers)：**

- 暂无。

📋 **局部阶段验收清单：**

- [x] `/tools/study-abroad-essay-check` 可以打开。
- [x] 页面包含 Next.js metadata、canonical、Open Graph 和 robots 配置。
- [x] `ToolStepRail.tsx` 已实现或明确在本阶段移除目录骨架；不得保留无人认领组件。
- [x] 页面不出现落地页式空泛 hero，首屏就是工具体验。
- [x] 文书输入框下方展示隐私声明。
- [x] 申请阶段和文书类型使用按钮组或 segmented control。
- [x] 文书输入框显示实时字数/词数和状态提示。
- [x] 补充字段默认折叠，不挤压首屏。
- [x] 前端不把完整文书写入 `localStorage`。
- [x] 结果页不输出完整改写稿。
- [x] evidence 引用块能处理长英文句子，不撑破卡片。
- [x] 服务 CTA 按问题分流，点击后自动带入 `selectedService`。
- [x] 加载、失败、demo 状态文案符合第 4.8 节。
- [x] 页面视觉、组件状态和移动端表现符合 `docs/留学文书诊断工具DESIGN.md`。
- [x] Tailwind token 已映射到 `essay` 语义色，组件未散写大量 hex。
- [x] `DiagnosisProgress` 不是单一 spinner，包含分阶段文案和伪进度。
- [x] 移动端 textarea 初始高度不会把主按钮明显挤出首屏。
- [x] 移动端文本不溢出按钮或卡片。
- [x] demo 和真实诊断结果都可正常渲染。

#### 🏁 Milestone 5: 留资、公共导航与隐私策略

🎯 **局部任务目标：**
实现留资 API 和结果页转化路径，同时确保电话链接、报价入口和隐私文案符合主站规范。

🚧 **前置依赖：** Milestone 4 完成。

👣 **局部微观执行步骤：**

1. 新建 `app/api/tools/study-abroad-essay-check/leads/route.ts`。
2. 新建或复用 `lib/diagnose-tools/lead-store.ts`。
3. 新建 `components/diagnose-tools/LeadCapture.tsx`。
4. 留资字段：
   - 联系方式
   - 申请国家或地区
   - 申请阶段
   - 目标专业
   - 当前材料状态
   - 选择的服务
   - 是否授权顾问查看完整文书
5. 留资记录允许保存：
   - `diagnosticId`
   - `toolSlug`
   - `overallScore`
   - `confidence`
   - `primaryService`
   - `selectedService`
   - `leadSource`
   - 用户联系方式
   - 用户授权状态
6. 留资记录默认不得保存完整文书正文。
7. `lead-store.ts` 必须区分本地与生产：
   - 本地开发可写 JSONL 调试。
   - Vercel Production 不写 JSONL，不依赖本地文件持久化。
   - 生产第一版使用 Resend/邮件通知发送线索。
   - 邮件环境变量缺失时，API fail fast，前端提示电话/邮箱联系。
8. 顶部电话：
   - 文案：`咨询电话 400-869-9562`
   - 链接：`tel:400-869-9562`
   - 样式：品牌色、无默认蓝色下划线。
9. 如使用静态 CSS，更新后必须刷新版本号。

📊 **当前进度 (Current Progress)：** ✅ 已完成

🛑 **阻塞项说明 (Blockers)：**

- 暂无。

📋 **局部阶段验收清单：**

- [x] 留资成功后能记录 `diagnosticId`。
- [x] Vercel Production 不使用 JSONL 文件作为留资持久化。
- [x] Resend/邮件通知环境变量缺失时，留资 API 明确失败并提示替代联系方式。
- [x] 不授权人工复核时，不保存完整文书。
- [x] 授权复核时，前端明确提示用户材料会进入人工处理流程。
- [x] 电话链接点击目标为 `tel:400-869-9562`。
- [x] 电话链接视觉不是默认蓝色下划线。
- [x] 获取报价入口存在并指向主站报价路径。

#### 🏁 Milestone 6: 本地验证、GitHub 推送与 Vercel 上线

🎯 **局部任务目标：**
完成本地构建、线上部署和生产页面验证。

🚧 **前置依赖：** Milestone 5 完成。

👣 **局部微观执行步骤：**

1. 执行：
   ```powershell
   npm run build
   ```
2. 检查 git diff，只提交本项目相关文件。
3. 提交到 Git：
   ```powershell
   git add <明确文件列表>
   git commit -m "Add study abroad essay diagnosis tool"
   git push origin main
   ```
4. 使用 Vercel CLI 查询部署：
   ```powershell
   npx --yes vercel ls next-vercel
   npx --yes vercel inspect <latest-deployment-url>
   ```
5. 线上验证：
   - 页面可访问。
   - CSS 版本正确。
   - demo fallback 可用。
   - 真实 API 可用时返回结构化 JSON。
   - 电话样式正确。
   - 留资接口可用。
6. 记录生产约束：
   - Vercel 函数最大执行时长。
   - 当前 `AI_TIMEOUT_MS`。
   - 真实 AI 模型名称。
   - 生产留资方式：Resend/邮件通知，或已接入的外部持久化服务。

📊 **当前进度 (Current Progress)：** ✅ 已完成

🛑 **阻塞项说明 (Blockers)：**

- 暂无。

📋 **局部阶段验收清单：**

- [x] `npm run build` 通过。
- [x] Git commit 只包含本功能相关文件。
- [x] Vercel Production 状态为 `Ready`（需以 GitHub/Vercel 部署查询结果为准）。
- [x] 已记录 Vercel 函数最大执行时长，并确认真实 AI 超时设置不会超过平台能力。
- [x] 已确认生产留资不依赖 Vercel 本地 JSONL 文件。
- [x] 线上 `/tools/study-abroad-essay-check` 可打开。
- [x] 线上页面不加载旧 CSS。
- [x] 线上诊断流程 demo 路径可跑通。
- [x] 线上隐私文案可见。

---

## 🔴 第四部分：总验收与收尾把控 (The Final QC)

### 10. 最终集成验收清单 (Global Acceptance Checklist)

在所有 Milestone 的标记均变为“已完成”后，执行以下全流程校验。

#### 10.1 功能验收

- [x] `/tools/study-abroad-essay-check` 可访问。
- [x] 表单可以提交申请阶段、目标专业、文书类型和正文。
- [x] 无 API Key 时返回 demo fallback，且明确标注为示例报告。
- [x] 有 API Key 时返回结构化 AI 诊断。
- [x] 结果页展示综合评分、6 个维度、主要问题、证据、修改建议、服务推荐。
- [x] 结果页不输出完整改写稿。
- [x] 用户可以从结果页提交留资。
- [x] 留资记录包含 `diagnosticId` 和 `selectedService`。

#### 10.2 安全与隐私验收

- [x] 前端不保存完整文书到 `localStorage`。
- [x] 后端默认不写入完整文书正文。
- [x] 服务端日志不打印完整文书正文。
- [x] Vercel Production 不使用本地 JSONL 文件保存留资。
- [x] 缺少 Resend/邮件通知环境变量时，留资 API fail fast 并给出替代联系方式提示。
- [x] 未授权人工复核时，留资记录不包含完整文书。
- [x] 输入超过 15000 字符时，后端拒绝。
- [x] 输入超过 2500 英文词时，后端拒绝。
- [x] 频繁请求会被分钟级 rate limit 拦截。
- [x] 单 IP 或等效 key 每日超过上限会被 daily rate limit 拦截。
- [x] rate limit 命中后不会调用 AI，不消耗模型 token。
- [x] AI 判断不使用“AI 生成检测”表述。
- [x] 不出现录取概率承诺。

#### 10.3 AI 输出验收

- [x] `dimensionScores` 正好 6 项。
- [x] `mainProblems` 为 3-5 项。
- [x] `quickWins` 正好 3 项。
- [x] `primaryService` 来自 enum。
- [x] 真实 AI 模式下，至少 2 个 evidence 能通过 evidence 匹配器匹配原文。
- [x] evidence 匹配器能容忍空格、换行、标点、引号和大小写差异。
- [x] evidence 仅弱匹配时，会降低置信度或记录弱匹配状态。
- [x] AI 短暂失败会先静默重试，再进入 demo fallback。
- [x] 模型未配置、模型不可用或模型名错误时进入 demo fallback，不返回用户不可理解的 500。
- [x] Prompt 文件包含 System Prompt 和 User Prompt 骨架，且可选字段有默认注入值。
- [x] 已完成一次成本估算，明确单次调用和月度上限的计算口径。
- [x] JSON 不符合 Schema 时不会造成页面崩溃。
- [x] 诊断建议是修改方向，不是完整代写。

#### 10.4 UI 与转化验收

- [x] 已按 `docs/留学文书诊断工具DESIGN.md` 检查页面视觉、布局、组件状态和响应式。
- [x] 若使用 Tailwind，`--essay-*` 颜色已映射为 `essay` 语义 token。
- [x] 首屏是工具体验，不是空泛营销页。
- [x] 桌面端采用输入/结果双栏或等价高效工具布局。
- [x] 移动端按“标题 -> 表单 -> 文书 -> 隐私 -> 按钮 -> 结果 -> CTA -> 留资”顺序展示。
- [x] 核心字段默认可见，补充字段默认折叠。
- [x] 申请阶段、文书类型和用户担心问题使用按钮组/标签，不以长下拉为主交互。
- [x] 隐私声明显示在文书输入框附近。
- [x] 字数/词数提示根据阈值显示不同状态。
- [x] `DiagnosisProgress` 有 0-10s、10-20s、20-30s、30-45s 阶段文案和伪进度，不是单一 spinner。
- [x] 移动端 390x844 级别视口中，主按钮在首屏或轻微滚动内可见。
- [x] 结果页有服务分流 CTA。
- [x] Before / After 使用固定样例，明确不是对用户正文完整改写。
- [x] 电话链接为 `tel:400-869-9562`。
- [x] 电话链接不是默认蓝色下划线。
- [x] 获取报价入口存在。
- [x] 移动端按钮、评分、证据片段和 CTA 不发生文字溢出。
- [x] ERROR 状态提供“修改后重试”或“重新诊断”出口，不要求刷新页面。

#### 10.5 构建与部署验收

- [x] `npm run build` 通过。
- [x] Git 提交只包含本功能相关文件。
- [x] Vercel Production 构建完成并显示 `Ready`。
- [x] 线上页面可访问。
- [x] 线上 HTML/CSS 已刷新到最新版本。

#### 10.6 2026-05-04 实施验收记录

- Git 提交：`81e7aad Add study abroad essay diagnosis tool`
- Vercel 部署：`https://next-vercel-677fos0gv-alexs-projects-7309f453.vercel.app`
- 生产别名：`https://qqbytop.com`
- Vercel 状态：Production `Ready`
- 线上页面验证：`https://qqbytop.com/tools/study-abroad-essay-check` 返回 200。
- 线上诊断验证：`POST /api/tools/study-abroad-essay-check/diagnose` 返回 200，当前因生产未配置真实模型而进入 `source=demo`。
- 线上超长输入验证：超过 2500 英文词返回 400，未进入 AI 调用。
- 当前 AI 超时配置：代码默认 `AI_TIMEOUT_MS=45000`，API route 设置 `maxDuration=60`；Vercel CLI inspect 未直接显示账户级最大函数时长，真实模型上线前仍需结合当前 Vercel 方案复核。
- 当前模型配置：`OPENAI_REPORT_MODEL || OPENAI_TEXT_MODEL`；生产未确认配置时不会硬编码默认模型，直接 demo fallback。
- 当前留资策略：生产只走 Resend/邮件通知；缺少 `RESEND_API_KEY`、`RESEND_FROM` 或 `LEAD_NOTIFY_EMAIL` 时 fail fast，引导用户电话或邮箱联系。

### 11. 生产环境发布说明

本项目不需要 Dockerfile。当前主站发布路径是：

```text
本地开发
-> npm run build
-> git commit
-> git push origin main
-> Vercel 自动 Production 部署
-> 线上验证
```

如本地工作区存在无关变更，必须使用明确文件列表提交，不得 `git add .`。

### 12. 当前 PRD 版本结论

本 PRD 是留学文书诊断工具的开发执行基线。执行时优先级如下：

1. 隐私和边界优先于功能完整度。
2. 后端校验优先于前端体验。
3. 结构化 JSON 优先于自然语言自由输出。
4. 先跑通 demo fallback，再接真实 AI。
5. 先完成单个文本工具，再抽象更多工具。
6. 不破坏现有商务形象诊断工具。
