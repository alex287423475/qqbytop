# 高考英语作文诊断工具 AI 辅助开发规划文档 (AI-Driven PRD)

本文档版本：v1.0  
依赖 PRD 版本：`gaokao-english-essay-diagnostic-prd.md` v0.5  
依赖 Design 版本：`gaokao-english-essay-diagnostic-design.md` v0.3

> **致 AI 作者的系统提示 / System Prompt**
>
> 在开始编写代码之前，请完整阅读本文件，并同时参考：
>
> - `docs/gaokao-english-essay-diagnostic-prd.md` v0.5
> - `docs/gaokao-english-essay-diagnostic-design.md` v0.3
>
> 一切架构决策、技术栈、页面路径、数据结构、支付安全、上传安全、AI 输出格式、消费者权益和部署边界必须严格以本文档为准。不要凭借自身习惯自由发挥，不要把本工具做成雅思写作、留学文书或海外商务形象诊断的变体，不要复用不适合高考作文场景的评分维度。如果执行中遇到依赖冲突、现有路由冲突、支付资质缺失、云存储不可用、LLM/OCR 输出无法稳定符合 Schema、或权限边界无法落地，请立即停止编写代码，并在对应的【阻塞项说明】里记录，等待人类回复。
>
> **当前开发目录：** `D:\projects\北京全球博译翻译官网\next-vercel`
>
> **硬性决策：** 高考英语作文诊断工具必须作为 `qqbytop.com` 主站下的诊断工具子路由开发，用户侧路径固定为 `/tools/gaokao-english-essay-diagnosis`。不得在 `public/tools/` 下复制一个独立静态工具，不得新建第二个官网项目。

---

## 🟢 第一部分：总纲与底层心智 (The Prompt Base)

### 1. 项目定位与核心目标

- **项目名称：** 高考英语作文诊断工具
- **目标 URL：** `/tools/gaokao-english-essay-diagnosis`
- **产品形态：** 主站内 Next.js App Router 诊断工具，配套独立后端/Serverless-ready API 能力。
- **业务一句话描述：** 面向高考英语作文场景，用户粘贴作文或上传作文照片，系统生成 AI 诊断报告，免费展示摘要，购买 20 篇深度精诊额度包或三人同学组队价后解锁当前报告，并保留剩余额度用于后续作文诊断；异常时提供一键智能申诉与重试/退款。
- **核心交互对象：** 高中学生与家长；主要从移动端进入，也支持桌面端。
- **核心业务目标：**
  - 快速验证高考英语作文诊断的真实需求与付费意愿。
  - 通过免费摘要降低试用门槛，通过完整报告完成小额转化。
  - 使用图片直传、队列削峰和智能申诉降低一人公司的运维负担。
  - 作为 `qqbytop.com/tools` 诊断工具矩阵中的教育类入口。
- **核心工程目标：**
  - 在现有 `next-vercel` 项目内开发前端页面和工具入口。
  - 新增 `lib/gaokao-essay/` 承载高考作文专属业务逻辑。
  - 复用 `components/diagnose-tools/` 中可复用的布局思想，但不得照搬留学文书或雅思的评分逻辑。
  - 图片上传必须采用预签名 URL 浏览器直传云存储。
  - OCR、诊断、支付、退款、补位必须通过 service/adapter 封装，保留 Serverless 切换能力。
  - 未解锁时，服务端必须强制返回 `full_report: null`。

### 2. 开发底线与工程心智 (System Directives)

- 严禁把用户侧页面放到 `/`、`/review`、`/report` 等独立子站路径；所有用户侧路由必须在 `/tools/gaokao-english-essay-diagnosis` 前缀下。
- 严禁把高考英语作文工具做成 IELTS、留学文书或商务形象工具的换皮版本。
- 严禁将图片上传流量经由 Vercel API、Next.js API 或 VPS 中转；生产必须使用 `upload_intent -> presigned PUT -> complete -> recognition`。
- 严禁后端接受任意公网图片 URL 作为识别输入；只能接受服务端生成并校验归属的 `object_key`。
- 严禁同步 HTTP 请求内执行完整 OCR、LLM 诊断、退款、发票或补位长任务；必须入队或异步执行。
- 严禁前端传入 `paid=true`、`unlocked=true`、`is_unlocked=true` 后直接发放权益；只信任服务端订单状态与已验签 webhook。
- 严禁未解锁时返回完整报告 JSON 再用 CSS/前端隐藏。
- 严禁使用“保分、提分、阅卷组内部、名师亲批、官方高考评分”等表达。
- 严禁使用“满分绝密、提分秘籍、致命丢分点、不拉人就亏”等夸大、恐吓或强操纵营销表达。
- 严禁出现“拒绝售后”“不接受退款”“最终解释权归平台所有”等排除用户权利的文案。
- 严禁展示虚构真实用户、虚构头像、虚构班级群动态、虚假锚定价或伪稀缺倒计时。
- 严禁把 WebSocket + Redis Pub/Sub 作为首版解锁正确性的依赖；首版必须通过数据库状态 + HTTP 轮询/手动补单完成解锁。
- 严禁默认把学生作文、图片或诊断结果写入 Data Lake、训练集、微调数据集、营销案例库或公开 SEO 页面。
- 严禁使用 `allow_origins=["*"]`；生产 CORS 必须使用白名单。
- 严禁将 OpenAI key、OCR key、支付密钥、商户私钥、Supabase service role key 暴露到前端。
- 严禁通过亲友账号、无关主体账号或批量 API Key 池规避 LLM provider 的 RPM/TPM、风控或服务条款。
- 严禁通过多商户号规避支付平台风控、拆分交易规模、隐藏真实业务主体或跨主体混收。
- 严禁通过亲友自交易、虚假交易或“养号”制造支付流水。
- 严禁业务代码直接调用单一 LLM provider；诊断必须通过 `LLMRouter` / adapter 层。
- 严禁把广告 Pixel、前端成功页、WebSocket 消息或本地浏览器状态作为支付成功、收入统计或权益解锁的事实来源；支付事实只能来自已验签 webhook 或订单同步。
- 严禁向广告平台回传作文文本、图片、诊断报告、手机号/邮箱明文、未成年人身份信息或其他可直接识别学生的内容。
- 严禁在全局 layout 中硬编码广告 Pixel；所有 Pixel 和 server-side conversion 必须由环境变量开关控制，默认关闭。
- 严禁把 `订单异常 / 申请退款` 做成刻意隐藏入口；也严禁做成无状态判断的“无条件秒退”按钮。
- 严禁让 AI 自助助手直接退款、解锁报告、修改订单、修改报告或触发官方助力名额；助手只能调用受控工具，最终由服务端状态机决定。
- 严禁向 AI 客服模型发送作文原文、图片、手机号/邮箱明文、支付流水号、身份证、准考证等非必要敏感信息。
- 所有金额字段统一用整数分，例如 `9900` 表示 `￥99.00`。
- 所有 webhook、订单同步、报告重试、自动退款必须幂等。
- 所有 AI/OCR 输出必须通过 schema 校验和后处理，不能直接把模型原始字符串交给前端。
- 所有用户可见错误必须友好；原始异常只能进入服务端日志或审计日志。
- 前端必须移动端可用，375px 宽度不得横向滚动。
- 开发过程中不得破坏现有官网、现有工具矩阵、雅思工具、留学文书工具、商务形象工具和 SEO 管线。

### 3. 风险免责与边界说明 (Boundaries & Out-of-Scope)

#### 3.1 第一版绝对不涵盖的功能

- 不做 IELTS、托福、四六级、考研英语、CATTI 或留学文书诊断。
- 不做历年真题题库。
- 不做完整课程系统。
- 不做老师工作台。
- 不做人工批改派单。
- 不做微信小程序。
- 不做自动生成海量小红书/知乎营销图。
- 不做真实学生作文自动转 SEO 页面。
- 不做完整错题本。
- 不做虚假真实用户拼团动态；官方助力仅作为内部兜底和审计数据，不展示为真实成员、头像、昵称或同学动态。
- 不做 WebSocket + Redis 实时解锁网关；它只能作为 V2 优化，不是首版工程内容。
- 不做 Data Lake、模型训练、模型微调或学生作文数据商业再利用。
- 不做成绩承诺或提分承诺。
- 不做自动开票。

#### 3.2 已知技术风险与绕过

