# 雅思写作 AI 诊断工具 AI 辅助开发规划文档 (AI-Driven PRD)

> **致 AI 作者的系统提示 / System Prompt**
>
> 在开始编写代码之前，请完整阅读本文件，并同时参考 `docs/雅思写作AI诊断工具编程PRD.md`。一切架构决策、技术栈、页面路径、数据结构、点数规则、支付安全和 AI 输出格式必须严格以本文档为准。不要凭借自身习惯自由发挥，不要把本工具做成雅思口语诊断的附属赠品，不要让写作点数和口语点数共享。如果在执行某一步骤中遇到依赖冲突、现有路由冲突、支付资质缺失、LLM 输出无法稳定符合 Schema、或权限边界无法落地，请立即停止编写代码，并在对应的【阻塞项说明】里记录，等待人类给出回复。
>
> **审查修订决策：** 写作工具作为独立产品售卖，但不得建设第二套用户、认证、支付和订单基础设施。V1 采用共享 IELTS Platform 后端：`/opt/ielts-platform-api`，端口 `8710`，API 统一 `/api/v1/*`。写作与口语可以独立模块、独立页面、独立点数，但共享 users、auth、orders、payments、credit_ledger 等底层表。

---

## 🟢 第一部分：总纲与底层心智 (The Prompt Base)

### 1. 项目定位与核心目标

- **项目名称：** 雅思写作 AI 诊断工具
- **目标 URL：** `/tools/ielts-writing`
- **产品形态：** 纯 Web C 端独立产品
- **业务一句话描述：** 面向雅思考生的 AI 写作诊断工具，用户粘贴 Task 1 或 Task 2 作文后，免费获得基础诊断报告，并可登录付费解锁四项评分、逐句批改、逻辑诊断、高分表达替换和 Band 7+ 改写示例。
- **核心交互对象：** 中国大陆及海外中文雅思备考用户；用户通过浏览器页面输入英文作文，系统返回中文诊断结果和英文证据片段。
- **核心业务目标：**
  - 通过免费基础诊断降低试用门槛。
  - 通过深度报告锁定区完成小额付费转化。
  - 建立写作深度诊断点数体系，支持复购。
  - 用题库页和写作主题页承接 SEO / 小红书流量。
  - 后续可扩展口语诊断，但 V1 写作产品必须独立成立。
- **核心工程目标：**
  - 在现有 Next.js App Router 项目中开发 Web 前端。
  - 后端采用 FastAPI + PostgreSQL + Redis + Worker 的独立服务。
  - LLM 输出必须通过 Pydantic Schema 校验后入库。
  - 未解锁深度报告时，服务端不得返回 `deep_result_json`。
  - 支付成功只以后端官方支付 webhook 为准，不信任前端状态。

### 2. 开发底线与工程心智 (System Directives)

- 严禁把写作诊断做成口语诊断套餐赠品页；本项目是独立写作产品。
- 严禁写作点数和口语点数共享；V1 只保留 `writing_deep_credits`、`speaking_deep_credits`、`human_review_credits`。基础写作诊断免费额度通过限流实现，不进入点数字段。
- 严禁使用个人收款码、免签支付或来路不明聚合支付作为正式产品支付通道。
- 严禁前端传入 `paid=true`、`unlocked=true` 后直接发放权益；只信任已验签的支付 webhook。
- 严禁将深度报告真实 JSON 返回给未解锁用户再用 CSS 模糊遮挡。
- 严禁承诺官方 IELTS 分数、保分、保提分、Band 9 保证或官方授权。
- 严禁将用户作文原文、LLM 密钥、支付密钥写入前端、localStorage、公开日志或浏览器可见响应中。
- 严禁在 V1 引入微信小程序、OCR、B 端老师工作台、Streamlit、LangGraph 或无限包月。
- 所有 API 必须做服务端输入长度、词数、频率、权限和 Schema 校验。
- 所有用户可见错误必须友好；原始异常只能进入服务端日志。
- 金额字段统一用整数分，例如 `2990` 表示 `￥29.90`，禁止使用 float。
- 所有订单发货必须幂等；重复 webhook 不得重复加点。
- LLM 输出必须以 Pydantic 对象为地基，不能直接把未校验字符串交给前端。
- evidence 字段必须尽量来自用户原文；如无法验证，降低置信度或移除该问题。
- 前端页面必须移动端可用，但 V1 不做拍照输入。
- 开发时不得破坏现有官网、已有诊断工具和雅思口语相关页面。

### 3. 风险免责与边界说明 (Boundaries & Out-of-Scope)

#### 3.1 第一版绝对不涵盖的功能