- **手写 OCR 成本高：** OCR 通过 adapter 封装，首版可用 `gpt-5.5`，但必须保留切换百度手写 OCR、Google Vision 或其他专业 OCR 的能力；免费入口必须限额。
- **图片质量不稳定：** OCR 失败时返回质量提醒，前端提示重新拍照或改为手动输入。
- **OCR 误识别导致误判：** 专业 OCR 输出必须标准化为 `ocr_result`，疑似 OCR 伪影进入 `uncertain_spans`，诊断模型只能参考并标记，不能静默修复后直接评分。
- **单一 LLM provider 不稳定：** 诊断通过 `LLMRouter` 统一调度 DeepSeek、Qwen、Doubao、OpenAI 等合规 provider，按错误率、429/503、timeout 和预算执行熔断与 fallback。
- **高亮偏移不可靠：** 后端必须用 `original` 对 `highlight_spans` 进行精确/模糊匹配和偏移修正；无法定位时标记 `position_status = "unresolved"`。
- **Vercel 前端抗住但后端被打爆：** 所有诊断只入队；队列超过阈值时返回排队提示或 429；Webhook、退款、订单同步最高优先级。
- **匿名用户刷量：** 使用 IP、session、draft token、draft、内容 hash、Turnstile 开关组合限流。
- **支付后报告找不回：** 支付前必须绑定手机号或邮箱；登录后提供历史报告页。
- **支付回调重复或乱序：** 使用订单状态机、事务/行锁和幂等键。
- **商户号风控与主体不一致：** 多商户号只用于同一合法主体或明确授权服务商体系下的通道冗余、额度管理和故障隔离；不用于规避风控或跨主体混收。
- **商户额度并发不一致：** `daily_used_cents` 在支付成功后原子累加，每日 UTC+8 00:00 重置。
- **用户误点未出报告：** 智能申诉先同步状态和重试，超过阈值仍未交付才自动退款。
- **退款入口被滥用：** 自助退款入口必须清晰，但先复用 `smart_appeal_report` 判断订单、报告、重试和超时状态；已完整生成并解锁的报告不自动秒退。
- **AI 客服越权：** AI 自助助手只回答流程问题和触发受控工具，不直接执行退款、解锁、补位或订单修改。
- **免费层泄漏过多价值：** 免费层只展示预估分、置信度、风险类型/严重度和最多 1 个短片段；不展示修改建议、替换句、完整解释、范文、逻辑图或逐句批注。
- **免费诊断被重复薅取：** 后端必须生成 `confirmed_text_hash`，同一作文免费摘要优先复用缓存，缓存 TTL 默认 7 天。
- **实时解锁诱惑过强：** 首版不实现 WebSocket 网关。支付、补单、组队成功后写数据库，前端用 3s/5s/10s 轮询刷新；后续如加入 Redis Pub/Sub，只能做通知加速，关键事件仍必须写数据库或可重放队列。
- **学生作文数据复用风险：** 首版只做服务交付最小化存储。未经单独同意，不得用于训练、微调、营销案例、公开 SEO 或数据湖汇集。
- **投流归因失真：** 首版支持 UTM first-touch 归因和本地 `conversion_events`；广告 Pixel 只做辅助信号，默认关闭，不影响订单解锁或本地统计。

---

## 🔵 第二部分：静态设计与硬性契约 (The Blueprints)

### 4. 技术栈选型与目录骨架

#### 4.1 核心技术栈

- **前端语言：** TypeScript
- **前端框架：** Next.js App Router + React Client Components
- **前端样式：** 沿用当前 `next-vercel` Tailwind/CSS 体系，不新增大型 UI 框架
- **前端部署：** 正式环境部署到国内 4核8GB VPS；Vercel 仅保留为预览、测试或回滚备用
- **后端语言：** Python 3.11+
- **后端框架：** FastAPI
- **首版后端硬性决策：** 首版核心业务后端使用 Python 3.11+ / FastAPI；Next.js API routes 只允许作为同站 BFF/代理、mock 开发入口或后续 Serverless 适配层，不承载草稿、上传、诊断、支付、退款等核心业务逻辑。
- **数据库：** 托管 PostgreSQL，例如 Supabase PostgreSQL 或国内云 PostgreSQL；正式环境不得部署在同一台 VPS 本机
- **文件存储：** 腾讯云 COS、Supabase Storage 或 S3 兼容对象存储；生产图片必须浏览器预签名直传
- **队列/缓存：** Redis/RQ、Celery、Cloudflare Queues、Upstash QStash 或 Inngest；首版可选一种，但必须通过 adapter 封装
- **AI/OCR：** OCR adapter + 诊断 LLM adapter；首版可使用 OpenAI `gpt-5.5`，正式高并发场景优先支持腾讯云 OCR、百度手写 OCR、Google Vision 等专业 OCR provider
- **支付：** 支付 provider adapter + 多商户号轮询；正式上线必须使用可验签的合规支付渠道
- **首版价格：** 独立抢分包 `￥99.00/20篇`；三人同学组队价 `￥53.00/人/20篇`。当前 `report_id` 付款成功后立即消耗 1 篇额度解锁当前报告，剩余 19 篇可用于后续报告；不是无限次，不是月卡。
- **产品类型：** 首版主动生成 `essay_credit_pack_20` 和 `group_essay_credit_pack_20_member`；旧的 `full_report_single` 和 `group_report_member` 只做兼容旧链接处理。`product_type` 必须按可扩展枚举/字符串处理，不得写死单一 `full_report`。

#### 4.1.1 首版正式部署基线

首版正式部署默认采用：

```text
www.qqbytop.com / qqbytop.com -> 国内已备案域名
单台 4核8GB VPS -> Nginx/Caddy + Next.js + FastAPI + Redis + Celery/RQ worker
腾讯云 COS 或 S3 兼容对象存储 -> 作文图片预签名直传
托管 PostgreSQL -> 用户、草稿、报告、订单、审计数据
外部 AI/OCR API -> 图片识别与作文诊断
```

执行者不得把业务 PostgreSQL、本地图片存储或 AI 模型推理放进这台 VPS。若因成本原因需要临时使用本机数据库，只能作为开发/测试例外，不能进入正式支付环境。

#### 4.2 前端强制目录结构

在 `D:\projects\北京全球博译翻译官网\next-vercel` 内开发：

```text
app/
  tools/
    gaokao-english-essay-diagnosis/
      page.tsx
      review/
        [draftId]/
          page.tsx
      report/
        [reportId]/
          page.tsx
      checkout/
        [reportId]/
          page.tsx
      my-reports/
        page.tsx
      refund-policy/
        page.tsx
  api/
    tools/
      gaokao-english-essay-diagnosis/
        drafts/
          route.ts
          [draftId]/
            confirm/
              route.ts
            recognition/
              route.ts
        uploads/
          intents/
            route.ts
          [uploadIntentId]/
            complete/
              route.ts
        reports/
          route.ts
          [reportId]/
            route.ts
            smart-appeal/
              route.ts
        orders/
          route.ts
          [orderId]/
            refund-request/
              route.ts
            sync/
              route.ts
        support/
          chat/
            route.ts
        payments/
          webhook/
            [merchantCode]/
              route.ts
components/
  gaokao-essay/
    AiServiceNotice.tsx
    EssayInputWorkspace.tsx
    TextEssayInput.tsx
    ImageUploadPanel.tsx
    UploadProgress.tsx
    OcrReviewWorkspace.tsx
    LowConfidenceSpanList.tsx
    ReportWaitingState.tsx
    SmartAppealButton.tsx
    RefundRequestEntry.tsx
    AiSupportWidget.tsx
    FreeReportSummary.tsx
    FullReportContent.tsx
    HighlightedEssay.tsx
    ScoreBreakdown.tsx
    CheckoutPanel.tsx
    MyReportsTable.tsx
    RefundPolicyContent.tsx
lib/
  gaokao-essay/
    api.ts
    constants.ts
    types.ts
    schemas.ts
    client-state.ts
    report-view.ts
    upload-client.ts
    polling.ts
    attribution.ts
    support-client.ts
```

不得把新工具放到 `public/tools/gaokao-english-essay-diagnosis`，不得复制 `diagnose-tools/` 静态应用。

`lib/gaokao-essay/constants.ts` 必须集中定义前后端 API 路径映射：