- 不做雅思口语诊断。
- 不做口语与写作组合包。
- 不做微信小程序。
- 不做 OCR 拍照识别。
- 不做 Word / PDF 上传解析。
- 不做 B 端老师工作台。
- 不做人工批改工作流，只预留 `human_review_credits`。
- 不做 Streamlit 后台。
- 不做 LangGraph、多轮 Agent 自主规划或循环反思。
- 不做无限次包月。
- 不做 AI 生成检测。
- 不做官方 IELTS 授权声明。

#### 3.2 已知技术风险与绕过

- **LLM JSON 不稳定：** 使用 Pydantic 严格校验；校验失败允许 1 次重试，仍失败则返回安全 fallback，并记录 `trace_id`。
- **模型给分虚高：** 所有页面写“预估分”或“诊断分区间”，不写“官方分数”。
- **用户输入超长导致成本失控：** 后端硬限制 15000 字符或 2500 英文词，超限返回友好提示。
- **匿名用户刷基础报告：** 使用 IP、anonymous_session、user_id、content_hash 多维限流；V1 不设置“写作基础诊断点数”字段，避免和免费基础报告混淆。
- **深度报告被绕过查看：** 报告查询 API 必须基于 user_id/report ownership/unlock 状态过滤字段。
- **支付回调重复：** 使用订单行锁或事务 + 状态检查，重复 webhook 返回 200 但不重复发货。
- **支付资质未就绪：** 先实现订单与点数服务，支付 provider 可用 mock provider 跑通；正式上线前必须换成官方微信/支付宝。
- **Redis 队列积压：** V1 先用轮询状态；队列积压时报告页展示排队提示，不同步阻塞 HTTP 请求。
- **Vercel 与腾讯云后端跨域：** 后端配置 CORS 白名单，只允许生产域名和本地开发域名。

---

## 🔵 第二部分：静态设计与硬性契约 (The Blueprints)

### 4. 技术栈选型与目录骨架

#### 4.1 核心技术栈

- **前端语言：** TypeScript
- **前端框架：** Next.js App Router + React Client Components
- **前端样式：** Tailwind CSS
- **前端部署：** Vercel
- **后端语言：** Python 3.11+
- **后端框架：** FastAPI
- **数据库：** PostgreSQL
- **队列/缓存：** Redis
- **异步任务：** RQ / Celery 二选一；V1 推荐 RQ，简单稳定
- **AI 调用：** LLM API，经 `llm_client.py` 统一封装
- **支付：** 微信支付 Native、支付宝电脑网站支付/当面付；Stripe 预留
- **共享后端决策：** 写作工具和口语工具共享一个 IELTS Platform API，不建立第二套用户、认证、订单或支付服务。写作模块只新增写作业务表、报告逻辑和 LLM 管线。
- **后端部署路径：** `/opt/ielts-platform-api`
- **后端本地端口：** `8710`
- **生产 API 域名建议：** `ielts-api.qqbytop.com`
- **API 版本前缀：** `/api/v1`

#### 4.2 前端强制目录结构

在现有 `next-vercel` 项目内开发：

```text
app/
  tools/
    ielts-writing/
      page.tsx
      pricing/
        page.tsx
      profile/
        page.tsx
      report/
        [reportId]/
          page.tsx
      topics/
        page.tsx
        [topicSlug]/
          page.tsx
components/
  ielts-writing/
    EssayInputPanel.tsx
    TaskTypeSegment.tsx
    WordCountMeter.tsx
    ReportLoadingState.tsx
    ReportHeader.tsx
    ScoreRadar.tsx
    DimensionScoreCards.tsx
    BasicFindings.tsx
    DeepReportGate.tsx
    DeepReportContent.tsx
    SentenceCorrectionList.tsx
    VocabularyUpgradeTable.tsx
    BandRewritePanel.tsx
    PricingCards.tsx
    CheckoutModal.tsx
    PaymentQRCode.tsx
    CreditSummary.tsx
    ReportHistoryTable.tsx
lib/
  ielts-writing/
    api.ts
    types.ts
    constants.ts
```

不要把新工具复制到 `diagnose-tools/` 独立静态应用里。

#### 4.3 后端强制目录结构

后端可以放在独立仓库或当前项目外部服务目录；若放入当前项目，使用：

```text
backend/
  app/
    main.py
    api/
      auth.py
      orders.py
      payments.py
      profile.py
      writing/
        essays.py
        reports.py
      speaking/
        reports.py
    services/
      diagnostic_basic.py
      diagnostic_deep.py
      llm_client.py
      entitlement.py
      payment_service.py
      rate_limit.py
      ownership.py
      auth_service.py
    workers/
      tasks.py
      queue.py
    models/
      user.py
      user_identity.py
      sms_verification_code.py
      anonymous_session.py
      essay.py
      report.py
      sku.py
      order.py
      entitlement.py
      credit_ledger.py
    schemas/
      diagnostic.py
      api.py
      payment.py
    db/
      session.py
      migrations/
    utils/
      hashing.py
      logging.py
      errors.py
      time.py
```

共享后端模块边界：

```text
共享模块：
  auth
  users
  user_identities
  orders
  payments
  credit_ledger
  user_entitlements

写作模块：
  essays
  writing reports
  writing LLM pipeline

口语模块：
  speaking reports
  SOE / ASR pipeline
```

### 5. 核心外部系统交互 (API/Dependencies)

#### 5.1 Next.js -> FastAPI

前端统一通过 API base 调用后端：

```env
NEXT_PUBLIC_IELTS_WRITING_API_BASE=https://ielts-api.qqbytop.com
```

本地开发：

```env
NEXT_PUBLIC_IELTS_WRITING_API_BASE=http://127.0.0.1:8710
```

#### 5.2 LLM 服务

所有模型调用只能经过：

```text
backend/app/services/llm_client.py
```

禁止各业务函数直接散落调用外部模型 SDK。

#### 5.2A 腾讯云短信服务

V1 手机号登录使用短信验证码，短信发送只能经过后端封装：

```text
backend/app/services/sms_service.py
```

开发环境可使用 mock provider，只在日志中输出验证码；生产环境必须接腾讯云短信或同等级官方短信服务。

需要的生产环境变量：

```env
TENCENTCLOUD_SECRET_ID=
TENCENTCLOUD_SECRET_KEY=
TENCENT_SMS_APP_ID=
TENCENT_SMS_SIGN_NAME=
TENCENT_SMS_TEMPLATE_ID_LOGIN=
```

#### 5.3 支付服务

正式产品使用官方接口：

```text
微信支付 Native
支付宝电脑网站支付 / 当面付
Stripe Checkout 预留
```

支付回调必须进入：

```text
POST /api/v1/payments/wechat/webhook
POST /api/v1/payments/alipay/webhook
POST /api/v1/payments/stripe/webhook
```

#### 5.4 接口路径契约

```text
POST /api/v1/writing/essays/submit
GET  /api/v1/writing/reports/{report_id}
GET  /api/v1/writing/reports/{report_id}/status
POST /api/v1/writing/reports/{report_id}/unlock
POST /api/v1/orders/create
GET  /api/v1/orders/{order_id}/status
GET  /api/v1/profile
GET  /api/v1/profile/reports
```

#### 5.5 Auth 认证契约

V1 采用共享 IELTS Platform Auth，不为写作工具单独建认证系统。

登录方式优先级：

```text
V1 必做：手机号短信验证码登录
V1.5 可做：微信服务号带参二维码登录
V2 可做：邮箱验证码 / 微信开放平台网站应用 / Google OAuth
```

Token 策略：

```text
后端签发短期 JWT access token，默认 7 天有效。
Web 前端优先使用 HttpOnly Cookie 保存登录态。
如跨域部署导致 Cookie 策略复杂，本地开发可临时使用 Authorization: Bearer <token>，生产上线前必须重新评估。
```

请求鉴权：

```text
Authorization: Bearer <access_token>
```

匿名到登录迁移：

```text
1. 用户提交作文时创建 anonymous_session。
2. 用户在报告页点击解锁时触发登录。
3. 登录成功后，后端将该 anonymous_session 下 essays 绑定到 user_id。
4. reports 通过 essays 归属于该 user_id。
5. 合并必须幂等，同一 anonymous_session 重复合并不会重复创建报告或点数。
```

手机号验证码安全规则：

```text
验证码有效期：5 分钟。
同一手机号：60 秒内最多发送 1 次。
同一手机号：每日最多发送 10 次。
同一 IP：每日最多发送 30 次。
同一验证码最多尝试 5 次。
验证码只保存 hash，不保存明文。
验证成功后必须写 consumed_at，禁止重复使用。
短信供应商 V1 推荐腾讯云短信。
```

短信登录接口：

```text
POST /api/v1/auth/sms/send
POST /api/v1/auth/sms/verify
```

用户身份表：

```text
users：内部主用户。
user_identities：登录方式绑定表，V1 支持 phone，后续支持 email、wechat_openid、google_sub。
sms_verification_codes：短信验证码表，用于登录验证码发送、校验、限流和审计。
```

#### 5.6 LLM 流水线与成本契约

V1 不使用 LangGraph，使用固定流水线。

基础诊断流水线：

```text
输入清洗
→ 词数/长度/Task 类型校验
→ 单次 LLM 调用生成 BasicWritingReport
→ Pydantic 校验
→ evidence 规范化校验
→ 入库 reports.basic_result_json
```

深度诊断流水线：