- `GAOKAO_ESSAY_BFF_BASE = "/api/tools/gaokao-english-essay-diagnosis"`：前端组件调用的同站 BFF 路径。
- `GAOKAO_ESSAY_BACKEND_API_BASE = "/api/v1"` 或环境变量中的独立 FastAPI API Base URL。
- 所有端点常量必须成对表达 BFF 路径与 FastAPI 路径，例如 `BFF_ENDPOINTS.createDraft = "/api/tools/.../drafts"` 对应 `BACKEND_ENDPOINTS.createDraft = "/api/v1/drafts"`。
- 前端 React 组件不得直接散写 `/api/v1/*` 或独立后端域名；统一通过 `lib/gaokao-essay/api.ts` 调用。
- Next.js API routes 只作为 BFF 代理、mock 入口或 Serverless 适配层；核心业务仍只在 FastAPI service/adapter 中。
- BFF 职责仅限代理、同站 Cookie 注入和隐藏跨域细节；`draft_token` 的签发、验签和权限判断全部在 FastAPI 完成。

#### 4.3 后端/服务层强制目录结构

若后端代码放入当前项目，使用：

```text
backend/
  app/
    api_fastapi/
      routes/
        drafts.py
        uploads.py
        reports.py
        orders.py
        support.py
        payments.py
        admin.py
      main.py
    api_serverless/
      handlers/
    services/
      draft_service.py
      upload_service.py
      recognition_service.py
      diagnosis_service.py
      report_service.py
      order_service.py
      smart_appeal_service.py
      refund_service.py
      platform_assist_service.py
    repositories/
      drafts.py
      uploads.py
      reports.py
      orders.py
      merchants.py
      support_actions.py
    payments/
      merchant_router.py
      provider_base.py
      mock_provider.py
    storage/
      storage_adapter.py
      supabase_storage.py
      s3_storage.py
    jobs/
      queue_adapter.py
      tasks.py
    ai/
      ocr_adapter.py
      llm_router.py
      diagnosis_adapter.py
      providers/
        base.py
        deepseek.py
        qwen.py
        doubao.py
        openai.py
      highlight_alignment.py
    schemas/
      draft.py
      upload.py
      report.py
      order.py
      payment.py
      support.py
    settings.py
```

Next.js API routes 若存在，只能转发或调用 mock client；正式核心业务逻辑必须落在 FastAPI service/adapter 分层中。若执行者发现必须把核心业务放进 Next.js API routes，需立即停止并记录为阻塞项。

### 5. 核心外部系统交互 (API/Dependencies)

#### 5.1 必须调用或预留的外部服务

- **Supabase PostgreSQL：** 存储草稿、对象、报告、订单、商户号、审计与支持动作。
- **Supabase Storage / S3 兼容对象存储：** 保存作文图片。
- **OCR Provider：** 可使用 OpenAI `gpt-5.5` 视觉能力；正式高并发场景优先接入腾讯云 OCR、百度手写 OCR、Google Vision 等专业 OCR provider。
- **LLM Provider：** 生成高考英语作文诊断 JSON；必须通过 `LLMRouter` 支持 DeepSeek、Qwen、Doubao、OpenAI 等合规 provider fallback。
- **支付 Provider：** 创建订单、验签 webhook、查询订单、发起退款。
- **队列 Provider：** 诊断、识别、退款、补位、过期清理任务。
- **Turnstile/验证码：** 免费入口刷量时启用。

首版不引入 WebSocket 长连接网关。Redis Pub/Sub 不得作为支付或组队解锁的事实来源；如后续 V2 增加实时通知，必须以数据库状态或可重放队列事件为准，Pub/Sub 只做 UI 加速通知。

首版不建设 Data Lake，不创建训练集导出任务，不将学生作文同步到营销系统。任何模型训练、微调、案例展示、公开 SEO 复用都必须作为单独需求重新评审。

LLM 调度要求：

- `diagnosis_service` 不得直接调用 DeepSeek、Qwen、Doubao 或 OpenAI SDK，必须调用 `ai/llm_router.py`。
- `LLMRouter` 必须处理 429、503、timeout、JSON schema fail，并执行短期熔断、fallback 和延迟重试。
- `LLMRouter` 必须记录 provider、model、token、latency、错误码、重试次数和 fallback 路径。
- 多 API key 只能用于同一主体下的合规凭证轮换、灰度、故障隔离和预算隔离，不得用于规避 provider 限流或风控。

LLM 相关环境变量：

```text
LLM_PROVIDER_ORDER=tencent_tokenhub
TENCENT_TOKENHUB_BASE_URL=https://tokenhub.tencentmaas.com/v1
TENCENT_TOKENHUB_API_KEY=...
TENCENT_TOKENHUB_FREE_MODEL=deepseek-v4-flash
TENCENT_TOKENHUB_PAID_MODEL=deepseek-v4-pro
TENCENT_TOKENHUB_FALLBACK_MODEL=deepseek-v4-flash
LLM_TIMEOUT_SECONDS=45
LLM_MAX_PROVIDER_ATTEMPTS=2
LLM_MAX_TOTAL_ATTEMPTS=4
LLM_CIRCUIT_BREAKER_WINDOW_SECONDS=60
LLM_CIRCUIT_BREAKER_ERROR_RATE=0.5
LLM_DAILY_BUDGET_CENTS=50000
```

若后续补齐 Qwen/Doubao 密钥，可改为 `LLM_PROVIDER_ORDER=tencent_tokenhub,qwen,doubao`。未配置密钥的 provider 不得写入生产 provider order。

生产默认使用腾讯云 TokenHub DeepSeek 双模型路由：

- 免费摘要、低价值重试和高峰削峰使用 `TENCENT_TOKENHUB_FREE_MODEL=deepseek-v4-flash`。
- 付费完整报告使用 `TENCENT_TOKENHUB_PAID_MODEL=deepseek-v4-pro`。
- Pro timeout、503 或 schema 连续失败时，允许降级到 `TENCENT_TOKENHUB_FALLBACK_MODEL=deepseek-v4-flash`，但必须记录 `model_degraded=true`。
- 当前首版报告创建会同时生成免费摘要和完整报告，因此该调用默认按 `paid` tier 路由；若后续拆成“免费摘要先生成、付费后生成完整报告”，免费摘要任务必须显式按 `free` tier 路由。
- 不得使用批量账号、亲友账号或无关主体 API Key 池规避 provider 限流或风控。

#### 5.2 接口硬约束

- 用户侧前端路径固定为 `/tools/gaokao-english-essay-diagnosis`。
- API 路径可以通过 `app/api/tools/gaokao-english-essay-diagnosis/*` 提供同站入口；若代理独立 FastAPI 服务，对外仍应保持同站 API 或严格 CORS。
- 生产 CORS 只能允许 `https://qqbytop.com`、`https://www.qqbytop.com` 和显式配置的开发域名。
- 所有草稿、上传、识别、诊断、订单、智能申诉接口必须校验登录态或短期 `draft_token`。
- 图片上传生产路径必须是预签名直传，不允许 multipart 图片穿透业务服务器。
- 支付 webhook 必须独立限流、幂等、快速返回。
- 支付成功、补单成功、组队完成后的前端解锁必须通过 HTTP 轮询可达；没有 WebSocket 时功能不得降级为不可用。

### 6. 核心数据实体与 Schema

#### 6.1 TypeScript 前端核心类型