```text
复用作文原文与基础报告
→ 并发调用 3 个专职异步函数：
   1. sentence_correction_agent：逐句语法/词汇/结构批改
   2. paragraph_logic_agent：段落角色、TR/CC 和论证问题
   3. vocabulary_rewrite_agent：LR、表达替换与 Band 7+ 改写样例
→ aggregator 函数汇总为 DeepWritingReport
→ Pydantic 校验
→ 生成 meta_json
→ 入库 reports.deep_result_json
```

模型建议：

```text
基础诊断：低成本模型，例如 gpt-4o-mini 或同级别模型。
深度诊断：可先用低成本模型完成 MVP；若质量不足，仅 aggregator 或 rewrite 节点升级到更强模型。
```

粗略 token 预算：

```text
Task 2 250-320 词：
  基础诊断：输入 900-1400 tokens，输出 700-1200 tokens。
  深度诊断：总输入 2500-4500 tokens，总输出 2500-5000 tokens。

Task 1 150-220 词：
  基础诊断：输入 700-1200 tokens，输出 600-1000 tokens。
  深度诊断：总输入 2000-3500 tokens，总输出 2000-4000 tokens。
```

每次生成必须记录：

```text
prompt_version
model_id
generation_time_ms
input_token_count
output_token_count
confidence_score
```

#### 5.7 报告轮询与降级策略

V1 使用轮询，不强制 SSE：

```text
轮询间隔：2 秒
基础报告超时：90 秒
深度报告超时：120 秒
```

超时后的前端行为：

```text
展示：报告生成较慢，请稍后在「我的报告」中查看。
提供：手动刷新按钮。
提供：返回个人中心按钮。
后台：任务继续执行，不因前端超时而取消。
```

网络断开后的前端行为：

```text
暂停轮询并提示网络异常。
网络恢复后继续查询 /status。
页面刷新后根据 report_id 恢复状态。
```

### 6. 核心数据实体与 Schema

#### 6.1 前端 TypeScript 类型

```ts
export type WritingTaskType = "task1" | "task2";

export type ReportStatus =
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "locked";

export type CreditType =
  | "writing_deep"
  | "speaking_deep"
  | "human_review";

export interface EssaySubmitRequest {
  anonymous_session_id?: string;
  task_type: WritingTaskType;
  prompt?: string;
  content: string;
  source?: "homepage" | "topic_page" | "profile_retry";
}

export interface EssaySubmitResponse {
  essay_id: string;
  report_id: string;
  anonymous_session_id: string;
  basic_status: ReportStatus;
}

export interface DimensionScore {
  dimension: "TR" | "CC" | "LR" | "GRA";
  score: number;
  summary_zh: string;
}

export interface BasicWritingReport {
  estimated_band_range: BandRange;
  task_type: WritingTaskType;
  word_count: number;
  task_fit_summary_zh: string;
  dimension_scores: DimensionScore[];
  top_issues: BasicIssue[];
  sample_revision: SampleRevision;
  upgrade_hint_zh: string;
}

export interface BandRange {
  low: number; // 0-9, 0.5 step
  high: number; // 0-9, 0.5 step, high >= low
}

export interface ReportResponse {
  report_id: string;
  essay_id: string;
  basic_status: ReportStatus;
  deep_status: ReportStatus;
  unlocked: boolean;
  basic: BasicWritingReport | null;
  deep: DeepWritingReport | null;
}
```

#### 6.2 后端 Pydantic Schema

```python
from typing import Literal
from pydantic import BaseModel, Field

class BandRange(BaseModel):
    low: float = Field(ge=0, le=9, multiple_of=0.5)
    high: float = Field(ge=0, le=9, multiple_of=0.5)

class DimensionScore(BaseModel):
    dimension: Literal["TR", "CC", "LR", "GRA"]
    score: float = Field(ge=0, le=9, multiple_of=0.5)
    summary_zh: str

class BasicIssue(BaseModel):
    category: str
    evidence: str
    explanation_zh: str
    severity: Literal["low", "medium", "high"]

class SampleRevision(BaseModel):
    original: str
    revised: str
    reason_zh: str

class BasicWritingReport(BaseModel):
    estimated_band_range: BandRange
    task_type: Literal["task1", "task2"]
    word_count: int
    task_fit_summary_zh: str
    dimension_scores: list[DimensionScore]
    top_issues: list[BasicIssue]
    sample_revision: SampleRevision
    upgrade_hint_zh: str

class SentenceCorrection(BaseModel):
    original: str
    corrected: str
    category: Literal[
        "Tense",
        "SubjectVerbAgreement",
        "ArticlesPrepositions",
        "SentenceStructure",
        "LexicalChoice",
        "Cohesion",
        "TaskResponse",
    ]
    explanation_zh: str
    band_impact_zh: str

class VocabularyUpgrade(BaseModel):
    original_phrase: str
    suggested_phrase: str
    register_note_zh: str

class ParagraphFeedback(BaseModel):
    paragraph_index: int
    role: str
    issue_zh: str
    suggestion_zh: str

class DeepWritingReport(BaseModel):
    overall_band: float = Field(ge=0, le=9, multiple_of=0.5)
    tr_score: float = Field(ge=0, le=9, multiple_of=0.5)
    cc_score: float = Field(ge=0, le=9, multiple_of=0.5)
    lr_score: float = Field(ge=0, le=9, multiple_of=0.5)
    gra_score: float = Field(ge=0, le=9, multiple_of=0.5)
    examiner_summary_zh: str
    paragraph_feedback: list[ParagraphFeedback]
    sentence_corrections: list[SentenceCorrection]
    vocabulary_upgrades: list[VocabularyUpgrade]
    band7_rewrite_sample: str
    next_practice_tasks_zh: list[str]

class ReportGenerationMeta(BaseModel):
    prompt_version: str
    model_id: str
    generation_time_ms: int
    input_token_count: int | None = None
    output_token_count: int | None = None
    confidence_score: float = Field(ge=0, le=1)
```

#### 6.3 数据库实体

必须包含以下表：

```text
users
user_identities
sms_verification_codes
anonymous_sessions
essays
reports
user_entitlements
credit_ledger
skus
orders
```

关键字段：

```text
reports.basic_result_json
reports.deep_result_json
reports.meta_json
reports.basic_status
reports.deep_status
user_entitlements.writing_deep_credits
user_entitlements.speaking_deep_credits
orders.amount_cents
orders.status
credit_ledger.credit_type
credit_ledger.balance_after
```

### 7. 核心业务状态机 (State Machine)

#### 7.1 基础报告状态

合法状态：

```text
queued
processing
ready
failed
```

转移规则：

```text
queued -> processing: Worker 开始处理。
processing -> ready: Pydantic 校验成功并入库。
processing -> failed: LLM 超时、Schema 失败、系统异常。
failed -> queued: 仅允许用户手动重试或管理员重跑。
ready -> processing: 禁止，除非新建重跑版本。
```

#### 7.2 深度报告状态

合法状态：

```text
locked
queued
processing
ready
failed
```

转移规则：

```text
locked -> queued: 用户登录且成功扣除 writing_deep_credits。
queued -> processing: Worker 开始处理。
processing -> ready: 深度报告生成成功。
processing -> failed: 深度报告生成失败。
failed -> queued: 用户点击重试；重试不重复扣点，除非已重新创建报告。
ready -> locked: 绝对禁止。
ready -> processing: 禁止，除非管理员创建新版本。
```

#### 7.3 订单状态

合法状态：

```text
pending
paid
failed
closed
refunded
```

转移规则：

```text
pending -> paid: 已验签支付 webhook 确认成功。
pending -> failed: 支付渠道明确失败。
pending -> closed: 超时未支付或用户取消。
paid -> refunded: 退款完成。
paid -> pending: 绝对禁止。
refunded -> paid: 绝对禁止。
```

#### 7.4 点数流水规则

```text
任何点数变动必须写 credit_ledger。
任何发货必须在订单事务中完成。
writing_deep 不得扣 speaking_deep。
同一 report_id 重复 unlock 不得重复扣点。
```

#### 7.5 content_hash 去重规则

```text
1. 同一 anonymous_session 或同一 user_id，在 24 小时内提交相同 content_hash，直接返回已有 report_id。
2. 不同用户提交相同作文，不共享报告结果，必须创建各自独立 essay/report，避免隐私和权限混淆。
3. 深度解锁始终绑定具体 report_id，不绑定 content_hash。
4. 如果已有 report_id 的 deep_status=ready，再次查看不得重复扣点或重复生成。
5. content_hash 只用于去重和限流，不作为跨用户共享缓存依据。
```

---

## 🟠 第三部分：执行控制平台 (The Execution Engine)

### 8. 全局推荐开发顺序 (Global Execution Order)

采用双轨并行，但每条轨道内部仍需按顺序推进：

```text
前端轨道：
  Milestone 1 前端静态页面与 Mock 数据
  → Milestone 7 题库 SEO 与增长页

后端轨道：
  Milestone 2 数据库与基础 API
  → Milestone 3 基础诊断 Worker 与 LLM Schema
  → Milestone 4 登录、匿名合并、点数系统
  → Milestone 5 深度诊断与解锁权限
  → Milestone 6 官方支付闭环

汇合点：
  Milestone 8 生产部署与全链路验收
```

并行约束：

```text
Milestone 1 和 Milestone 2 可以同时启动。
Milestone 7 可以在 Milestone 1 完成后启动，不必等待支付完成。
Milestone 8 必须等待 M1-M7 全部验收完成。
任何涉及真实扣点、支付、报告权限的联调必须等待 M4-M6 完成。
```

### 9. 切分出来的多个里程碑 (Milestones)