```ts
export type EssaySourceType = "text" | "image";
export type ReportStatus = "PENDING" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type OrderStatus = "PENDING" | "PAID" | "REFUNDED" | "EXPIRED" | "FAILED";
export type RefundStatus = "NONE" | "REQUESTED" | "REFUNDED" | "REFUND_FAILED";

export type Draft = {
  id: string;
  sourceType: EssaySourceType;
  rawInputText?: string;
  transcribedText?: string;
  confirmedText?: string;
  wordCount?: number;
  ocrStatus: "NOT_REQUIRED" | "PENDING" | "COMPLETED" | "FAILED";
};

export type UploadIntent = {
  id: string;
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
  method: "PUT";
  requiredHeaders: Record<string, string>;
};

export type HighlightSpan = {
  start?: number;
  end?: number;
  severity: "minor" | "major" | "critical";
  category: "grammar" | "vocabulary" | "logic" | "format" | "content";
  original: string;
  suggestion: string;
  explanation: string;
  positionStatus?: "resolved" | "fuzzy" | "unresolved";
};

export type EssayScore = {
  estimated: number;
  max: number;
  confidence: "low" | "medium" | "high";
  reason: string;
};

export type FreeSummaryRisk = {
  type: string;
  severity: "minor" | "major" | "critical";
  snippet?: string;
  explanation: string;
};

export type FreeSummary = {
  topRisks: FreeSummaryRisk[];
  score: EssayScore;
  previewSnippetCount: 0 | 1;
};

export type GaokaoDimension = {
  score: number | null;
  max: number | null;
  comment: string;
  notApplicable?: boolean;
};

export type LogicMapItem = {
  paragraph: number;
  role: string;
  issue?: string;
  suggestion?: string;
};

export type RewriteVersions = {
  safeVersion: string;
  advancedVersion: string;
};

export type StudyPlanItem = {
  priority: number;
  skill: string;
  exercise: string;
};

export type DiagnosisMeta = {
  ocrArtifacts?: Array<{
    text: string;
    positionHint?: string;
    decision: "likely_ocr_artifact" | "uncertain" | "student_error";
    reason: string;
  }>;
  uncertainOcrSpans?: Array<{
    text: string;
    positionHint?: string;
    reason: string;
  }>;
};

export type FullReport = {
  gaokaoDimensions: Record<string, GaokaoDimension>;
  highlightSpans: HighlightSpan[];
  logicMap: LogicMapItem[];
  rewrites: RewriteVersions;
  studyPlan: StudyPlanItem[];
  disclaimer: string;
  diagnosisMeta?: DiagnosisMeta;
};

export type GaokaoEssayReport = {
  reportId: string;
  status: ReportStatus;
  isUnlocked: boolean;
  score?: EssayScore;
  freeSummary?: FreeSummary;
  fullReport?: FullReport | null;
};

export type CreateDraftRequest =
  | { source_type: "text"; raw_input_text: string; attribution_id?: string }
  | { source_type: "image"; attribution_id?: string };

export type CreateDraftResponse = {
  draft_id: string;
  draft_token: string;
  confirmed: boolean;
  next_step: "create_report" | "create_upload_intent";
};

export type CreateUploadIntentRequest = {
  draft_id: string;
  file_name: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
};

export type CreateUploadIntentResponse = UploadIntent;

export type CompleteUploadRequest = {
  bucket: string;
  object_key: string;
  mime_type: string;
  size_bytes: number;
  sha256?: string;
};

export type CompleteUploadResponse = {
  draft_id: string;
  image_object_id: string;
  recognition_status: "PENDING" | "QUEUED" | "COMPLETED" | "FAILED";
};

export type ConfirmTextRequest = {
  confirmed_text: string;
};

export type ConfirmTextResponse = {
  draft_id: string;
  confirmed: boolean;
};

export type CreateReportRequest = {
  draft_id: string;
};

export type CreateReportResponse = {
  report_id: string;
  status: ReportStatus;
  queue_status?: "QUEUED" | "RUNNING";
  estimated_wait_seconds?: number;
};

export type GetReportResponse = GaokaoEssayReport;

export type CreateOrderRequest = {
  report_id: string;
  product_type: "essay_credit_pack_20" | "group_essay_credit_pack_20_member" | "full_report_single" | "group_report_member";
  group_id?: string;
  attribution_id?: string;
};

export type CreateOrderResponse = {
  order_id: string;
  merchant_code: string;
  payment_url: string;
};

export type SmartAppealRequest = {
  reason?: "report_not_generated";
};

export type SmartAppealResponse = {
  status_synced: boolean;
  retry_triggered: boolean;
  refund_triggered: boolean;
  current_order_status: OrderStatus;
  current_report_status: ReportStatus;
  message: string;
};

export type RefundRequestRequest = {
  reason?: "report_not_generated" | "duplicate_payment" | "other";
};

export type RefundRequestResponse = {
  status_synced: boolean;
  retry_triggered: boolean;
  refund_triggered: boolean;
  refund_status: "NONE" | "REQUESTED" | "REFUNDED" | "REFUND_FAILED";
  message: string;
};

export type SupportChatRequest = {
  message: string;
  report_id?: string;
  order_id?: string;
};

export type SupportChatResponse = {
  answer: string;
  suggested_actions: Array<
    | "show_upload_help"
    | "get_report_status"
    | "get_order_status"
    | "trigger_smart_appeal"
    | "show_refund_policy"
  >;
};

export type MarketingAttribution = {
  id: string;
  session_id: string;
  user_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  first_landing_path: string;
  created_at: string;
};

export type ConversionEvent = {
  id: string;
  order_id: string;
  attribution_id?: string | null;
  event_name: "Purchase" | "Refund";
  amount_cents: number;
  currency: "CNY";
  delivery_status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
};
```

#### 6.2 数据库核心实体

必须落地或等价实现以下实体：

- `users`
- `marketing_attributions`
- `upload_intents`
- `storage_objects`
- `essay_drafts`
- `diagnosis_reports`
- `merchant_accounts`
- `orders`
- `group_buys`
- `group_members`
- `audit_logs`
- `support_actions`
- `payment_events`
- `conversion_events`

关键字段必须包含：

- `essay_drafts.attribution_id`
- `essay_drafts.confirmed_text_hash`
- `essay_drafts.word_count`
- `essay_drafts.language`
- `essay_drafts.ip_address`
- `essay_drafts.user_agent`
- `essay_drafts.ocr_result`
- `diagnosis_reports.max_score`
- `diagnosis_reports.model_version`
- `diagnosis_reports.prompt_version`
- `diagnosis_reports.input_token_count`
- `diagnosis_reports.output_token_count`
- `diagnosis_reports.latency_ms`
- `orders.expires_at`
- `orders.attribution_id`
- `group_buys.group_price_cents`
- `group_buys.required_members`
- `group_buys.allow_platform_assist`
- `group_members.report_id`
- `group_members.order_id`
- `group_members.payment_status`
- `orders.refund_amount_cents`
- `conversion_events.order_id`
- `conversion_events.attribution_id`
- `conversion_events.delivery_status`
- `merchant_accounts.merchant_code check (merchant_code ~ '^[a-z0-9_]+$')`

#### 6.3 AI 诊断输出契约

LLM 输出必须符合高考作文诊断 JSON：

```json
{
  "exam_type": "gaokao_english_composition",
  "score": {
    "estimated": 17,
    "max": 25,
    "confidence": "medium",
    "reason": ""
  },
  "summary": {
    "strengths": [],
    "top_risks": [],
    "next_action": ""
  },
  "gaokao_dimensions": {
    "content_relevance": { "score": 4, "max": 5, "comment": "" },
    "structure_logic": { "score": 4, "max": 5, "comment": "" },
    "grammar_accuracy": { "score": 3, "max": 5, "comment": "" },
    "vocabulary_expression": { "score": 3, "max": 5, "comment": "" },
    "handwriting_or_format": { "score": 3, "max": 5, "comment": "" }
  },
  "highlight_spans": [],
  "logic_map": [],
  "rewrites": {
    "safe_version": "",
    "advanced_version": ""
  },
  "study_plan": [],
  "disclaimer": "本报告为 AI 辅助诊断，仅供学习训练参考，不代表正式考试成绩。"
}
```

服务端必须执行：

- Schema 校验。
- `highlight_spans` 后处理。
- `full_report` 未解锁时强制返回 `null`。
- `source_type = text` 时不得评价手写质量，只能评价格式规范；无法评价的子项标记 `N/A`。
- `gaokao_dimensions` 各维度得分仅用于解释和定位问题，总分 `score.estimated` 由 AI 独立评估，不由各维度分数简单相加得出。

### 7. 核心业务状态机 (State Machine)

#### 7.1 Draft 状态

- `TEXT_CREATED`
- `IMAGE_DRAFT_CREATED`
- `UPLOAD_PENDING`
- `UPLOAD_COMPLETED`
- `OCR_PENDING`
- `OCR_COMPLETED`
- `TEXT_CONFIRMED`

规则：

- 文本输入：`TEXT_CREATED -> TEXT_CONFIRMED`，不进入校对页；随后由 `TEXT_CONFIRMED` 触发 Report 创建，这是跨实体因果关系，不是 Draft 自身状态。
- 图片输入：`IMAGE_DRAFT_CREATED -> UPLOAD_PENDING -> UPLOAD_COMPLETED -> OCR_PENDING -> OCR_COMPLETED -> TEXT_CONFIRMED`；随后由 `TEXT_CONFIRMED` 触发 Report 创建。
- `TEXT_CONFIRMED` 是 Draft 的终态。Draft 表不得写入 `REPORT_QUEUED` 作为状态；`REPORT_QUEUED` 属于 Report 状态机。

#### 7.2 Report 状态

- `PENDING`
- `QUEUED`
- `RUNNING`
- `COMPLETED`
- `FAILED`

规则：

- `COMPLETED` 不允许回到 `RUNNING`。
- `FAILED` 可通过 `retry_failed_report` 回到 `QUEUED`，但 `retry_count < REPORT_MAX_RETRY_COUNT`。
- 未解锁报告查询必须返回 `full_report: null`。

#### 7.3 Order 状态

- `PENDING`
- `PAID`
- `REFUNDED`
- `EXPIRED`
- `FAILED`

规则：

- `PENDING -> PAID` 只允许支付 webhook 或订单同步确认。
- `PENDING -> EXPIRED` 由 `expire_unpaid_orders` 执行。
- `PAID -> REFUNDED` 由退款 provider 成功回执确认。
- `REFUNDED` 不可再次解锁报告。
- 订单必须绑定创建时选中的 `merchant_account_id`，后续查询、退款和验签不得重新轮询商户号。

#### 7.4 Refund 状态

- `NONE`
- `REQUESTED`
- `REFUNDED`
- `REFUND_FAILED`

规则：

- 触发退款前先写 `REQUESTED`。
- 退款成功写 `REFUNDED` 和 `refunded_at`。
- 退款失败写 `REFUND_FAILED`，用户端显示“退款处理中”，后台异常列表可见。

---

## 🟠 第三部分：执行控制平台 (The Execution Engine)

### 8. 全局推荐开发顺序 (Global Execution Order)

首版默认队列隔离：

```text
critical: payment_webhook_followup, order_sync, auto_refund, refund_status_sync
default: paid_diagnosis, recognize_image, unlock_report
low: free_diagnosis
```

`critical` 必须由独立 worker 进程消费；`low` 可在预算、队列或 provider 拥塞时暂停。

1. 文档锁定与路径确认。
2. 前端文本版高考作文诊断 MVP。
3. 后端/服务层草稿、报告和 mock 诊断闭环。
4. 报告页、免费层、完整层和服务端隐藏完整报告。
5. 预签名图片直传、OCR adapter 和校对页。
6. UTM 归因采集、订单归因绑定和本地转化事件。
7. 支付订单、多商户号、Webhook、解锁。
8. 智能申诉、重试、自动退款。
9. 三人同学组队价、20 篇额度发放与官方助力兜底。
10. 历史报告、管理后台、工具矩阵入口。
11. 全流程测试、构建、上线检查。

### 9. 切分出来的多个里程碑 (Milestones)

> **致 AI 的执行规范：** 请严格按顺序解锁 Milestone。在未完成上一阶段验收前，严禁开始下一个阶段。每次对代码进行重大推进，请自行更新“当前进度”。如遇第三方资质、云存储、支付密钥、Schema 冲突或架构死角，停止继续编码并记录阻塞项。

---

### 🏁 Milestone 1: 文档锁定、目录骨架与工具入口预备

🎯 **局部任务目标：**  
在 `next-vercel` 中建立高考作文工具的目录骨架和类型基础，不接第三方服务，不实现真实 AI。

🚧 **前置依赖：**  
无。

👣 **局部微观执行步骤：**

1. 确认当前工作目录是 `D:\projects\北京全球博译翻译官网\next-vercel`。
2. 新增 `app/tools/gaokao-english-essay-diagnosis/` 路由目录。
3. 新增 `components/gaokao-essay/`。
4. 新增 `lib/gaokao-essay/`。
5. 在 `lib/gaokao-essay/types.ts`、`constants.ts`、`schemas.ts` 中定义前端类型、状态和常量。
6. 在 `lib/gaokao-essay/types.ts` 中定义所有 API 请求/响应契约类型，至少包括 `CreateDraftRequest/Response`、`CreateUploadIntentRequest/Response`、`CompleteUploadRequest/Response`、`CreateReportRequest/Response`、`GetReportResponse`、`CreateOrderRequest/Response`、`SmartAppealRequest/Response`、`RefundRequestRequest/Response`、`SupportChatRequest/Response`、`MarketingAttribution`、`ConversionEvent`。
7. 在 `lib/gaokao-essay/constants.ts` 中定义 BFF 路径与 FastAPI `/api/v1/*` 路径映射，不允许组件散写 API 字符串。
8. 在 `lib/gaokao-essay/constants.ts` 中定义价格、免费额度、组队人数、组队过期时间和免费缓存 TTL 常量，默认值来自 PRD §4.5.1。
9. 在 `lib/gaokao-essay/attribution.ts` 中预留 UTM/referrer/landing_path 捕获、first-party cookie/localStorage 持久化和 `attribution_id` 读取接口；不得在此处加载第三方 Pixel。
10. 在 mock service 中只使用这些契约类型，不允许单独定义一套 mock-only 类型。
11. 暂不修改 `lib/site-data.ts`，等工具页面至少可访问后再加入矩阵。

📊 **当前进度 (Current Progress)：** ✅ 本地可验收已完成  
(AI 修改区：已建立 `lib/gaokao-essay/`、`components/gaokao-essay/`、工具路由、BFF 路由骨架、FastAPI 后端骨架、部署脚本和 `.env.example`；工具已加入主站诊断工具列表。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：无本地开发阻塞；生产上线仍需填写真实环境变量。)

📋 **局部阶段验收清单：**

- [ ] `npm run typecheck` 通过。
- [ ] 新增目录不影响现有页面。
- [ ] API 请求/响应契约类型已定义，mock 和未来真实 API client 共享同一套类型。
- [ ] `constants.ts` 已定义 BFF 与 FastAPI 端点映射，前端组件只调用 `lib/gaokao-essay/api.ts`。
- [ ] `constants.ts` 已定义首版价格、组队人数、免费额度和免费缓存 TTL 默认值。
- [ ] `attribution.ts` 已定义 UTM 捕获接口，但未硬编码任何第三方 Pixel。
- [ ] 没有改动雅思、留学文书、商务形象工具逻辑。

---

### 🏁 Milestone 2: 文本版输入页与 mock 诊断闭环

🎯 **局部任务目标：**  
先做文本版高考英语作文诊断，用户粘贴作文后直接进入报告等待页并展示 mock/free report，不进入校对页。

🚧 **前置依赖：**  
Milestone 1 完成。

👣 **局部微观执行步骤：**

1. 实现 `/tools/gaokao-english-essay-diagnosis`。
2. 实现 `EssayInputWorkspace`、`TextEssayInput`、`AiServiceNotice`。
3. 文本输入词数规则：0-40 词提示过短，41-350 词可提交，超过 350 词禁止提交。
4. 提交文本后调用内部 mock service 创建 draft/report。
5. 页面首次加载时调用 `attribution.ts` 捕获 UTM/referrer/landing_path，并在创建 draft 的 mock 请求中携带 `attribution_id` 或 mock attribution payload。
6. 跳转 `/tools/gaokao-english-essay-diagnosis/report/[reportId]`。
7. 报告页先用本地 mock 数据显示等待状态、免费摘要和解锁入口。
8. mock service 必须定义 `QUEUED`、`RUNNING`、`COMPLETED`、`FAILED`、空高亮、`positionStatus = "unresolved"`、未解锁 `full_report: null` 等边界状态的数据结构；M2 只要求基础等待、摘要和解锁入口可用，荧光笔边界渲染在 M3 完成。

📊 **当前进度 (Current Progress)：** ✅ 本地可验收已完成  
(AI 修改区：文本输入页、示例作文、词数校验、免费摘要、mock 延迟策略、等待态和解锁入口已完成；浏览器已验证页面可访问。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：无本地开发阻塞。)

📋 **局部阶段验收清单：**

- [ ] 首屏可直接粘贴高考英语作文。
- [ ] 文本输入不会进入图片校对页。
- [ ] 375px 移动端无横向滚动。
- [ ] 所有关键区域显示 AI 自动服务提示。
- [ ] 带 UTM 参数进入页面时，本地可生成并保留归因信息；未带 UTM 时不阻断诊断流程。
- [ ] mock 数据结构覆盖排队、失败、空高亮、unresolved 高亮和未解锁状态。
- [ ] `npm run typecheck` 通过。

---

### 🏁 Milestone 3: 报告展示、荧光笔组件与服务端权限契约

🎯 **局部任务目标：**  
完成免费报告层、完整报告层 UI、荧光笔展示和未解锁时 `full_report: null` 的前后端契约。