> **致 AI 的执行规范：** 请按第 8 节的双轨计划推进。前端轨道和后端轨道可以并行；同一轨道内未完成上一阶段验收前，严禁开始下一阶段。每次对代码进行重大推进，请自行更新“当前进度”。如果遇到缺少支付资质、数据库无法连接、模型输出不稳定、现有路由冲突或安全边界无法实现，必须停止编码，在【阻塞项说明】中记录并等待人类确认。

---

## 🏁 Milestone 1: 前端静态页面与 Mock 数据

### 🎯 局部任务目标

在现有 Next.js 项目中建立雅思写作诊断工具的前端页面骨架，使用 mock 数据跑通首页、报告页、套餐页和个人中心的核心交互。

### 🚧 前置依赖

无。

### 👣 局部微观执行步骤

1. 创建 `/tools/ielts-writing` 路由。
2. 创建 `/tools/ielts-writing/report/[reportId]` 路由。
3. 创建 `/tools/ielts-writing/pricing` 路由。
4. 创建 `/tools/ielts-writing/profile` 路由。
5. 创建 `components/ielts-writing/` 组件目录。
6. 创建 `lib/ielts-writing/types.ts` 与 `constants.ts`。
7. 编写 `EssayInputPanel`、`TaskTypeSegment`、`WordCountMeter`。
8. 编写报告页 mock：`ScoreRadar`、`BasicFindings`、`DeepReportGate`、`DeepReportContent`。
9. 编写套餐卡片：`writing_trial_1`、`writing_pack_5`、`writing_pack_15`。
10. 编写移动端响应式布局。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] `npm run typecheck` 通过。
- [ ] `npm run build` 通过。
- [ ] 首页可输入作文并显示字数。
- [ ] 报告页可展示基础/锁定/已解锁三种 mock 状态。
- [ ] 套餐页只展示写作点数套餐。
- [ ] 页面移动端无横向溢出。

---

## 🏁 Milestone 2: 数据库与基础 API

### 🎯 局部任务目标

搭建 FastAPI 后端、PostgreSQL schema、作文提交 API、报告查询 API 和匿名 session 机制。

### 🚧 前置依赖

Milestone 1 完成。

### 👣 局部微观执行步骤

1. 建立后端目录骨架。
2. 配置 `DATABASE_URL`、`REDIS_URL`、后端启动脚本。
3. 创建数据库模型：users、anonymous_sessions、essays、reports。
4. 实现 `POST /api/v1/writing/essays/submit`。
5. 实现 `GET /api/v1/writing/reports/{report_id}`。
6. 实现 `GET /api/v1/writing/reports/{report_id}/status`。
7. 实现匿名 session 创建与过期。
8. 实现服务端输入校验。
9. 实现报告字段过滤：未解锁时 deep 必须返回 null。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] 后端可启动。
- [ ] 可提交作文并获得 `report_id`。
- [ ] 可查询报告状态。
- [ ] 未解锁报告接口不返回 `deep_result_json`。
- [ ] 超长输入被服务端拒绝。
- [ ] 非本人报告无法访问。

---

## 🏁 Milestone 3: 基础诊断 Worker 与 LLM Schema

### 🎯 局部任务目标

实现基础诊断异步任务，生成 `BasicWritingReport`，并在前端报告页展示。

### 🚧 前置依赖

Milestone 2 完成。

### 👣 局部微观执行步骤

1. 配置 Redis 队列。
2. 创建 Worker 任务 `generate_basic_report(report_id)`。
3. 创建 `diagnostic_basic.py`。
4. 创建 `llm_client.py`。
5. 实现 `BasicWritingReport` Pydantic Schema。
6. 设计基础诊断 Prompt。
7. 处理 LLM 超时、重试、fallback。
8. 基础报告入库到 `reports.basic_result_json`。
9. 前端轮询状态并渲染基础报告。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] 基础诊断任务可入队。
- [ ] Worker 可消费任务。
- [ ] LLM 输出可通过 Pydantic 校验。
- [ ] 基础报告成功入库。
- [ ] 前端可从 queued 轮询到 ready。
- [ ] LLM 失败时用户看到友好失败状态。

---

## 🏁 Milestone 4: 登录、匿名合并与点数系统

### 🎯 局部任务目标

实现用户登录、匿名作文合并、写作点数余额和点数流水。

### 🚧 前置依赖

Milestone 3 完成。

### 👣 局部微观执行步骤