🚧 **前置依赖：**  
Milestone 2 完成。

👣 **局部微观执行步骤：**

1. 实现 `ReportWaitingState`、`FreeReportSummary`、`FullReportContent`、`HighlightedEssay`、`ScoreBreakdown`。
2. 报告等待轮询策略：0-30 秒每 3 秒，30-60 秒每 5 秒，60 秒后每 10 秒。
3. 等待超过 60 秒显示 `智能申诉与重试`。
4. 未解锁响应中 `full_report` 必须为 `null`，前端不得缓存完整报告。
5. 免费层只展示预估分、置信度、3 个风险类型/严重度和最多 1 个短片段；不得展示修改建议、替换句、完整解释、范文、逻辑图或逐句批注。
6. 支持空高亮、少量高亮、大量高亮。
7. `positionStatus = "unresolved"` 显示“此问题位置未精确定位”。

📊 **当前进度 (Current Progress)：** ✅ 本地可验收已完成  
(AI 修改区：报告页、免费层边界、未解锁 `full_report: null` 契约、荧光笔、unresolved 降级、完整报告解锁态、智能申诉入口和 AI 自助助手已完成；已修复报告页乱码和解锁后仍显示付费卡的问题。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：无本地开发阻塞。)

📋 **局部阶段验收清单：**

- [ ] 未解锁时页面不持有完整报告内容。
- [ ] 高亮错位时不会渲染错误位置。
- [ ] 空高亮和 unresolved 高亮 mock 数据已完成 UI 渲染验收。
- [ ] 等待超过 60 秒出现智能申诉入口。
- [ ] 移动端点击高亮可展开解释，不依赖 hover。
- [ ] 免费层不泄漏付费层修改建议、范文、逻辑图或逐句批注。

---

### 🏁 Milestone 4: 草稿、报告 API 与 LLM 诊断 service

🎯 **局部任务目标：**  
实现真实草稿、报告创建、诊断入队/执行、Schema 校验和高亮后处理。

🚧 **前置依赖：**  
Milestone 3 完成；数据库连接与环境变量可用。

👣 **局部微观执行步骤：**

1. 实现草稿 API：`POST /api/tools/gaokao-english-essay-diagnosis/drafts`。
2. 文本输入创建 draft 时同时写入 `confirmed_text`。
3. 草稿 API 必须签发真实 `draft_token`，并对后续草稿、上传、报告创建接口做基础校验。
4. M4 只要求完成 `draft_token` 的签发、过期和 draft 绑定校验；IP/UA 弱校验和登录找回在 M6 增强。
5. 实现报告创建 API 和报告查询 API。
6. 实现 `confirmed_text_hash = sha256(normalize(confirmed_text))`，用于免费摘要缓存和重复提交去重。
7. 实现 `LLMRouter` 和 diagnosis adapter，先支持 mock provider，再接真实 LLM。
8. `LLMRouter` 必须支持 provider 顺序、timeout、429/503 熔断、JSON schema fail fallback、每日预算熔断。
9. LLM 输出必须经过 schema 校验。
10. 实现 `highlight_alignment`：精确匹配、模糊匹配、unresolved 降级。
11. 记录 `provider`、`model_version`、`prompt_version`、token、latency、错误码和 fallback 路径。

📊 **当前进度 (Current Progress)：** ✅ 本地/mock 可验收已完成  
(AI 修改区：FastAPI 草稿、报告、订单、申诉、后台 API 骨架已完成；本地 repository、draft token、confirmed_text_hash、LLMRouter mock 输出、Schema 类型和测试已完成。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：生产环境需接入托管 PostgreSQL/Redis，并把 mock repository/provider 替换为真实 adapter；当前生产配置已设置 fail-fast，避免误用 mock 上线。)

📋 **局部阶段验收清单：**

- [ ] 纯文本输入能生成真实报告记录。
- [ ] 草稿 API 签发真实 `draft_token`。
- [ ] report 创建接口拒绝过期或错配的 `draft_token`。
- [ ] LLM JSON 校验失败不会导致 500 泄漏。
- [ ] LLMRouter fallback、429/503 熔断、timeout 和预算熔断有单元测试。
- [ ] 不存在绕过 `LLMRouter` 直接调用单一 provider 的业务代码。
- [ ] 未解锁报告 API 返回 `full_report: null`。
- [ ] 同一 `confirmed_text_hash` 的免费摘要可复用缓存，不重复消耗 LLM。
- [ ] 高亮偏移后处理有单元测试。

---

### 🏁 Milestone 5: 图片直传、OCR adapter 与校对页

🎯 **局部任务目标：**  
完成图片作文输入：空 draft、upload intent、预签名直传、complete 确认、OCR 识别、校对页。

🚧 **前置依赖：**  
Milestone 4 完成；云存储配置可用。

👣 **局部微观执行步骤：**

1. 实现 `POST /uploads/intents`。
2. 实现浏览器 `PUT` 直传云存储。
3. 实现 `POST /uploads/{uploadIntentId}/complete`。
4. 后端通过 HEAD/Object metadata 校验对象存在、大小和 mime type。
5. 实现 `OcrReviewWorkspace` 和低置信片段展示。
6. OCR adapter 首版可支持 `gpt-5.5`，但接口必须可切换 provider；正式高并发场景优先支持 `tencent_ocr`、`baidu_handwriting`、`google_vision` 等专业 OCR。
7. 移动端支持直接拍照；HEIC 转 JPEG 由前端负责，优先使用浏览器可行方案或轻量转换库，失败时提示用户改用 JPG/PNG，不把 HEIC 转码责任下放给后端。
8. OCR 完全失败时提示重新拍照或改为手动输入。
9. OCR 输出必须标准化为 `ocr_result`，包含 `transcribed_text`、`line_items`、`uncertain_spans`、`quality_warnings` 和可选 `likely_ocr_artifacts`。
10. 不得将疑似 OCR 伪影静默修复后直接进入诊断评分；必须先进入校对页，由用户确认 `confirmed_text`。

📊 **当前进度 (Current Progress)：** ✅ 本地/mock 可验收已完成  
(AI 修改区：图片输入、upload intent、presigned PUT 契约、complete、recognition 查询、OCR 校对页、HEIC 责任说明和图片 BFF 冒烟脚本已完成。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：生产环境需配置真实 COS/OSS bucket、临时签名密钥和真实 OCR provider。)

📋 **局部阶段验收清单：**

- [ ] 生产流程不经过 Vercel/VPS 中转图片。
- [ ] 后端不接受任意公网图片 URL。
- [ ] 上传意图过期后不能 complete。
- [ ] HEIC 前端转码或失败提示可用，后端不承担 HEIC 转码。
- [ ] HEIC/超大图片有友好提示。
- [ ] 图片识别完成后必须进入校对页。
- [ ] `ocr_result` 完整保存，刷新校对页后不丢失 `uncertain_spans`、`quality_warnings` 和 `line_items`。
- [ ] 疑似 OCR 伪影不会被静默修复并直接计入诊断评分。

---

### 🏁 Milestone 6: 身份、历史报告与访问控制

🎯 **局部任务目标：**  
实现匿名试用、支付前绑定联系方式、历史报告找回和 draft token 校验。

🚧 **前置依赖：**  
Milestone 5 完成。

👣 **局部微观执行步骤：**

1. 在 M4 已完成的 `draft_token` 基础上增强匿名 session、user-agent 和弱 IP 指纹校验。
2. IP 变化时只做风险降级，不直接拒绝合法用户。
3. 支付前要求绑定手机号或邮箱。
4. 绑定身份后，基于 `session_id` / `draft_token` 归属回填该用户拥有的匿名 draft、upload intent、storage object、report 的 `user_id`。
5. 未绑定手机号/邮箱的用户创建订单时必须被拦截，并引导绑定。
6. 实现 `/tools/gaokao-english-essay-diagnosis/my-reports`。
7. 历史报告只展示当前登录用户拥有的报告。
8. 匿名报告页提示“登录后可随时查看历史报告”。

📊 **当前进度 (Current Progress)：** ✅ 本地可验收已完成  
(AI 修改区：支付前联系方式绑定、本机历史报告、管理员登录保护、匿名报告找回提示和本地身份最小闭环已完成。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：生产环境若需要跨设备历史报告，需要接入真实用户表、短信/邮箱验证或微信登录。)

📋 **局部阶段验收清单：**