1. 创建 `user_entitlements` 表。
2. 创建 `credit_ledger` 表。
3. 实现手机号短信验证码登录接口，开发态可使用 mock 短信 provider。
4. 实现 anonymous_session -> user_id 合并。
5. 实现 `sms_verification_codes` 建表、验证码 hash、attempt_count 与 consumed_at。
6. 实现 `entitlement.py`。
7. 实现 `GET /api/v1/profile`。
8. 实现 `GET /api/v1/profile/reports`。
9. 实现点数余额前端展示。
10. 确认写作点数与口语点数字段分离。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] 匿名报告可合并到登录用户。
- [ ] 手机号验证码不明文入库。
- [ ] 验证码过期、重试次数和发送频率限制生效。
- [ ] 用户可查看历史报告。
- [ ] 用户可查看 `writing_deep_credits`。
- [ ] 点数变动写入 `credit_ledger`。
- [ ] `speaking_deep_credits` 不参与写作解锁。

---

## 🏁 Milestone 5: 深度诊断与解锁权限

### 🎯 局部任务目标

实现深度报告解锁、扣点、异步生成和报告展示。

### 🚧 前置依赖

Milestone 4 完成。

### 👣 局部微观执行步骤

1. 实现 `POST /api/v1/writing/reports/{report_id}/unlock`。
2. 在事务中扣除 1 个 `writing_deep` 点数。
3. 写入 `credit_ledger`。
4. 更新 `reports.deep_status=queued`。
5. 创建 Worker 任务 `generate_deep_report(report_id)`。
6. 创建 `DeepWritingReport` Pydantic Schema。
7. 创建 `diagnostic_deep.py`。
8. 深度报告入库到 `reports.deep_result_json`。
9. 前端已解锁时展示 `DeepReportContent`。
10. 同一报告重复查看不得重复扣点。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] 无点数用户不能解锁。
- [ ] 有点数用户可解锁并扣 1 点。
- [ ] 扣点失败时不生成深度报告。
- [ ] 深度报告生成成功后可展示。
- [ ] 解锁后报告接口返回 deep JSON。
- [ ] 未解锁报告接口仍返回 deep=null。

---

## 🏁 Milestone 6: 官方支付闭环

### 🎯 局部任务目标

实现 SKU、订单创建、官方支付二维码、订单状态查询、webhook 验签、幂等发货和点数发放。

### 🚧 前置依赖

Milestone 5 完成。

### 👣 局部微观执行步骤