- [ ] draft token 过期后敏感操作失败。
- [ ] IP 变化不会直接拒绝合法用户。
- [ ] 未绑定手机号/邮箱的用户尝试创建订单时被拦截，并引导绑定。
- [ ] 绑定身份后，匿名 draft/upload/report 的 `user_id` 可正确回填。
- [ ] 未登录用户不能查看他人报告。
- [ ] 登录用户能查看自己的历史报告。

---

### 🏁 Milestone 7: 支付、多商户号与解锁

🎯 **局部任务目标：**  
完成订单创建、多商户号选择、Webhook 验签、报告解锁。

🚧 **前置依赖：**  
Milestone 6 完成；支付 provider 或 mock provider 可用。

👣 **局部微观执行步骤：**

1. 实现 `merchant_accounts` 配置和 `merchant_router`。
2. `merchant_code` 只允许 `[a-z0-9_]`。
3. 创建订单时绑定 `merchant_account_id`。
4. Webhook 使用订单绑定商户号验签。
5. Webhook 只执行原始 body 验签、幂等写入 `payment_events`、最小订单状态事务、入 `critical` 队列并快速返回。
6. 支付成功后原子累加 `daily_used_cents`。
7. 支付成功后由 worker 解锁报告。
8. 创建订单时绑定 `attribution_id`；没有归因信息时允许为空。
9. 支付成功后由 `critical` worker 幂等创建 `conversion_events`，默认只写本地表，不向第三方平台回传。
10. 第三方 Pixel/server-side conversion 仅在显式环境变量开启时加载或发送，失败不得影响解锁。
11. 实现 `expire_unpaid_orders`。
12. 实现 `reset_merchant_daily_usage`。
13. 确保支付成功后报告页/支付页通过轮询刷新解锁，不依赖 WebSocket。
14. 上线前确认网站备案主体、页面展示主体、收款主体、退款责任主体和发票/收据说明一致或具备清晰授权链路。

📊 **当前进度 (Current Progress)：** ✅ 本地/mock 可验收已完成  
(AI 修改区：价格环境变量、`product_type` 扩展、单人价 99 元、同学组队价 53 元/人、多商户号轮询、订单绑定、支付前联系方式校验、mock 支付解锁和 BFF 冒烟已完成。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：生产环境需接入微信/支付宝真实商户号、Webhook 验签、退款 API 和主体授权链路。)

📋 **局部阶段验收清单：**

- [ ] 重复 webhook 不重复解锁。
- [ ] 重复/乱序 webhook 只写入一次有效 `payment_events` 幂等记录。
- [ ] Webhook 不调用 OCR/LLM/短信/发票/复杂解锁。
- [ ] 未解锁接口仍返回 `full_report: null`。
- [ ] 商户号额度原子累加测试通过。
- [ ] 过期未支付订单进入 `EXPIRED`。
- [ ] Webhook 不受普通诊断限流影响。
- [ ] 关闭 WebSocket/实时通知后，轮询仍能完成支付解锁。
- [ ] 未发现跨主体混收、养号、自交易或规避支付平台风控的配置/代码。
- [ ] 支付成功后幂等写入 `conversion_events`，重复 webhook 不重复创建有效转化事件。
- [ ] 前端 Pixel 默认关闭；关闭时不影响订单解锁和本地转化统计。
- [ ] 转化回传 payload 不包含作文、图片、报告、手机号/邮箱明文或未成年人身份信息。

---

### 🏁 Milestone 8: 智能申诉、自动重试与退款

🎯 **局部任务目标：**  
完成 `智能申诉与重试`、清晰自助退款入口和 AI 自助助手的无人值守售后闭环。

🚧 **前置依赖：**  
Milestone 7 完成；退款 provider 或 mock refund 可用。

👣 **局部微观执行步骤：**

1. 实现 `POST /reports/[reportId]/smart-appeal`。
2. 点击后先同步订单和报告状态。
3. 已完成报告返回“报告已生成”，不触发退款。
4. 任务未启动则重新入队。
5. 失败且未超过重试次数则重试。
6. 支付超过 300 秒仍无完整报告则触发退款。
7. 退款成功写 `REFUNDED`。
8. 退款失败写 `REFUND_FAILED`，用户端显示“退款处理中”。
9. 全部动作写入 `support_actions`。
10. 智能申诉结果必须能通过普通 HTTP 响应和后续轮询继续推进，不需要长连接。
11. 实现 `POST /orders/[orderId]/refund-request`，作为 `订单异常 / 申请退款` 入口的后端承接接口。
12. `refund-request` 必须先复用状态同步和 `smart_appeal_report` 规则，不得无条件秒退。
13. 已完整生成并解锁的报告点击退款入口时，返回退款规则说明并写入 `REFUND_REJECTED_BY_RULE` 或等价 `support_actions`，不自动退款。
14. 报告等待页、报告页底部、支付页和退款规则页提供清晰的 `订单异常 / 申请退款` 入口。
15. 实现 `AI 自助助手` 入口和 `POST /support/chat`，仅回答上传、OCR、报告等待、退款规则、历史报告和隐私删除等流程问题。
16. AI 助手只能调用 `get_order_status`、`get_report_status`、`trigger_smart_appeal`、`get_refund_status`、`show_upload_help`、`show_refund_policy` 等受控工具。
17. AI 助手不得直接退款、解锁、补位、修改订单或修改报告；不得向 LLM provider 发送作文原文、图片、手机号/邮箱明文、支付流水号等非必要敏感信息。

📊 **当前进度 (Current Progress)：** ✅ 本地/mock 可验收已完成  
(AI 修改区：智能申诉、重试计数、退款状态字段、support_actions、报告页和退款规则页入口、自助退款/重试 API 结构已完成。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：生产环境需接入真实支付查询与退款 provider，确保 `REFUND_FAILED` 进入后台异常列表。)

📋 **局部阶段验收清单：**

- [ ] 智能申诉幂等。
- [ ] 正常报告不触发退款。
- [ ] 未启动任务会入队。
- [ ] 超时未交付会触发退款。
- [ ] 自助退款入口清晰可见，但已生成并解锁报告不自动秒退。
- [ ] 自助退款重复点击不会重复退款。
- [ ] AI 自助助手不直接退款、不直接解锁、不直接修改订单。
- [ ] AI 自助助手请求 LLM 时不包含作文原文、图片、手机号/邮箱明文或支付流水号。
- [ ] 退款失败后台可见，用户端不暴露内部错误。
- [ ] 无 WebSocket 环境下仍能完成重试/退款状态刷新。

---

### 🏁 Milestone 9: 三人同学组队价、20 篇额度、官方助力与工具矩阵入口

🎯 **局部任务目标：**  
实现三人同学组队价、20 篇额度账户、官方助力兜底、后台异常面板，并将工具加入主站“诊断工具”列表。

🚧 **前置依赖：**  
Milestone 8 完成。

👣 **局部微观执行步骤：**

1. 实现 `group_buys`、`group_members` 和额度账户相关 service。
2. 独立抢分包价格为 `￥99.00/20篇`，三人同学组队价为 `￥53.00/人/20篇`。
3. 付款成功后按联系人或绑定用户发放 20 篇额度，当前 `report_id` 立即消耗 1 篇额度解锁，剩余 19 篇可用于后续报告；不是无限次，不是月卡。
4. 三人同学组队价是组队购买：每个真实成员必须有自己的 `report_id` 和 `order_id`，并为自己的报告付款；组队不共享作文、报告、订单或个人信息。
5. 好友只打开链接、注册或提交免费作文不算真实成员；必须创建自己的报告并完成组队价支付。
6. 官方助力必须使用 `PLATFORM_ASSIST`，只作为内部兜底和审计数据，不展示为真实用户或“已有同学加入”。
7. 官方助力不得生成头像、昵称、班级、同学动态或“刚有路人加入”等虚假内容。
8. 支付页不使用虚假锚定价、虚构稀缺或恐吓式助力文案。
9. 检查现有 `/admin` 是否已有鉴权守卫；若没有，先实现 `/admin/login` + middleware：用户输入环境变量 `ADMIN_PASSWORD`，服务端签发 `admin_session_token` cookie，有效期 24 小时，仅限 HTTPS，后台路由统一校验。
10. 实现 `/admin/gaokao-essay`。
11. 后台优先显示 `REFUND_FAILED`、支付成功未解锁、上传未完成、商户号异常、组队到期未成。
12. 实现 `ConversionFunnelTab` 或等价漏斗视图，统计访问、草稿、报告完成、解锁点击、订单、支付、退款、总收入和净收入。
13. 漏斗视图至少支持按 `utm_source`、`utm_campaign`、`utm_content`、`product_type`、`source_type` 和时间范围过滤。
14. 修改 `lib/site-data.ts`，将工具加入 `diagnosticTools`。

📊 **当前进度 (Current Progress)：** ✅ 本地/mock 可验收已完成  
(AI 修改区：三人同学组队价、20 篇额度账户、真实成员必须各自付款、官方助力 `PLATFORM_ASSIST` 后台兜底、组队 BFF 冒烟、后台 mock 看板和 `lib/site-data.ts` 工具矩阵入口已完成。)

🛑 **阻塞项说明 (Blockers)：**  
(AI 修改区：生产环境需把组队、官方助力、后台漏斗指标写入真实 PostgreSQL，并用真实订单状态驱动。)

📋 **局部阶段验收清单：**

- [ ] 前端不展示虚假真实用户参团信息。
- [ ] 前端不展示虚假锚定价、虚构稀缺、虚构同学动态或“满分绝密/提分秘籍/致命丢分点”等文案。
- [ ] 三人同学组队价中每个真实成员都有自己的报告和订单，并各自获得 20 篇额度。
- [ ] 好友未付款不计入真实成员。
- [ ] 官方助力名额在后台标记为 `PLATFORM_ASSIST`，前端不伪装真实用户、不展示虚拟头像或昵称。
- [ ] 官方助力写入审计日志。
- [ ] `/admin/gaokao-essay` 未鉴权不可访问。
- [ ] 后台异常列表可定位退款失败和支付未解锁。
- [ ] 后台漏斗可按 UTM、`product_type`、`source_type` 和时间范围查看转化指标。
- [ ] 主站“诊断工具”列表出现高考英语作文诊断工具。

---

## 🔴 第四部分：总验收与收尾把控 (The Final QC)

### 10. 最终集成验收清单 (Global Acceptance Checklist)

在所有 Milestone 标记均为“✅ 已完成”后，执行全流程校验。

#### 10.1 构建与类型

- [ ] `npm run typecheck` 通过。
- [ ] `npm run build` 通过。
- [ ] 首版核心业务后端使用 Python 3.11+ / FastAPI，未把核心业务逻辑堆进 Next.js route handler。
- [ ] 新工具未破坏现有首页、服务页、诊断工具列表、雅思工具、留学文书工具、商务形象工具。

#### 10.2 前端体验

- [ ] `/tools/gaokao-english-essay-diagnosis` 可访问。
- [ ] 375px 移动端无横向滚动。
- [ ] 文本输入不会进入图片校对页。
- [ ] 图片输入必须进入校对页。
- [ ] 所有关键页面显示 AI 自动服务提示。
- [ ] 报告等待超过 60 秒显示 `智能申诉与重试`。
- [ ] 报告等待页、报告页底部、支付页和退款规则页存在清晰的 `订单异常 / 申请退款` 入口。
- [ ] AI 自助助手不遮挡上传、支付、报告和退款入口，并说明订单处理以系统状态为准。
- [ ] 未解锁时前端不持有完整报告内容。
- [ ] HEIC、超大图片、上传凭证过期都有友好提示。

#### 10.3 安全与权限

- [ ] 生产 CORS 不包含 `*`。
- [ ] 前端 bundle 不包含 OpenAI、OCR、支付、Supabase service role 密钥。
- [ ] 未解锁报告 API 强制返回 `full_report: null`。
- [ ] draft token 过期或错配时敏感操作失败。
- [ ] 用户不能查看他人报告。
- [ ] 图片不能通过任意公网 URL 触发 OCR。
- [ ] `/admin/gaokao-essay` 未鉴权不可访问。

#### 10.4 支付与退款

- [ ] 创建订单时绑定商户号。
- [ ] 创建订单可绑定 `attribution_id`，自然流量为空时不报错。
- [ ] Webhook 使用订单绑定商户号验签。
- [ ] 重复 webhook 不重复解锁。
- [ ] Webhook 只做验签、幂等、最小事务、入 `critical` 队列和快速返回。
- [ ] `payment_events.idempotency_key` 能抵抗重复/乱序回调。
- [ ] 未支付订单自动过期。
- [ ] `daily_used_cents` 支付成功后原子累加。
- [ ] 支付成功后创建 `conversion_events`，但前端 Pixel 不是权益发放依据。
- [ ] 智能申诉先重试后退款。
- [ ] 自助退款入口先检查状态，已完整生成并解锁的报告不自动秒退。
- [ ] 退款失败进入 `REFUND_FAILED`，后台可见。
- [ ] 商户主体、备案主体、收款主体、退款责任主体一致或具备清晰授权链路。

#### 10.5 队列与降级

- [ ] 诊断接口只入队，不同步等待大模型。
- [ ] 队列硬阈值返回 429 或排队提示。
- [ ] Webhook、订单同步、退款不被普通诊断队列挤占。
- [ ] OCR 失败可重新拍照或改为手动输入。
- [ ] 支付、补单、组队完成后的解锁不依赖 WebSocket；禁用实时通知后仍可通过轮询完成。
- [ ] LLM provider 429、503、timeout 会触发熔断或 fallback。
- [ ] LLM JSON schema 失败不会直接暴露 500，且最多按策略 repair/重试/fallback。
- [ ] LLM 每日预算熔断会暂停免费任务并保留付费任务优先级。
- [ ] 未发现通过 API Key 池规避 provider 限流或风控的实现。

#### 10.6 合规与文案

- [ ] 不出现“保分、提分、阅卷组内部、名师亲批、官方高考评分”等表达。
- [ ] 不出现“满分绝密、提分秘籍、致命丢分点、不拉人就亏”等夸大、恐吓或强操纵表达。
- [ ] UTM/Pixel/转化回传不包含作文、图片、诊断报告、手机号/邮箱明文或可直接识别学生身份的信息。
- [ ] 广告 Pixel 和 server-side conversion 默认关闭，只有环境变量明确开启时才加载或发送。
- [ ] 不出现“拒绝售后、不接受退款、最终解释权归平台所有”等表达。
- [ ] 不出现“无条件秒退”“100% 消除投诉”等无法保证或误导性售后表达。
- [ ] 不展示虚构真实用户、虚构头像、虚构同学动态、虚假锚定价或伪稀缺倒计时。
- [ ] 退款规则页可访问。
- [ ] AI 自助助手不得承诺提分、保分、最终成绩预测或人工批改。
- [ ] AI 自助助手不得向模型发送作文原文、图片、手机号/邮箱明文、支付流水号、身份证或准考证。
- [ ] 三人同学组队价说明明确写“每名真实成员需为自己的报告付款，并各自获得 20 篇额度”。
- [ ] 前端不得展示官方助力为真实用户加入、虚拟头像、虚拟昵称或“已有同学加入”。
- [ ] 隐私政策明确学生作文、图片和诊断结果默认不用于模型训练、微调、营销案例、公开 SEO 或 Data Lake 汇集。
- [ ] 报告免责声明显示“AI 辅助诊断，仅供学习训练参考，不代表正式考试成绩”。
- [ ] 上线前至少使用 10 篇真实或高仿真高考英语作文完成质量 sanity check，人工确认评分、建议、范文和高亮定位没有明显误导。

### 11. 当前全局阻塞项 (Global Blockers)

(AI 修改区：如执行中遇到以下问题，请记录并停止相关开发)

- [ ] 云存储 provider 未确定或密钥不可用。
- [ ] 支付 provider 未确定或无法验签。
- [ ] OCR provider 成本/延迟无法满足首版体验。
- [ ] LLM provider 无法提供稳定额度，且 fallback provider 未配置。
- [ ] LLMRouter 无法稳定输出符合高考作文诊断 Schema 的 JSON。
- [ ] Supabase 表结构或 RLS 策略无法落地。
- [ ] 现有路由与 `/tools/gaokao-english-essay-diagnosis` 冲突。
- [ ] LLM 输出无法稳定通过 Schema 校验。
- [ ] AI 诊断 Prompt 在真实学生作文上的质量验证未完成；正式付费上线前至少需要 10 篇真实或高仿真作文人工审核。
- [ ] 若有人要求上线训练、微调、Data Lake、营销案例或公开 SEO 复用学生作文，必须先补充单独同意、去标识化、删除机制和合规评审；在完成前停止相关开发。