1. 创建 `skus` 表并写入初始套餐。
2. 创建 `orders` 表。
3. 实现 `POST /api/v1/orders/create`。
4. 实现 `GET /api/v1/orders/{order_id}/status`。
5. 实现 `payment_service.py` 抽象层。
6. 实现微信 Native 支付 provider。
7. 实现微信 webhook 验签。
8. 在 webhook 事务中更新订单并发放点数。
9. 前端 `CheckoutModal` 展示支付二维码。
10. 前端轮询订单状态，支付成功后更新余额。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
如微信支付商户号、证书或 APIv3 Key 未准备好，先使用 mock provider 跑通订单状态机，不得接入个人码或免签支付。
```

### 📋 局部阶段验收清单

- [ ] 可创建 pending 订单。
- [ ] 可展示微信支付二维码。
- [ ] webhook 验签失败时拒绝处理。
- [ ] webhook 重复通知不重复发点。
- [ ] 支付成功后 `writing_deep_credits` 增加。
- [ ] `credit_ledger` 有对应充值流水。
- [ ] 金额以整数分存储。

---

## 🏁 Milestone 7: 题库 SEO 与增长页

### 🎯 局部任务目标

建立雅思写作题库页和单题页，让自然流量进入诊断入口。

### 🚧 前置依赖

Milestone 6 完成。

### 👣 局部微观执行步骤

1. 创建 `/tools/ielts-writing/topics`。
2. 创建 `/tools/ielts-writing/topics/[topicSlug]`。
3. 准备初始题库数据结构。
4. 实现 Task 1 / Task 2 分类。
5. 单题页展示题目原文、中文解释、写作思路、高分词汇、范文片段。
6. 单题页嵌入作文诊断入口。
7. 配置唯一 title、description、canonical。
8. 添加站内相关题目内链。
9. 报告页 `/tools/ielts-writing/report/[reportId]` 必须设置 `noindex`，题库页和单题页允许 index。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] 题库列表页可访问。
- [ ] 单题页可访问。
- [ ] 单题页可直接提交作文诊断。
- [ ] SEO metadata 唯一且准确。
- [ ] 用户报告页 noindex，题库页 index。
- [ ] 页面内容对用户有实际帮助，不是关键词堆砌。

---

## 🏁 Milestone 8: 生产部署与全链路验收

### 🎯 局部任务目标

完成 Vercel 前端、腾讯云 VPS 后端、PostgreSQL、Redis、Worker、支付回调地址和生产环境验收。

### 🚧 前置依赖

Milestone 7 完成。

### 👣 局部微观执行步骤

1. 准备后端 `.env.example`。
2. 编写后端 Dockerfile 或启动脚本。
3. 配置 Nginx 反向代理。
4. 配置 HTTPS。
5. 配置 CORS 白名单。
6. 配置 Redis 与 Worker 常驻。
7. 配置支付 webhook 生产回调 URL。
8. 前端 Vercel 配置 API base。
9. 跑通一条真实或沙箱订单。
10. 跑通基础报告与深度报告。
11. 配置结构化日志、队列积压监控和支付 webhook 失败告警。

### 📊 当前进度 (Current Progress)

[ 待启动 ]

AI 修改区：

```text
尚未开始。
```

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

```text
暂无。
```

### 📋 局部阶段验收清单

- [ ] 前端生产域名可访问。
- [ ] 后端健康检查可访问。
- [ ] PostgreSQL 连接正常。
- [ ] Redis 连接正常。
- [ ] Worker 可消费任务。
- [ ] 支付回调 URL 可公网访问。
- [ ] 全链路从提交作文到付费解锁可跑通。
- [ ] 队列积压数量可查看。
- [ ] 支付 webhook 失败有 ERROR 日志。
- [ ] LLM 调用成功率和平均延迟可从日志统计。

---

## 🔴 第四部分：总验收与收尾把控 (The Final QC)

### 10. 最终集成验收清单 (Global Acceptance Checklist)

在所有 Milestone 的标记均变为“已完成”后，启动全流程校验。

#### 10.1 产品验收

- [ ] 用户不登录可以提交作文。
- [ ] 用户可以看到基础报告。
- [ ] 用户未解锁时看不到深度报告真实内容。
- [ ] 用户登录后可购买写作深度诊断点数。
- [ ] 用户有点数可解锁一份深度报告。
- [ ] 解锁同一报告不会重复扣点。
- [ ] 用户可在个人中心查看历史报告。
- [ ] 写作点数和口语点数不共享。

#### 10.2 安全验收

- [ ] 篡改前端 `unlocked=true` 不会返回 deep JSON。
- [ ] 未登录用户不能访问他人匿名报告。
- [ ] 登录用户不能访问非本人报告。
- [ ] 前端不包含 LLM、支付、数据库密钥。
- [ ] 支付成功只以后端 webhook 为准。
- [ ] webhook 验签失败不会发点。
- [ ] webhook 重放不会重复发点。
- [ ] 金额字段均为整数分。

#### 10.3 AI 输出验收

- [ ] 基础报告符合 `BasicWritingReport` Schema。
- [ ] 深度报告符合 `DeepWritingReport` Schema。
- [ ] 评分字段均在 0-9。
- [ ] evidence 不明显编造。
- [ ] 不出现官方授权、保分、Band 9 保证等违规承诺。
- [ ] LLM 失败时有友好 fallback。

#### 10.4 破坏性测试

- [ ] 空作文提交被拦截。
- [ ] 超长作文提交被拦截。
- [ ] 大量空格和换行不会导致 Server 500。
- [ ] 重复提交同一作文不会重复消耗深度点数。
- [ ] Redis 暂停时 API 返回友好错误。
- [ ] LLM API 超时时报告状态进入 failed。
- [ ] 数据库连接缺失时服务启动 Fail-Fast。

#### 10.5 日志与运维

- [ ] 后端日志包含 `trace_id`。
- [ ] 支付 webhook 日志记录 provider event id。
- [ ] LLM 调用失败日志不包含用户完整作文原文。
- [ ] 关键业务动作有 INFO 日志。
- [ ] 异常有 ERROR 日志。
- [ ] `.env.example` 完整列出必需变量。

#### 10.6 部署验收

- [ ] 前端 `npm run typecheck` 通过。
- [ ] 前端 `npm run build` 通过。
- [ ] 后端可一键启动。
- [ ] Worker 可一键启动。
- [ ] Nginx/HTTPS 可用。
- [ ] Vercel 环境变量配置正确。
- [ ] 腾讯云后端 CORS 只允许指定域名。

---

## 11. 最低可售卖标准

只有同时满足以下条件，才允许进入付费灰度：

```text
1. 用户能免费生成基础报告。
2. 未解锁接口不会返回深度报告。
3. 用户能登录并购买写作深度点数。
4. 支付 webhook 能安全发放点数。
5. 用户能扣点解锁深度报告。
6. 深度报告能明确告诉用户：为什么扣分、怎么改、下一篇练什么。
```

---

## 12. V2 预留但不得提前实现

V2 可考虑：

```text
微信服务号带参二维码登录
小红书分享海报
邀请奖励
人工精批
Word 文件上传
Task 1 图表识别
雅思口语诊断独立产品
写作 + 口语输出项组合包
```

V2 扩展仍需遵守：

```text
账号可以统一。
支付可以统一。
用户中心可以统一。
写作点数和口语点数必须分开。
报告权限必须由服务端控制。
```
