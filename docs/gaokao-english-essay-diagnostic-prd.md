# 高考英语作文诊断工具 MVP PRD

版本：v0.5  
日期：2026-05-11  
目标：指导首版工程开发，聚焦“高考英语作文诊断”单一场景。

前端页面设计说明见：`docs/gaokao-english-essay-diagnostic-design.md`。

## 1. 产品边界

本产品只面向高考英语作文诊断。首版主链路为粘贴作文文本；拍照作文推荐用户先使用微信或手机相册的“提取文字”能力转成文本后粘贴。网页图片上传与 OCR 仅作为 Beta 增强链路，可通过环境变量关闭，不得阻塞文本诊断、支付、报告和退款主流程。

首版不覆盖 IELTS、CATTI、四六级、考研英语或其他写作场景。所有评分维度、提示词、报告结构、前端文案和营销表达都必须围绕高考英语作文。

首版验证三件事：

1. 学生或家长是否愿意提交高考英语作文。
2. AI 诊断报告是否能提供清晰、可信、可执行的修改建议。
3. 用户是否愿意为 20 篇深度精诊额度包按独立价付费，或参与三人同学组队价。

## 2. 首版范围

### 2.1 必做

- 高考英语作文文本粘贴输入。
- 高考英语作文图片上传输入为 Beta 增强能力。MVP 必须在 `NEXT_PUBLIC_GAOKAO_ESSAY_IMAGE_OCR_ENABLED=false` 时完整运行文本诊断主链路。
- 图片必须通过预签名 URL 从浏览器直传云存储，不允许经由 Vercel API 或 VPS 中转。
- 使用 OCR adapter 对作文图片进行识别与转写；首版可用 `gpt-5.5`，但正式高并发场景优先接入腾讯云 OCR、百度手写 OCR、Google Vision 等专业 OCR provider。
- 用户在诊断前校对识别文本。
- AI 生成结构化高考英语作文诊断 JSON。
- 前端展示预估分、问题列表、荧光笔高亮、修改建议、逻辑结构、稳健版范文、进阶版范文。
- 前端显著提示：本服务为 AI 自动生成诊断报告，不逐篇人工批改；订单异常支持一键自助重试/退款。
- 支付解锁完整报告。
- 多商户号轮询，支持按权重、限额、状态选择可用商户号。
- 三人同学组队价机制，但必须明示为组队购买；官方助力仅作为后端兜底与审计数据，不得伪装成真实用户、头像、昵称或同学动态。
- 组队活动权益、价格和倒计时必须真实透明，不得使用虚假锚定价、虚构稀缺、虚构同学动态或诱导性“人质式”交付话术。
- 订单补偿查询按钮。
- 报告等待页和订单页提供“智能申诉与重试”按钮，自动检查支付、任务和报告状态；仍无法生成时自动退款。
- 管理后台查看订单、诊断任务、商户号状态、失败原因。
- 后端具备从长驻 FastAPI 服务切换到 Serverless API 的能力。
- 诊断、图片识别、支付回调必须具备分级限流、队列削峰和拥塞降级能力。

### 2.2 暂不做

- 其他考试类型。
- 历年真题题库。
- 完整课程系统。
- 自动生成海量小红书/知乎营销图。
- 真实学生作文自动转 SEO 页面。
- 完整错题本。
- 伪装真实用户的虚拟拼团。
- WebSocket + Redis 实时解锁网关；首版只做 HTTP 轮询和手动补单兜底。
- Data Lake、模型微调、把学生作文用于训练或营销再利用。
- 完全无人工兜底。

## 3. 技术架构

### 3.1 前端

- 框架：Next.js App Router。
- 主要页面：
  - `/tools/gaokao-english-essay-diagnosis`：作文输入页。
  - `/tools/gaokao-english-essay-diagnosis/review/[draftId]`：图片识别与文本校对页，仅图片输入使用。
  - `/tools/gaokao-english-essay-diagnosis/report/[reportId]`：诊断报告页。
  - `/tools/gaokao-english-essay-diagnosis/checkout/[reportId]`：支付页。
  - `/tools/gaokao-english-essay-diagnosis/my-reports`：历史报告入口。
  - `/tools/gaokao-english-essay-diagnosis/refund-policy`：退款规则页。
  - `/admin/gaokao-essay`：轻量后台。

除管理后台外，所有用户侧路由均固定在 `/tools/gaokao-english-essay-diagnosis` 前缀下。

### 3.2 后端

默认形态：FastAPI 长驻服务。  
可切换形态：Serverless API。

后端职责：

- 接收作文文本。
- 签发图片上传意图和预签名直传 URL。
- 校验前端回传的云存储对象归属。
- 调用 OCR adapter 做图片识别，首版默认可使用 OpenAI `gpt-5.5`，但必须保留切换腾讯云 OCR、百度手写 OCR、Google Vision 等专业 OCR 引擎的接口；高并发正式场景优先使用专业 OCR。
- 调用 AI 诊断模型生成结构化报告。
- 创建订单并处理支付回调。
- 执行多商户号选择。
- 执行官方助力名额、订单补偿、失败重试。

### 3.3 云存储

图片必须使用云存储，且必须采用预签名 URL 直传。首版支持以下任一实现：

- Supabase Storage。
- S3 兼容对象存储，例如 Cloudflare R2、AWS S3、阿里云 OSS、腾讯云 COS。

要求：

- 后端只签发上传意图和短期预签名 URL，不承载图片上传流量。
- 浏览器使用预签名 URL 直接 `PUT` 到云存储。
- 前端上传成功后只向后端提交 `upload_intent_id`、`bucket`、`object_key`、`size_bytes`、`mime_type`、`sha256`。
- 后端不得接受任意公网图片 URL 作为识别输入。
- 后端必须校验 `object_key` 属于当前用户和当前 `draft` 的上传意图。
- 图片上传确认后写入 `storage_objects` 表记录。
- 数据库只保存对象 key、bucket、mime type、size、hash、访问策略。
- 不在数据库中保存图片二进制。
- 不在 Vercel、VPS 或 Serverless 本地磁盘长期保存用户图片。
- 识别完成后可按策略保留或定期删除原图。
- 访问原图必须使用服务端签名 URL，前端不得持有永久公开 URL。

### 3.4 数据库

- 首版正式部署必须使用托管 PostgreSQL，例如 Supabase PostgreSQL 或国内云 PostgreSQL。
- 业务数据库不得部署在承载 Next.js/FastAPI 的单台 VPS 本机；本机数据库仅允许短期开发或一次性验证使用。
- 必须启用 RLS。
- 服务端使用 service role key，前端只使用 anon key。

### 3.4.1 首版正式部署基线

首版正式环境固定采用以下基线，除非另开文档评审：

```text
国内已备案域名：www.qqbytop.com / qqbytop.com
应用服务器：单台 4核8GB 国内 VPS
VPS 承载：Nginx/Caddy、Next.js、FastAPI、Redis、Celery/RQ worker
图片存储：腾讯云 COS 或 S3 兼容对象存储，浏览器预签名 URL 直传
业务数据库：托管 PostgreSQL，不放在 VPS 本机
AI/OCR：外部 API，不在 VPS 本机跑模型
```

该基线的设计目标是让 VPS 只承担页面、API、支付回调、队列调度和少量后台任务；图片带宽、数据库持久化和 AI 算力均外置。

### 3.5 异步任务

默认部署使用 Redis + RQ 或 Celery。  
Serverless 部署使用外部队列或托管任务系统。

可选队列：

- Redis Queue。
- Celery + Redis。
- Supabase Edge Functions + Cron。
- Cloudflare Queues。
- Upstash QStash。
- Inngest。

异步任务包括：

- 图片识别。
- 作文诊断。
- 支付后权限发放。
- 订单补偿。
- 智能申诉与重试。
- 未交付订单自动退款。
- 三人同学组队价与官方助力名额。
- 商户号状态刷新。

队列与优先级：

- 支付 Webhook、订单同步、退款任务为最高优先级。
- 付费报告诊断为高优先级。
- 免费预览诊断为普通优先级。
- 图片识别按用户和 draft 限制并发。
- 当队列超过阈值时，不继续压后端，前端显示排队状态：`当前 AI 诊断排队中，预计等待约 15 秒。`
- 队列阈值通过环境变量配置：`DIAGNOSIS_QUEUE_SOFT_LIMIT`、`DIAGNOSIS_QUEUE_HARD_LIMIT`。

首版默认队列隔离方案：

```text
critical 队列：payment_webhook_followup、order_sync、auto_refund、refund_status_sync
default 队列：paid_diagnosis、recognize_image、unlock_report
low 队列：free_diagnosis、marketing_material_placeholder
```

要求：

- `critical` 必须有独立 worker 进程，不得与免费诊断共用 worker。
- `default` 可承载付费诊断和 OCR，但必须限制并发，避免压垮 LLM/OCR provider。
- `low` 可在预算、队列或 provider 拥塞时暂停。
- 支付 Webhook HTTP handler 本身只验签、落库、入队和快速返回；耗时处理进入 `critical` 队列。

### 3.5.1 LLM 多 Provider 调度

高考作文诊断不得依赖单一 LLM provider。后端必须通过 `LLMRouter` 调用诊断模型，而不是在业务代码里直接写某一家模型 API。

`LLMRouter` 职责：

- 根据 `LLM_PROVIDER_ORDER` 选择 provider。
- 检查 provider 健康状态、RPM/TPM、错误率和预算。
- 对 429、503、timeout、JSON schema 失败做分类处理。
- 执行短期熔断和 fallback。
- 记录 `provider`、`model_version`、`prompt_version`、`input_token_count`、`output_token_count`、`latency_ms`、错误码和重试次数。
- 所有 provider 均失败时，将任务交回队列延迟重试，不在 HTTP 请求内阻塞。

推荐 provider 顺序：

```text
deepseek -> qwen -> doubao -> openai
```

该顺序必须可通过环境变量调整。不得在代码中硬编码“只使用 DeepSeek”。

生产默认策略更新：腾讯云 TokenHub 作为首选 LLM provider，使用同一个 TokenHub API Key，通过不同 `model` 参数实现 DeepSeek Flash/Pro 双模型路由。该策略不取消 `LLMRouter` 的 fallback 能力，后续仍可切换或追加 Qwen、Doubao、DeepSeek 官方 API、OpenAI-compatible provider。

首版模型路由规则：

```text
free_summary -> tencent_tokenhub / deepseek-v4-flash
full_report_paid -> tencent_tokenhub / deepseek-v4-pro
retry_after_schema_fail -> same provider and same model first
pro_timeout_or_503 -> tencent_tokenhub / deepseek-v4-flash fallback
traffic_shed_mode -> all non-paid jobs use deepseek-v4-flash
```

说明：

- 当前首版实现会在报告创建时生成免费摘要和完整报告，但服务端未解锁前必须返回 `full_report: null`。由于该调用包含完整报告生成，默认按 `paid` tier 路由到 `deepseek-v4-pro`；后续若改成“先免费摘要、付费后再生成完整报告”，免费摘要任务必须使用 `deepseek-v4-flash`。
- `deepseek-v4-flash` 用于免费摘要、高峰削峰、低价值重试和 Pro 失败降级。
- `deepseek-v4-pro` 用于付费完整报告、逐句诊断、范文改写和学习计划。
- Pro 降级到 Flash 时，必须在报告元数据或诊断日志中标记 `model_degraded = true`，后台可见。
- 不得使用批量账号、亲友账号或无关主体 API Key 池规避 provider 的 RPM/TPM、风控或服务条款。

TokenHub 相关环境变量：

```env
LLM_PROVIDER_ORDER=tencent_tokenhub
TENCENT_TOKENHUB_BASE_URL=https://tokenhub.tencentmaas.com/v1
TENCENT_TOKENHUB_API_KEY=...
TENCENT_TOKENHUB_FREE_MODEL=deepseek-v4-flash
TENCENT_TOKENHUB_PAID_MODEL=deepseek-v4-pro
TENCENT_TOKENHUB_FALLBACK_MODEL=deepseek-v4-flash
```

如后续补齐 Qwen/Doubao 密钥，可改为：

```env
LLM_PROVIDER_ORDER=tencent_tokenhub,qwen,doubao
```

诊断任务必须记录以下模型元数据：

```text
model_provider
model_name
model_tier: flash | pro | fallback
model_degraded: boolean
input_token_count
output_token_count
cache_hit_tokens
latency_ms
error_code
```

错误处理规则：

| 错误类型 | 处理 |
|---|---|
| 429 rate limit | 当前 provider 延迟重试或短期熔断，切换 fallback provider |
| 503 server busy | 当前 provider 短期熔断，切换 fallback provider |
| timeout | 同 provider 最多重试 1 次，仍失败则切换 fallback provider |
| JSON schema fail | 可做一次 JSON repair 或同 provider 重试；仍失败则切换 fallback provider |
| 全 provider 失败 | 任务状态保持排队/重试中，写入错误日志和下一次重试时间 |

合规约束：

- 不得通过亲友账号、多个无关主体账号或批量 API Key 池规避 provider 的 RPM/TPM、风控或服务条款。
- 同一公司主体下的多个 key 只能用于合规凭证轮换、灰度、故障隔离、预算隔离和迁移，不得用于绕过限流。
- 正式扩容必须通过 provider 提额、签约、预算控制和多 provider fallback 实现。
- 诊断 Prompt 必须使用高考英语作文身份，不得使用 IELTS、剑桥考官、托福考官等非高考场景人设。

### 3.6 Serverless 快速切换能力

代码必须按适配器拆分，避免把业务逻辑绑死在 FastAPI 生命周期中。

要求：

- 业务逻辑放在 `services/`，不得直接依赖 FastAPI `Request`。
- 数据访问放在 `repositories/`。
- 支付渠道封装在 `payments/`。
- 云存储封装在 `storage/`。
- 队列封装在 `jobs/`。
- AI 调用封装在 `ai/`。
- FastAPI 路由只负责参数解析、鉴权、调用 service、返回响应。
- Serverless handler 复用同一套 service。
- 不依赖本地文件系统保存会话、图片、任务状态。
- Webhook 必须无状态、幂等、可重复执行。
- 长任务不得在请求生命周期内完成，必须入队。

建议目录：

```text
backend/
  app/
    api_fastapi/
      routes/
      main.py
    api_serverless/
      handlers/
    services/
    repositories/
    payments/
    storage/
    jobs/
    ai/
    schemas/
    settings.py
```

部署模式通过环境变量切换：

```text
RUNTIME_MODE=fastapi | serverless
QUEUE_DRIVER=redis | qstash | inngest | cloudflare
STORAGE_DRIVER=supabase | s3
PAYMENT_ROUTER_MODE=weighted | quota | health_first
GAOKAO_ESSAY_SINGLE_PRICE_CENTS=9900
GAOKAO_ESSAY_GROUP_PRICE_CENTS=5300
GAOKAO_ESSAY_GROUP_REQUIRED_MEMBERS=3
GAOKAO_ESSAY_GROUP_EXPIRES_HOURS=24
GAOKAO_ESSAY_GROUP_ALLOW_PLATFORM_ASSIST=true
ATTRIBUTION_COOKIE_TTL_DAYS=30
NEXT_PUBLIC_ENABLE_AD_PIXELS=false
NEXT_PUBLIC_TOUTIAO_PIXEL_ID=
NEXT_PUBLIC_TENCENT_PIXEL_ID=
NEXT_PUBLIC_XHS_PIXEL_ID=
CONVERSION_SERVER_PROVIDER=none | toutiao | tencent | xhs
REPORT_AUTO_REFUND_AFTER_SECONDS=300
REPORT_MAX_RETRY_COUNT=2
DIAGNOSIS_QUEUE_SOFT_LIMIT=100
DIAGNOSIS_QUEUE_HARD_LIMIT=500
ALLOWED_CORS_ORIGINS=https://qqbytop.com,https://www.qqbytop.com,http://localhost:3000
DRAFT_TOKEN_TTL_SECONDS=900
GAOKAO_ESSAY_DEFAULT_MAX_SCORE=25
OCR_PROVIDER=tencent_ocr | baidu_handwriting | google_vision | openai_vision
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
REPORT_POLL_FAST_SECONDS=3
REPORT_POLL_MEDIUM_SECONDS=5
REPORT_POLL_SLOW_SECONDS=10
```

### 3.7 用户身份与认证

首版采用“匿名试用 + 支付前绑定联系方式”的轻量身份方案。

规则：

- 匿名用户可以创建草稿、上传图片、生成免费报告。
- 创建草稿时服务端签发短期 `draft_token`，绑定 `draft_id`、匿名 session、user-agent 摘要和弱 IP 指纹。
- IP 指纹只做弱校验，IP 变化时不直接拒绝请求；系统应降级为校验 session、user-agent 和 `draft_token`。
- 用户支付、保存报告或查看历史报告前，必须绑定手机号或邮箱。
- 支付成功后，报告绑定 `user_id`、`order_id`、`report_id`。
- 用户可通过登录后的 `/tools/gaokao-english-essay-diagnosis/my-reports` 找回历史报告。
- 匿名用户的报告页 URL 是临时找回入口，前端需提示“登录后可随时查看历史报告”。

`draft_token` 实现规范：

- `draft_token` 由 FastAPI 签发和验签，BFF 不签发、不解析、不保存 token。
- 首版使用短期 JWT，算法 `HS256`。
- JWT payload 至少包含：`draft_id`、`session_id`、`ip_hash`、`ua_hash`、`exp`。
- 默认 TTL 使用 `DRAFT_TOKEN_TTL_SECONDS=900`。
- 前端通过 `Authorization: Bearer <draft_token>` 请求头传递，不放入 query string。
- `draft_token` 不入库；服务端通过签名和过期时间校验。若后续改为 opaque token，必须另行补充 Redis/数据库存储与吊销策略。

匿名身份绑定规则：

- 匿名阶段 `essay_drafts.user_id`、`upload_intents.user_id`、`storage_objects.user_id`、`diagnosis_reports.user_id` 可以为空，但必须关联 `session_id` 或可追踪匿名会话标识。
- 用户绑定手机号或邮箱后，系统必须基于 `session_id` / `draft_token` 归属回填该用户拥有的匿名 draft、upload、storage object、report。
- 创建订单前必须完成联系方式绑定；未绑定用户不得创建支付订单。

首版不强制接入微信登录；微信登录可作为后续增强。

### 3.8 部署拓扑

首版部署关系：

```text
用户浏览器
  -> Next.js/Vercel 页面：/tools/gaokao-english-essay-diagnosis
  -> FastAPI 或 Serverless API：草稿、上传意图、诊断任务、订单、智能申诉
  -> Supabase PostgreSQL：业务数据、订单、报告、审计日志
  -> 云存储：作文图片对象
  -> Redis/托管队列：图片识别、诊断、退款、补位任务
  -> 支付渠道：订单创建、Webhook、退款
  -> OpenAI/OCR Provider：图片识别与作文诊断
```

Next.js 可以通过同站 API rewrite/BFF 调用后端，也可以由前端直接调用独立 API 域名；生产环境必须统一 CORS 白名单和 `draft_token` 校验。若使用 BFF，BFF 职责仅限代理、同站 Cookie 注入和隐藏跨域细节；`draft_token` 签发、验签和权限判断全部在 FastAPI 完成。

## 4. 用户流程

### 4.1 文本输入流程

1. 用户进入首页。
2. 粘贴高考英语作文文本。
3. 点击“开始诊断”。
4. 系统创建 `essay_draft`，同时写入 `confirmed_text`。
5. 系统创建诊断任务，不进入校对页。
6. 用户进入报告等待页。
7. 报告生成后展示免费摘要。
8. 用户购买 20 篇深度精诊额度包或三人同学组队价后，当前报告立即消耗 1 篇额度解锁，剩余额度可用于后续报告。

### 4.2 图片输入流程

首版图片输入是 Beta 增强链路，不是 MVP 主链路。页面必须优先提示用户使用微信或手机相册“提取文字”后粘贴到文本框。当前端环境变量 `NEXT_PUBLIC_GAOKAO_ESSAY_IMAGE_OCR_ENABLED=false` 时：

- 首页仍显示拍照作文的文字提取指引。
- 网页图片上传按钮不得发起上传请求。
- 文本输入、报告生成、付费解锁、自助重试/退款必须不受影响。
- 高峰期可通过关闭该开关暂停网页 OCR，降低百度 OCR QPS 和成本风险。

1. 用户选择作文照片。
2. 前端调用 `POST /api/v1/drafts` 创建 `source_type = image` 的空草稿。
3. 前端向后端请求 `upload_intent` 和预签名 `PUT` URL。
4. 后端校验文件名、大小、mime type，生成 5 分钟有效的预签名 URL。
5. 浏览器直接将图片 `PUT` 到云存储。
6. 前端通知后端上传完成，提交 `upload_intent_id`、`bucket`、`object_key`、`size_bytes`、`mime_type`、`sha256`。
7. 后端校验对象归属、大小、mime type 和上传意图是否未过期。
8. 数据库写入 `storage_objects` 记录。
9. 后端创建图片识别任务，通过服务端签名读取 URL 或文件流调用 OCR adapter。
10. 返回转写文本、低置信片段、图片质量提醒。
11. 前端要求用户校对。
12. 用户确认后创建诊断任务。

### 4.3 付费解锁流程

1. 报告免费层展示总分、3 个核心问题摘要。
2. 完整报告需购买 20 篇深度精诊额度包，或加入三人同学组队价并完成本人付款。
3. 创建订单时调用商户号轮询器选择可用商户号。
4. 支付成功后，支付服务回调 `/api/payments/webhook`。
5. Webhook 校验签名、幂等写入支付状态、快速返回 200。
6. 后台任务发放报告权限。
7. 前端轮询订单状态，成功后刷新报告页。

### 4.4 智能申诉与重试流程

用途：用户已支付或已触发诊断，但报告等待页长时间未出结果。

前端按钮：

- 主按钮：`智能申诉与重试`
- 辅助说明：`系统将自动检查支付、任务和报告状态；仍无法生成时自动退款。`

处理规则：

1. 用户点击按钮后，系统先同步订单支付状态和报告任务状态。
2. 若订单仍为 `PENDING`，使用订单绑定的商户号查询支付状态，不重新轮询商户号。
3. 若订单已支付但诊断任务未启动，立即将 `diagnose_essay` 重新入队。
4. 若诊断任务失败且 `retry_count < REPORT_MAX_RETRY_COUNT`，立即重试。
5. 若支付成功后超过 `REPORT_AUTO_REFUND_AFTER_SECONDS` 仍无完整报告，自动发起退款。
6. 若退款成功，订单状态标记为 `REFUNDED`，报告保持锁定。
7. 若退款失败，订单 `refund_status` 标记为 `REFUND_FAILED`，后台异常列表可见；用户端显示“退款处理中”。
8. 所有用户点击、状态同步、任务重试、退款发起和退款结果必须写入 `support_actions`。

### 4.4.1 自助退款入口

用途：为已付款用户提供清晰、可追踪、可自动处理的订单异常入口，降低外部投诉和人工客服压力。

前端入口：

- 报告等待页、报告页底部、支付页和退款规则页必须提供 `订单异常 / 申请退款` 入口。
- 入口不得刻意隐藏，也不得写成“拒绝售后”“不接受退款”等排除用户权利的表达。
- 入口说明文案：`系统将先自动检查支付、任务和报告状态；符合未交付条件时自动退款。`

处理规则：

1. 用户点击 `订单异常 / 申请退款` 后，后端写入 `support_actions.action = 'USER_REFUND_CLICKED'`。
2. 后端不得立即无条件退款，必须先复用 `smart_appeal_report` 的状态同步、任务重试和订单检查逻辑。
3. 若订单未支付，返回“尚未确认支付”，不触发退款。
4. 若报告已完整生成且已解锁，不自动秒退，返回退款规则说明并写入 `support_actions.action = 'REFUND_REJECTED_BY_RULE'` 或等价动作。
5. 若订单已支付但报告未生成，先按 `REPORT_MAX_RETRY_COUNT` 触发重试。
6. 若支付成功超过 `REPORT_AUTO_REFUND_AFTER_SECONDS` 仍无完整报告，入队 `auto_refund_unfulfilled_order`。
7. 若退款发起成功，写入 `support_actions.action = 'REFUND_REQUESTED'`；退款成功写 `REFUND_APPROVED` 或 `AUTO_REFUND_TRIGGERED` 的成功结果。
8. 若退款失败，订单进入 `REFUND_FAILED`，用户端显示“退款处理中”，后台异常列表可见。
9. 所有退款申请、规则拒绝、重试、退款发起和退款结果必须留痕，不得仅依赖前端弹窗。

### 4.4.2 AI 自助助手

用途：在前端右下角提供 AI 自助助手，回答上传、识别、报告等待、退款规则和报告找回等流程问题，减少重复性人工解释。

允许回答范围：

- 怎么上传图片、图片过大或 HEIC 怎么处理。
- OCR 识别错误如何校对。
- 为什么报告仍在生成或排队。
- 如何点击 `智能申诉与重试`。
- 退款规则、退款状态和预计到账说明。
- 如何登录后找回历史报告。
- AI 自动服务说明和隐私/删除入口。

禁止行为：

- 不得承诺提分、保分、预测高考最终成绩或冒充阅卷老师。
- 不得要求用户提供身份证、准考证、学校班级等非必要敏感信息。
- 不得根据聊天内容直接解锁报告、直接退款、修改订单、修改报告或触发官方助力名额。
- 不得输出与产品流程无关的考试押题、作弊、绕过支付或规避平台规则建议。

工具调用边界：

- AI 助手只能调用受控后端工具：`get_order_status`、`get_report_status`、`trigger_smart_appeal`、`get_refund_status`、`show_upload_help`、`show_refund_policy`。
- 触发退款仍必须由 `smart_appeal_report` / `auto_refund_unfulfilled_order` 状态机判断，不能由 AI 聊天模型直接决定。
- 每次打开助手、发送消息、触发受控工具都必须写入 `support_actions` 或等价审计日志。

### 4.5 20 篇抢分包、三人同学组队价与官方助力

首版采用二选一价格，但权益都指向同一套 20 篇深度精诊额度包：

- 独立解锁：`GAOKAO_ESSAY_SINGLE_PRICE_CENTS=9900`，即 `￥99.00`，`product_type=essay_credit_pack_20`，获得 20 篇深度精诊额度。
- 三人同学组队价：`GAOKAO_ESSAY_GROUP_PRICE_CENTS=5300`，即 `￥53.00/人`，`product_type=group_essay_credit_pack_20_member`，成团后每名真实付费成员各自获得 20 篇深度精诊额度。

业务规则：

- 三人同学组队价是组队购买，不是虚拟拼团。
- 每个真实成员必须拥有自己的 `report_id`，并为自己的报告创建和支付 `order_id`。
- 组队只决定价格档位，不共享作文、报告、订单或个人信息。
- 从某个 `report_id` 进入付款时，支付成功后立即发放 20 篇额度，并消耗 1 篇解锁当前报告，剩余 19 篇。
- 后续用户生成新报告后，可使用剩余额度解锁，每解锁 1 篇报告扣 1 次。
- 20 篇额度不是无限次，不是月卡，不按天/月自动重置。
- 成员人数达到 `GAOKAO_ESSAY_GROUP_REQUIRED_MEMBERS=3` 后，真实付费成员按组队价支付或确认支付成功，才解锁各自完整报告并各自获得 20 篇额度。
- 好友只打开链接、只注册、只提交免费作文不算成团成员；必须创建自己的报告并完成组队价支付才算真实成员。
- 组队有效期由 `GAOKAO_ESSAY_GROUP_EXPIRES_HOURS=24` 控制。
- 若组队到期未成功，用户可选择重新发起组队、按单人价创建新订单，或按退款规则申请退款；不得用模糊文案诱导用户误以为已成团。

官方助力只作为内部兜底与审计数据，不得模拟真实学生。

规则：

- 仅当活动配置 `allow_platform_assist = true` 时启用。
- 仅允许补 1 个名额。
- 官方助力成员类型必须为 `PLATFORM_ASSIST`。
- 后台审计日志必须记录补位原因。
- 前端不得展示虚假真实用户参团信息，不展示官方助力头像、昵称、同学动态或“已有同学加入”。
- 若规则承诺未成团退款，不得用补位规避退款承诺。
- 不得使用“满分绝密”“提分秘籍”“致命丢分点”“不拉人就亏”等恐吓、夸大或强操纵表达。
- 价格必须对应真实可购买权益，不得设置仅用于制造心理落差的虚假锚定价。
- 首版不要求 WebSocket 实时解锁。组队状态和报告解锁以服务端订单/团状态为准，前端通过报告页或订单页轮询刷新。

### 4.5.1 定价、免费层边界与组队规则

本节为商业规则硬性契约，M7/M9 实现不得自行改价或改变免费层边界。

价格环境变量：

```text
GAOKAO_ESSAY_SINGLE_PRICE_CENTS=9900
GAOKAO_ESSAY_GROUP_PRICE_CENTS=5300
GAOKAO_ESSAY_PACK_CREDITS=20
GAOKAO_ESSAY_GROUP_REQUIRED_MEMBERS=3
GAOKAO_ESSAY_GROUP_EXPIRES_HOURS=24
GAOKAO_ESSAY_GROUP_ALLOW_PLATFORM_ASSIST=true
GAOKAO_ESSAY_FREE_DAILY_LIMIT_PER_IP=3
GAOKAO_ESSAY_FREE_DAILY_LIMIT_GLOBAL=500
GAOKAO_ESSAY_FREE_CACHE_TTL_SECONDS=604800
```

`product_type` 首版支持：

- `essay_credit_pack_20`：独立购买 20 篇深度精诊额度包，使用 `GAOKAO_ESSAY_SINGLE_PRICE_CENTS`。
- `group_essay_credit_pack_20_member`：三人同学组队购买 20 篇深度精诊额度包，使用 `GAOKAO_ESSAY_GROUP_PRICE_CENTS`，必须绑定有效 `group_id`。
- `full_report_single` / `group_report_member`：仅作为旧链接兼容，不再由前端主动生成；后端可临时映射到新权益或返回明确升级提示。

后续可扩展但首版不实现：

- `bundle_5`
- `monthly_pass`

免费层展示边界：

- 可以展示预估分、置信度、3 个风险类型、严重度。
- 最多展示 1 个短原文片段，长度不得超过 20 个英文词，用于证明系统确实读取了作文。
- 不展示具体修改建议、替换句、完整解释、逐句批注、逻辑图、稳健版范文、进阶版范文、AI 演算母题库。
- `FreeSummaryRisk.snippet` 只能用于该 1 个短片段；其他风险不得携带原文片段。
- `FreeSummaryRisk.explanation` 只能是简短风险说明，不得包含可直接替换的修改答案。

免费层去重与缓存：

- 后端必须对 `confirmed_text` 做规范化后生成 `confirmed_text_hash = sha256(normalize(confirmed_text))`。
- 规范化至少包括：去除首尾空白、统一换行、折叠连续空格、统一大小写比较策略。
- 同一 `confirmed_text_hash` 的免费诊断优先返回缓存或已有免费摘要，不重复消耗 LLM。
- 缓存 TTL 默认 `GAOKAO_ESSAY_FREE_CACHE_TTL_SECONDS=604800`。
- 付费完整报告是否复用缓存由服务端策略决定，但不得因缓存返回其他用户的个人信息、订单状态或报告权限。

组队规则：

- 三人同学组队价只在 `GAOKAO_ESSAY_GROUP_REQUIRED_MEMBERS=3` 时成团。
- 真实成员必须完成自己的作文提交、报告创建和组队价订单支付。
- 官方助力名额最多补 1 个，并且必须在后台标记为 `PLATFORM_ASSIST`。
- 官方助力只补成员数，不代表真实用户付款，不得参与营收统计为真实订单。
- 组队成功只解锁已付款真实成员自己的报告，并为每名真实付费成员各自发放 20 篇额度。

后台漏斗指标：

M9 后台必须提供 `ConversionFunnelTab` 或等价漏斗视图，至少包含：

- `visit_count`
- `draft_created_count`
- `report_completed_count`
- `unlock_click_count`
- `order_created_count`
- `paid_order_count`
- `refund_count`
- `gross_revenue_cents`
- `net_revenue_cents`

至少支持按以下维度过滤：

- `utm_source`
- `utm_campaign`
- `utm_content`
- `product_type`
- `source_type`
- `created_at` 时间范围

## 4.6 营销归因与转化回传

首版必须支持 UTM 归因，但广告平台 Pixel 和 server-side conversion 默认关闭，投放前通过环境变量开启。

UTM 采集规则：

- 用户首次进入高考作文诊断工具时，前端读取 `utm_source`、`utm_medium`、`utm_campaign`、`utm_content`、`utm_term`、`referrer`、`landing_path`。
- 前端将归因信息写入 first-party cookie 或 localStorage，默认保留 `ATTRIBUTION_COOKIE_TTL_DAYS=30`。
- 创建 draft 时将当前 `attribution_id` 或归因 payload 提交给 FastAPI。
- 创建 order 时必须将 `orders.attribution_id` 绑定到订单。
- 后台报表至少能按 `utm_source`、`utm_campaign`、`utm_content` 聚合草稿数、订单数、退款数、净收入。

转化回传规则：

- 支付成功事实来源只能是支付 webhook 或订单同步确认，不是前端成功页、WebSocket 或用户本地状态。
- 订单进入 `PAID` 后，由 worker 入队 `conversion_event`，写入 `conversion_events` 表。
- 前端 Pixel 仅作为辅助事件；广告脚本加载失败不得影响订单解锁、报告展示或转化统计。
- 广告平台回传不得包含作文原文、图片、手机号明文、邮箱明文、未成年人身份信息或诊断内容。
- 如平台要求用户标识，只能按平台规范传输最小字段，并优先使用哈希化、去标识化字段。
- Pixel 脚本不得硬编码在全局 layout；必须由 `NEXT_PUBLIC_ENABLE_AD_PIXELS` 和平台 pixel id 环境变量控制。

## 5. 多商户号轮询

### 5.1 目标

支持多个支付商户号，降低单个商户号异常、限额、风控、通道故障对收款链路的影响。

合规边界：

- 多商户号仅用于同一合法主体或明确授权的服务商体系下的通道冗余、额度管理、故障隔离和 `DRAINING` 切换。
- 不得使用无关主体、未授权主体或主体不一致的商户号混收同一业务。
- 不得将多商户号轮询用于规避支付平台风控、拆分交易规模、隐藏真实业务主体或制造虚假交易。
- 不得通过亲友自交易、虚假交易或“养号”方式制造流水。
- 网站备案主体、页面展示主体、收款主体、退款责任主体和发票/收据说明必须保持一致或有清晰授权链路。
- 活动投放前应准备业务说明、退款规则、客服入口、支付域名和 webhook 域名配置，并尽量提前与支付服务商沟通活动规模。

### 5.2 选择策略

首版必须支持：

- `weighted`：按权重分配。
- `quota`：优先选择当日剩余额度充足的商户号。
- `health_first`：优先选择近期成功率最高且状态正常的商户号。

默认策略：`health_first`。

额度并发规则：

- `daily_used_cents` 只在支付成功后累加，不在创建订单时累加。
- 每日 UTC+8 00:00 由定时任务重置商户号当日额度统计。
- 累加额度必须使用数据库原子更新，例如 `daily_used_cents = daily_used_cents + amount_cents` 并同时检查不超过 `daily_quota_cents`。
- 并发创建订单时，商户号选择可以参考当前额度；支付成功时若额度已满，应将商户号标记为 `LIMITED` 并通知后台处理。

### 5.3 商户号状态

商户号状态：

- `ACTIVE`：可用。
- `DRAINING`：不再接新单，只处理回调和退款。
- `DISABLED`：禁用。
- `LIMITED`：达到限额或触发风控，临时不可用。

### 5.4 订单绑定

订单创建时必须把所选商户号写入 `orders.merchant_account_id`。  
后续支付查询、回调验签、退款、对账必须使用订单绑定的商户号，不得重新轮询。

### 5.5 Webhook 路由

支付回调必须能识别来源商户号：

- 通过回调 URL path 区分：`/api/v1/payments/webhook/{merchant_code}`。
- 或通过回调参数中的商户号识别。

验签必须使用对应商户号密钥。

Webhook 处理原则：

- 独立路由、独立限流、独立日志。
- 必须使用支付平台要求的原始 body 验签；不得先解析/重排参数后再验签。
- 必须生成幂等键，例如 `provider + merchant_code + provider_transaction_id + event_type`。
- Webhook handler 只允许执行：验签、幂等检查、最小数据库事务、入 `critical` 队列、快速返回支付平台要求的成功响应。
- Webhook handler 不得调用 OCR、LLM、短信、发票、复杂解锁、WebSocket 推送或任何不必要的外部慢接口。
- 支付平台重复回调、乱序回调必须可安全处理，不得重复发放权益、重复退款或重复记账。

## 6. 核心数据表

建表顺序必须保证外键依赖有效：`users`、`marketing_attributions`、`upload_intents`、`storage_objects`、`essay_drafts`、`diagnosis_reports`、`merchant_accounts`、`orders`、`payment_events`、`group_buys`、`group_members`、`audit_logs`、`support_actions`、`conversion_events`。

### 6.1 users

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
```

### 6.2 upload_intents

```sql
create table upload_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  draft_id uuid references essay_drafts(id),
  bucket text not null,
  object_key text not null,
  storage_driver text not null,
  expected_mime_type text not null,
  expected_size_bytes integer not null,
  status text not null default 'PENDING',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

要求：

- `upload_intents.object_key` 必须由服务端生成，不接受前端自定义完整路径。
- `expires_at` 默认 5 分钟。
- 同一个上传意图只能完成一次。
- 状态枚举：`PENDING | COMPLETED | EXPIRED | CANCELLED`。

### 6.3 storage_objects

```sql
create table storage_objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  upload_intent_id uuid references upload_intents(id),
  bucket text not null,
  object_key text not null,
  storage_driver text not null,
  mime_type text not null,
  size_bytes integer not null,
  sha256 text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### 6.4 essay_drafts

```sql
create table essay_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  attribution_id uuid references marketing_attributions(id),
  source_type text not null check (source_type in ('text', 'image')),
  original_image_object_id uuid references storage_objects(id),
  raw_input_text text,
  transcribed_text text,
  ocr_result jsonb,
  confirmed_text text,
  confirmed_text_hash text,
  word_count integer,
  language text not null default 'en',
  ip_address inet,
  user_agent text,
  ocr_status text not null default 'NOT_REQUIRED',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
```

### 6.5 diagnosis_reports

```sql
create table diagnosis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  draft_id uuid not null references essay_drafts(id),
  status text not null default 'PENDING',
  score numeric,
  free_summary jsonb,
  full_report jsonb,
  is_unlocked boolean not null default false,
  retry_count integer not null default 0,
  last_retry_at timestamptz,
  max_score integer not null default 25,
  model_version text,
  prompt_version text,
  input_token_count integer,
  output_token_count integer,
  latency_ms integer,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

### 6.6 merchant_accounts

```sql
create table merchant_accounts (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null unique check (merchant_code ~ '^[a-z0-9_]+$'),
  provider text not null,
  mch_id text not null,
  display_name text,
  status text not null default 'ACTIVE',
  weight integer not null default 100,
  daily_quota_cents integer,
  daily_used_cents integer not null default 0,
  success_rate_1h numeric,
  failure_count_1h integer not null default 0,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

密钥不得入库明文保存。密钥通过环境变量或密钥管理服务读取：

```text
PAYMENT_MCH_SECRET_<MERCHANT_CODE>
PAYMENT_MCH_PRIVATE_KEY_<MERCHANT_CODE>
```

### 6.7 orders

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  report_id uuid references diagnosis_reports(id),
  attribution_id uuid references marketing_attributions(id),
  merchant_account_id uuid not null references merchant_accounts(id),
  amount_cents integer not null,
  currency text not null default 'CNY',
  status text not null default 'PENDING',
  refund_status text not null default 'NONE',
  refund_reason text,
  refund_amount_cents integer,
  provider text not null,
  provider_order_id text,
  paid_at timestamptz,
  refunded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);
```

订单过期规则：

- 未支付订单默认 30 分钟过期。
- 定时任务 `expire_unpaid_orders` 将超时 `PENDING` 订单标记为 `EXPIRED`。
- 若创建订单时预占商户额度，过期任务必须释放预占额度；首版默认在支付成功时才累计 `daily_used_cents`，不在创建订单时预扣。

### 6.7.1 payment_events

```sql
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  merchant_account_id uuid not null references merchant_accounts(id),
  order_id uuid references orders(id),
  event_type text not null,
  provider_transaction_id text,
  idempotency_key text not null unique,
  signature_valid boolean not null default false,
  raw_event jsonb,
  processing_status text not null default 'RECEIVED',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
```

用途：

- 保存支付平台回调的最小幂等记录。
- 支持重复回调去重、异常追踪和对账。
- 不保存明文敏感支付密钥。

### 6.8 group_buys

```sql
create table group_buys (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id),
  report_id uuid references diagnosis_reports(id),
  required_members integer not null default 3,
  group_price_cents integer not null default 5300,
  status text not null default 'ACTIVE',
  allow_platform_assist boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### 6.9 group_members

```sql
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references group_buys(id),
  user_id uuid references users(id),
  report_id uuid references diagnosis_reports(id),
  order_id uuid references orders(id),
  member_type text not null check (member_type in ('USER', 'PLATFORM_ASSIST')),
  display_name text,
  payment_status text not null default 'PENDING',
  joined_at timestamptz not null default now()
);
```

### 6.10 audit_logs

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

### 6.11 support_actions

```sql
create table support_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  order_id uuid references orders(id),
  report_id uuid references diagnosis_reports(id),
  action text not null,
  status text not null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

用途：

- 记录用户点击“智能申诉与重试”。
- 记录用户点击 `订单异常 / 申请退款`、规则拒绝、退款申请和退款结果。
- 记录 AI 自助助手打开、消息发送、受控工具调用和回复摘要。
- 记录系统同步订单状态。
- 记录 AI 任务重新入队。
- 记录自动退款发起和退款结果。
- 支撑后台排查 `REFUND_FAILED` 和异常订单。

### 6.12 marketing_attributions

```sql
create table marketing_attributions (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid references users(id),
  first_landing_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz not null default now()
);
```

### 6.13 conversion_events

```sql
create table conversion_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  attribution_id uuid references marketing_attributions(id),
  event_name text not null,
  amount_cents integer,
  currency text not null default 'CNY',
  ad_platform text,
  delivery_status text not null default 'PENDING',
  payload jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
```

要求：

- `conversion_events` 由支付成功后的后端 worker 创建。
- `delivery_status` 至少支持 `PENDING | SENT | FAILED | SKIPPED`。
- 不得在 `payload` 中保存作文原文、图片、手机号明文、邮箱明文或诊断内容。

## 7. API 设计

### 7.1 创建文本草稿

`POST /api/v1/drafts`

请求：

```json
{
  "source_type": "text",
  "raw_input_text": "In my opinion...",
  "attribution_id": "uuid"
}
```

响应：

```json
{
  "draft_id": "uuid",
  "draft_token": "short-lived-token",
  "confirmed": true,
  "next_step": "create_report"
}
```

图片输入创建空草稿时请求：

```json
{
  "source_type": "image",
  "attribution_id": "uuid"
}
```

响应：

```json
{
  "draft_id": "uuid",
  "draft_token": "short-lived-token",
  "confirmed": false,
  "next_step": "create_upload_intent"
}
```

规则：

- 文本输入路径中，`raw_input_text` 经后端校验后同时写入 `raw_input_text` 和 `confirmed_text`，不进入校对页。
- 图片输入路径中，先创建空 `essay_draft`，再创建上传意图。
- 后端必须计算并保存 `word_count`。

### 7.2 创建图片上传意图

`POST /api/v1/uploads/intents`

请求：

```json
{
  "draft_id": "uuid",
  "file_name": "essay-photo.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 2450000
}
```

响应：

```json
{
  "upload_intent_id": "uuid",
  "bucket": "gaokao-essay-uploads",
  "object_key": "users/{user_id}/drafts/{draft_id}/{upload_intent_id}.jpg",
  "upload_url": "https://...",
  "expires_at": "2026-05-10T10:05:00Z",
  "method": "PUT",
  "required_headers": {
    "Content-Type": "image/jpeg"
  }
}
```

要求：

- `upload_url` 默认 5 分钟有效。
- `object_key` 必须由服务端生成。
- 单用户和单 draft 必须限制未完成上传意图数量。
- 该接口需要短期 `draft_token` 或登录态，不能匿名裸调。

### 7.3 确认图片上传并创建识别任务

`POST /api/v1/uploads/{upload_intent_id}/complete`

请求：

```json
{
  "bucket": "gaokao-essay-uploads",
  "object_key": "users/{user_id}/drafts/{draft_id}/{upload_intent_id}.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 2450000,
  "sha256": "optional-client-hash"
}
```

响应：

```json
{
  "draft_id": "uuid",
  "image_object_id": "uuid",
  "recognition_status": "PENDING"
}
```

要求：

- 后端必须校验对象 key、bucket、大小、mime type 与上传意图匹配。
- 后端必须通过云存储 HEAD/Object metadata 确认对象存在。
- 不接受任意公网图片 URL。
- 确认成功后写入 `storage_objects`，并将图片识别任务入队。

### 7.4 查询图片识别结果

`GET /api/v1/drafts/{draft_id}/recognition`

响应：

```json
{
  "status": "COMPLETED",
  "transcribed_text": "In my opinion...",
  "uncertain_spans": [
    {
      "text": "enviroment",
      "line": 3,
      "reason": "可能是 environment，也可能是 enviroment"
    }
  ],
  "quality_warnings": [
    "图片右下角有阴影",
    "第 5 行部分文字模糊"
  ]
}
```

当队列拥塞时响应：

```json
{
  "status": "QUEUED",
  "queue_position": 18,
  "estimated_wait_seconds": 15,
  "message": "当前 AI 诊断排队中，预计等待约 15 秒。"
}
```

### 7.5 兼容接口：上传图片并识别

`POST /api/v1/drafts/image`

仅允许本地开发或内部调试环境启用，生产环境默认关闭。生产必须使用 `upload_intent -> direct PUT -> complete -> recognition` 链路。

请求：`multipart/form-data`

字段：

- `image`

响应：

```json
{
  "draft_id": "uuid",
  "image_object_id": "uuid",
  "transcribed_text": "In my opinion...",
  "uncertain_spans": [
    {
      "text": "enviroment",
      "line": 3,
      "reason": "可能是 environment，也可能是 enviroment"
    }
  ],
  "quality_warnings": [
    "图片右下角有阴影",
    "第 5 行部分文字模糊"
  ]
}
```

### 7.6 确认文本

`POST /api/v1/drafts/{draft_id}/confirm`

请求：

```json
{
  "confirmed_text": "In my opinion..."
}
```

响应：

```json
{
  "draft_id": "uuid",
  "confirmed": true
}
```

### 7.7 创建诊断任务

`POST /api/v1/reports`

请求：

```json
{
  "draft_id": "uuid"
}
```

响应：

```json
{
  "report_id": "uuid",
  "status": "PENDING",
  "queue_status": "QUEUED",
  "estimated_wait_seconds": 15
}
```

要求：

- 创建报告只入队，不在请求内同步调用大模型。
- 队列超过 `DIAGNOSIS_QUEUE_HARD_LIMIT` 时返回 429，并提示稍后重试。
- 免费诊断和付费诊断使用不同优先级队列。

### 7.8 查询诊断报告

`GET /api/v1/reports/{report_id}`

响应：

```json
{
  "report_id": "uuid",
  "status": "COMPLETED",
  "is_unlocked": false,
  "score": {
    "estimated": 17,
    "max": 25,
    "confidence": "medium",
    "reason": "内容完整，但语法准确性和衔接表达仍有明显扣分风险。"
  },
  "free_summary": {},
  "full_report": null
}
```

安全要求：

- 当 `is_unlocked = false` 时，服务端必须强制返回 `full_report: null`。
- 不允许通过查询参数、前端状态或调试开关绕过该限制。
- 解锁判断必须基于服务端订单与权限状态，不能信任前端传入的 `is_unlocked`。

### 7.9 智能申诉与重试

`POST /api/v1/reports/{report_id}/smart-appeal`

请求：

```json
{
  "reason": "report_not_generated"
}
```

`reason` 可省略，默认值为 `report_not_generated`。

响应：

```json
{
  "status_synced": true,
  "retry_triggered": false,
  "refund_triggered": false,
  "current_order_status": "PAID",
  "current_report_status": "COMPLETED",
  "message": "报告已生成，请刷新查看。"
}
```

要求：

- 接口必须幂等。
- 必须按订单绑定的 `merchant_account_id` 同步支付或退款状态。
- 不得在智能申诉中重新选择商户号。
- 若触发退款，必须先将 `orders.refund_status` 更新为 `REQUESTED`。
- 若报告已生成，不触发重试或退款。
- 若订单未支付，不触发诊断重试。
- 每次调用都必须写入 `support_actions`。

### 7.10 自助退款申请

`POST /api/v1/orders/{order_id}/refund-request`

请求：

```json
{
  "reason": "report_not_generated"
}
```

响应：

```json
{
  "status_synced": true,
  "retry_triggered": false,
  "refund_triggered": true,
  "refund_status": "REQUESTED",
  "message": "已为你提交自动退款处理，退款状态可在本页刷新查看。"
}
```

要求：

- 该接口是 `订单异常 / 申请退款` 入口的后端承接接口。
- 必须先同步订单、报告和退款状态，不得无条件秒退。
- 已完整生成并解锁的报告不得自动秒退；必须返回退款规则说明并写入 `support_actions`。
- 若触发退款，必须使用订单绑定的 `merchant_account_id`，不得重新轮询商户号。
- 该接口必须幂等；重复点击不得重复退款。

### 7.11 AI 自助助手

`POST /api/v1/support/chat`

请求：

```json
{
  "message": "我已经付款了，为什么还没有报告？",
  "report_id": "uuid",
  "order_id": "uuid"
}
```

响应：

```json
{
  "answer": "我会先帮你检查订单和报告状态。若仍未生成，可点击智能申诉与重试。",
  "suggested_actions": ["trigger_smart_appeal", "show_refund_policy"]
}
```

要求：

- AI 助手只回答产品流程、上传识别、报告等待、退款规则和历史报告找回问题。
- 不得由聊天模型直接执行退款、解锁、补位、修改订单或修改报告。
- 若需要检查状态，必须通过受控工具读取服务端状态。
- 每次会话和工具调用必须写入 `support_actions` 或等价审计日志。
- 不得向 LLM provider 发送作文原文、图片、手机号/邮箱明文、支付流水号等非必要敏感信息；若需要上下文，只发送最小化的状态摘要。

### 7.12 创建订单

`POST /api/v1/orders`

请求：

```json
{
  "report_id": "uuid",
  "product_type": "essay_credit_pack_20",
  "group_id": "uuid",
  "attribution_id": "uuid"
}
```

说明：

- `product_type` 首版实现 `essay_credit_pack_20 | group_essay_credit_pack_20_member`；字段必须按可扩展枚举或字符串处理，不得在数据库和代码中写死为单一 `full_report`。
- `essay_credit_pack_20` 使用 `GAOKAO_ESSAY_SINGLE_PRICE_CENTS`，订单获得 20 篇深度精诊额度。
- `group_essay_credit_pack_20_member` 使用 `GAOKAO_ESSAY_GROUP_PRICE_CENTS`，且必须绑定有效 `group_id`。
- `group_essay_credit_pack_20_member` 订单只为当前用户自己的 `report_id` 付款，不得共享或解锁他人报告。
- 旧的 `full_report_single | group_report_member` 仅作为兼容旧链接处理；前端不得再主动生成。
- `attribution_id` 可选；若用户来自自然流量或前端未捕获归因信息，可为空。
- 后端不得信任前端传入的金额、支付状态或解锁状态；`attribution_id` 仅用于营销归因，不参与权益判断。

响应：

```json
{
  "order_id": "uuid",
  "merchant_code": "mch_a",
  "payment_url": "https://..."
}
```

### 7.13 支付回调

`POST /api/v1/payments/webhook/{merchant_code}`

要求：

- 根据 `merchant_code` 读取对应商户号配置。
- 使用支付平台原始 body 和该商户号密钥验签。
- 根据支付流水号定位订单。
- 校验订单绑定的 `merchant_account_id` 与回调商户号一致。
- 基于 `provider + merchant_code + provider_transaction_id + event_type` 做幂等处理。
- 写入 `payment_events`，必要时用最小事务标记订单为 `PAID_PENDING_UNLOCK` 或等价中间状态。
- 将后续订单确认、权益解锁、通知和审计写入 `critical` 队列。
- 快速返回支付平台要求的成功响应。
- 不在 Webhook 内执行耗时诊断、发票、短信、复杂解锁、OCR/LLM 或 WebSocket 推送。

### 7.14 手动补单

`POST /api/v1/orders/{order_id}/sync`

用途：用户点击“我已支付，查询订单”。

要求：使用订单绑定的商户号查询支付状态。

### 7.15 管理后台商户号状态

`GET /api/v1/admin/merchant-accounts`

返回商户号状态、当日用量、成功率、失败次数、是否可接单。

`PATCH /api/v1/admin/merchant-accounts/{id}`

支持切换：

- `ACTIVE`
- `DRAINING`
- `DISABLED`
- `LIMITED`

## 8. AI 图片识别与 OCR 容错

系统目标：从高考英语作文图片中识别英文作文，不直接评分。图片识别能力通过 OCR adapter 封装，首版可使用 `gpt-5.5`，但正式高并发场景优先使用腾讯云 OCR、百度手写 OCR、Google Vision 等专业手写 OCR 引擎。

OCR provider 输出必须先落入标准化 `ocr_result`，再进入校对页。LLM 可以用于 OCR 伪影判断，但不得静默改写后直接评分。

输出必须是 JSON：

```json
{
  "transcribed_text": "",
  "line_items": [
    {
      "line_no": 1,
      "text": "",
      "confidence": "high"
    }
  ],
  "uncertain_spans": [
    {
      "line_no": 1,
      "text": "",
      "possible_values": [],
      "reason": ""
    }
  ],
  "quality_warnings": []
}
```

约束：

- 不要纠正学生原文。
- 不要补全图片中看不清的文字。
- 无法确认的词必须进入 `uncertain_spans`。
- 保留明显拼写错误。
- 保留原始段落和换行。
- 不输出 IELTS、托福、四六级或其他考试建议。
- 若完全无法识别，应返回空 `transcribed_text`、明确的 `quality_warnings`，前端提示用户重新拍照或改为手动输入。

OCR 伪影处理规则：

- 明显 OCR 伪影可以在 `ocr_result` 中标记为 `likely_ocr_artifact`，例如 `rn`/`m`、`cl`/`d`、`0`/`O` 等视觉相似误识别。
- 疑似 OCR 伪影必须进入 `uncertain_spans`，并在校对页提示用户确认。
- 不得把疑似 OCR 伪影直接当成学生拼写错误扣分。
- 不得把学生真实拼写错误静默修正后再诊断。
- 最终诊断必须基于用户确认后的 `confirmed_text`，不是未确认的 OCR 原始文本。

LLM OCR 容错提示原则：

```text
你将收到一段高考英语作文 OCR 识别文本。文本中可能存在少量机器识别伪影。
请只标记明显或疑似 OCR 伪影，不要把无法确认的片段静默改写成通顺文本。
明显 OCR 伪影不得计入学生拼写错误；疑似 OCR 伪影进入 uncertain_spans，交由用户在校对页确认。
所有输出必须围绕高考英语作文，不得使用 IELTS、托福或其他考试身份与评分标准。
```

## 9. AI 诊断 JSON Schema

```json
{
  "exam_type": "gaokao_english_composition",
  "score": {
    "estimated": 17,
    "max": 25,
    "confidence": "medium",
    "reason": "..."
  },
  "summary": {
    "strengths": [],
    "top_risks": [],
    "next_action": ""
  },
  "diagnosis_meta": {
    "ocr_artifacts": [
      {
        "text": "",
        "position_hint": "",
        "decision": "likely_ocr_artifact",
        "reason": ""
      }
    ],
    "uncertain_ocr_spans": []
  },
  "gaokao_dimensions": {
    "content_relevance": {
      "score": 4,
      "max": 5,
      "comment": ""
    },
    "structure_logic": {
      "score": 4,
      "max": 5,
      "comment": ""
    },
    "grammar_accuracy": {
      "score": 3,
      "max": 5,
      "comment": ""
    },
    "vocabulary_expression": {
      "score": 3,
      "max": 5,
      "comment": ""
    },
    "handwriting_or_format": {
      "score": 3,
      "max": 5,
      "comment": ""
    }
  },
  "highlight_spans": [
    {
      "start": 10,
      "end": 24,
      "severity": "major",
      "category": "grammar",
      "original": "",
      "suggestion": "",
      "explanation": ""
    }
  ],
  "logic_map": [
    {
      "paragraph": 1,
      "role": "opening",
      "issue": "",
      "suggestion": ""
    }
  ],
  "rewrites": {
    "safe_version": "",
    "advanced_version": ""
  },
  "study_plan": [
    {
      "priority": 1,
      "skill": "",
      "exercise": ""
    }
  ],
  "disclaimer": "本报告为 AI 辅助诊断，不承诺高考提分或最终得分。"
}
```

评分规则：

- 首版默认支持 25 分制，全国卷书面表达按 `max_score = 25` 处理。
- 若后续支持 20 分制省份，必须通过 `max_score` 配置进入诊断任务，不得前端自行换算。
- `gaokao_dimensions` 中各维度分值仅用于解释，不作为所有地区统一官方评分细则。

输入方式差异：

- `source_type = image` 时，`handwriting_or_format` 可评价书写可读性、卷面整洁度和段落格式。
- `source_type = text` 时，`handwriting_or_format` 只能评价格式规范、大小写、标点和段落，不得评价书写质量；无法评价的子项标记为 `N/A`。

OCR 容错诊断规则：

- `diagnose_essay` 的输入必须优先使用用户确认后的 `confirmed_text`。
- 如果 `ocr_result` 中仍有 `uncertain_spans` 未被用户确认，报告必须在 `diagnosis_meta.uncertain_ocr_spans` 中保留说明。
- LLM 不得静默修复疑似 OCR 错误后直接评分。
- 明显 OCR 伪影不得计入学生拼写错误或语法错误。
- 无法判断是 OCR 伪影还是学生真实错误时，必须降低判断置信度，并在报告中标记为不确定，不得作为重点扣分项。
- 诊断 Prompt 必须使用高考英语作文身份，不得出现“剑桥雅思考官”“IELTS examiner”等非高考场景人设。

高亮后处理：

- AI 可返回 `start/end`，但后端不得直接信任偏移量。
- `diagnose_essay` 必须增加后处理步骤：优先用 `original` 在 `confirmed_text` 中做精确匹配；失败后做模糊匹配并重新计算 `start/end`。
- 若 `original` 仍无法匹配，降级为段落级提示或不高亮该 span，并在结果中标记 `position_status = "unresolved"`。
- 前端遇到 `position_status = "unresolved"` 时显示“此问题位置未精确定位”。

## 10. 前端展示要求

### 10.1 输入页

- 上传区上方必须显著显示：`本服务为 AI 自动生成诊断报告，不逐篇人工批改；订单异常支持一键自助重试/退款。`
- 文本输入和图片上传并列。
- 文案必须明确为“高考英语作文诊断”。
- 图片上传后必须进入校对页。
- 显示隐私提示：作文内容仅用于生成本次诊断，未经授权不会公开展示。

### 10.2 校对页

- 左侧显示原图，原图通过短期签名 URL 加载。
- 右侧显示识别文本编辑器。
- 低置信词用下划线或浅色背景标记。
- 按钮：
  - 重新识别。
  - 确认并诊断。
  - 改为手动输入。
- 用户确认文本后，后端生成并保存 `confirmed_text_hash`，用于免费层去重和缓存。

### 10.3 报告页

- 报告等待状态必须显示 AI 自动服务说明：`AI 自动生成，不逐篇人工批改；异常支持自助重试/退款。`
- 报告等待超过 60 秒或状态为 `FAILED` 时显示 `智能申诉与重试` 按钮。
- 按钮下方显示说明：`系统将自动检查支付、任务和报告状态；仍无法生成时自动退款。`
- 报告等待页和报告页底部必须提供 `订单异常 / 申请退款` 入口；入口不得刻意隐藏，也不得暗示用户放弃投诉、退款或售后权利。
- 免费层：
  - 预估分。
  - 置信度。
  - 3 个主要风险类型和严重度。
  - 最多 1 个不超过 20 个英文词的短原文片段。
  - 不展示具体修改建议、替换句、完整解释、范文、逻辑图或 AI 演算母题库。
- 付费层：
  - 高考评分维度拆解。
  - 全文荧光笔标注。
  - 逐条解释。
  - 逻辑脉络图。
  - 稳健版范文。
  - 进阶版范文。
  - AI 演算母题库。

### 10.4 支付页

- 价格按钮附近必须显示：`本服务为 AI 自动生成诊断报告，不逐篇人工批改；订单异常支持一键自助重试/退款。`
- 支付页必须提供退款规则入口。
- 支付页必须提供 `订单异常 / 申请退款` 或 `查看退款规则` 入口。
- 不得使用“拒绝售后”“不接受退款”“最终解释权归平台所有”等排除用户权利的表达。

### 10.5 退款规则页

- 必须说明 AI 自动服务范围、未出报告的自助处理流程、自动退款条件和预计到账说明。
- 必须显示 `智能申诉与重试` 的触发条件：已支付但报告未生成、报告生成失败、支付成功但权限未解锁。
- 必须说明 `订单异常 / 申请退款` 会先检查支付、任务和报告状态；符合未交付条件时自动退款；已完整生成并解锁的报告不承诺无条件秒退。
- 必须说明退款不影响用户删除作文、图片和诊断记录的权利。

### 10.6 AI 自助助手

- 前端右下角可提供 `AI 自助助手`，但不得遮挡上传、支付、报告和退款入口。
- 首屏提示：`AI 助手仅协助处理上传、识别、报告生成和退款进度问题；订单处理以系统状态为准。`
- 助手可展示建议动作按钮：`查看上传说明`、`检查报告状态`、`智能申诉与重试`、`查看退款规则`。
- 助手不得展示“高考提分保证”“名师人工批改”“内部阅卷”等违规表述。

### 10.7 荧光笔组件

输入：

- 原文。
- `highlight_spans`。

要求：

- 根据字符区间渲染高亮。
- 不允许高亮区间越界。
- 若 AI 返回区间与原文不匹配，后端应尝试按 `original` 字段回退匹配。
- 前端需兼容空高亮。

## 11. 后台任务

### 11.1 recognize_image

输入：`draft_id`

步骤：

1. 读取 `essay_drafts.original_image_object_id`。
2. 通过 storage adapter 获取短期签名 URL 或文件流。
3. 校验对象元数据与 `upload_intent` 一致，包括 `Content-Type`、`size_bytes` 和 `object_key`。
4. 可选执行 magic bytes 文件头校验，防止伪装成图片的异常文件进入 OCR provider。
5. 调用 OCR adapter。正式高并发场景优先使用 `tencent_ocr`、`baidu_handwriting`、`google_vision` 等专业 OCR provider；`openai_vision` / `gpt-5.5` 可作为 fallback 或高质量复核 provider。
6. 将 provider 原始输出标准化为 `ocr_result`，包含 `transcribed_text`、`line_items`、`uncertain_spans`、`quality_warnings` 和可选 `likely_ocr_artifacts`。
7. 校验识别 JSON。
8. 写入 `transcribed_text`、完整 `ocr_result` 和识别状态。
9. 不直接创建诊断任务，必须等待用户在校对页确认文本。

### 11.2 expire_upload_intents

触发：每 5 分钟。

步骤：

1. 查询已过期且状态为 `PENDING` 的 `upload_intents`。
2. 将状态更新为 `EXPIRED`。
3. 若云存储中存在对应对象但未完成确认，将对象加入删除队列。
4. 写入审计日志。

### 11.3 expire_unpaid_orders

触发：每 5 分钟。

步骤：

1. 查询 `expires_at < now()` 且状态为 `PENDING` 的订单。
2. 将订单状态更新为 `EXPIRED`。
3. 若实现中存在商户额度预占，释放对应预占额度。
4. 写入审计日志。

### 11.4 reset_merchant_daily_usage

触发：每日 UTC+8 00:00。

步骤：

1. 将 `merchant_accounts.daily_used_cents` 重置为 0。
2. 保留商户号人工状态，不自动恢复 `DISABLED`。
3. 写入审计日志。

### 11.5 diagnose_essay

输入：`report_id`

步骤：

1. 读取 `confirmed_text`。
2. 生成或读取 `confirmed_text_hash`；若同一 hash 的免费摘要仍在缓存期内，可复用免费摘要，避免重复消耗 LLM。
3. 若存在 `ocr_result`，读取其中的 `uncertain_spans` 和 `likely_ocr_artifacts` 作为诊断上下文。
4. 通过 `LLMRouter` 调用 AI 诊断，不得直接调用单一 provider。Prompt 必须要求模型区分明显 OCR 伪影、疑似 OCR 片段和学生真实错误，不得静默修复后评分。
5. 校验 JSON schema。
6. 对 `highlight_spans` 执行 `original` 精确匹配、模糊匹配和偏移量修正。
7. 记录 `model_version`、`prompt_version`、token 用量和 `latency_ms`。
8. 写入 `free_summary` 和 `full_report`；`free_summary` 必须遵守免费层展示边界。
9. 更新状态为 `COMPLETED`。
10. 失败时记录 `error_message`，不在该任务内无限重试；重试由 `retry_failed_report` 统一控制。

### 11.6 select_merchant_account

输入：`amount_cents`

步骤：

1. 读取 `merchant_accounts` 中可用账号。
2. 排除 `DISABLED`、`LIMITED` 和当日额度不足账号。
3. 按 `PAYMENT_ROUTER_MODE` 选择账号。
4. 返回 `merchant_account_id`。
5. 写入审计日志。

### 11.7 unlock_report

输入：`order_id`

步骤：

1. 校验订单已支付。
2. 设置 `diagnosis_reports.is_unlocked = true`。
3. 写入 `audit_logs`。

### 11.8 smart_appeal_report

输入：`report_id`

步骤：

1. 查询报告、订单和用户权限状态。
2. 写入 `support_actions.action = 'SMART_APPEAL_CLICKED'`。
3. 若订单存在且未确认支付，使用订单绑定商户号同步支付状态。
4. 若报告已 `COMPLETED`，返回“报告已生成”，不触发重试或退款。
5. 若订单未支付，返回“尚未确认支付”，不触发诊断重试。
6. 若订单已支付且报告未启动，入队 `diagnose_essay`。
7. 若报告失败且 `retry_count < REPORT_MAX_RETRY_COUNT`，入队 `retry_failed_report`。
8. 若订单已支付超过 `REPORT_AUTO_REFUND_AFTER_SECONDS` 且仍无完整报告，入队 `auto_refund_unfulfilled_order`。
9. 返回当前订单状态、报告状态、是否触发重试、是否触发退款。

### 11.9 retry_failed_report

输入：`report_id`

步骤：

1. 加锁读取 `diagnosis_reports`。
2. 若报告已完成，直接退出。
3. 若 `retry_count >= REPORT_MAX_RETRY_COUNT`，不再重试。
4. 增加 `retry_count`，写入 `last_retry_at`。
5. 重新入队或直接调用 `diagnose_essay`。
6. 写入 `support_actions.action = 'REPORT_RETRY_TRIGGERED'`。

### 11.10 auto_refund_unfulfilled_order

输入：`order_id`

步骤：

1. 加锁读取订单和报告。
2. 若订单不是已支付状态，退出。
3. 若报告已生成并已解锁，退出。
4. 若 `refund_status` 已为 `REQUESTED` 或 `REFUNDED`，幂等退出。
5. 将 `refund_status` 更新为 `REQUESTED`。
6. 使用订单绑定的 `merchant_account_id` 发起退款，不重新轮询商户号。
7. 退款成功后，将订单 `status` 更新为 `REFUNDED`，`refund_status` 更新为 `REFUNDED`，写入 `refunded_at`，报告保持锁定。
8. 退款失败后，将 `refund_status` 更新为 `REFUND_FAILED`，写入失败原因；用户端显示“退款处理中”，后台异常列表可见。
9. 写入 `support_actions.action = 'AUTO_REFUND_TRIGGERED'` 和退款结果。

### 11.11 platform_assist_groups

触发：每 5 分钟。

步骤：

1. 查询 5 分钟内过期、缺 1 人、允许官方助力的三人同学组队。
2. 插入 `PLATFORM_ASSIST` 成员。
3. 该成员必须在前端和后台显示为“官方助力名额”，不得生成头像、昵称、班级、同学动态或伪装成真实用户。
4. 若真实成员均已按组队价支付，更新团状态为 `SUCCESS`。
5. 解锁已支付真实用户的各自报告。
6. 写入审计日志。

### 11.12 refresh_merchant_health

触发：每 5 分钟。

步骤：

1. 汇总近 1 小时支付成功率和失败次数。
2. 更新 `merchant_accounts.success_rate_1h`。
3. 若失败率过高，自动标记为 `LIMITED` 或通知管理员。
4. 不自动重新启用被人工禁用的商户号。

### 11.13 emit_conversion_event

触发：订单由支付 webhook 或订单同步确认进入 `PAID` 后，由 `critical` 队列 worker 触发。

步骤：

1. 读取订单绑定的 `attribution_id`、`user_id`、`amount_cents`、`merchant_account_id`。
2. 幂等创建 `conversion_events`，同一 `order_id + event_name` 只能创建一次有效事件。
3. 若 `NEXT_PUBLIC_ENABLE_AD_PIXELS=false` 且未配置 server-side conversion provider，仅写入本地 `conversion_events`，不向第三方广告平台发送。
4. 若启用第三方 server-side conversion，只发送平台允许的最小必要字段：订单金额、币种、事件时间、去标识化 click id 或平台 click id；不得发送作文文本、图片对象 key、诊断报告、手机号/邮箱明文、未成年人身份信息。
5. 第三方回传失败只更新 `conversion_events.delivery_status = FAILED` 和错误摘要，不影响订单解锁、报告展示、退款或用户权益。
6. 前端 Pixel 事件只能作为辅助信号；不得用前端 Pixel 触发订单解锁、收入统计或用户权益发放。

### 11.14 support_chat_response

触发：用户在 `AI 自助助手` 中发送消息。

步骤：

1. 写入 `support_actions.action = 'AI_SUPPORT_MESSAGE_SENT'`，记录 `report_id`、`order_id`、用户/session 和脱敏后的问题摘要。
2. 对用户消息做敏感信息过滤；不得把作文原文、图片、手机号/邮箱明文、支付流水号、身份证、准考证等非必要敏感信息发送给 LLM provider。
3. 根据用户问题分类：上传帮助、OCR 校对、报告等待、订单状态、退款规则、历史报告、隐私删除。
4. 如需状态查询，只调用受控工具读取订单/报告/退款状态摘要。
5. 如用户要求“退款”或“未出报告”，助手只能引导或触发 `smart_appeal_report` / `refund-request` 接口；是否退款由订单状态机决定。
6. 返回简短答复和 `suggested_actions`，不输出提分承诺、最终成绩预测或人工批改暗示。
7. 写入工具调用和最终回复摘要，便于后台排查重复问题。

## 12. 安全与合规要求

### 12.1 内容与消费者权益

- 不使用“保分、提分、阅卷组内部、名师亲批”等表达。
- 不使用“满分绝密、提分秘籍、致命丢分点”等夸大、恐吓或误导性教育营销表达。
- 不暗示考试机构、命题人员、阅卷人员参与。
- 不使用“多商户号规避风控”“欺骗风控”“养号”等表达或做法。
- 不得通过亲友自交易、虚假交易、跨主体混收制造流水或规避支付平台审查。
- 不将学生作文自动公开为营销素材或 SEO 内容。
- 默认不向第三方营销系统同步诊断数据。
- 默认关闭广告 Pixel 和 server-side conversion；启用前必须确认广告平台、隐私说明、数据最小化字段和关闭开关。
- UTM 归因只用于统计渠道效果，不得用于歧视性定价、诱导未成年人过度消费或绕过平台政策。
- 向广告平台回传转化时，不得包含作文文本、图片、诊断结果、手机号/邮箱明文、未成年人身份信息或任何可直接识别学生的内容。
- 默认不使用学生作文、图片、诊断结果进行模型训练、微调、训练集沉淀或 Data Lake 汇集。
- 首版仅为服务交付保存必要数据：作文文本、图片对象 key、诊断结果、订单和审计日志。保留期限、删除入口和删除队列必须可配置。
- 未来若要将学生作文用于模型改进、统计研究、营销案例或训练数据，必须另行取得明确同意，并先完成去标识化；不得把服务使用同意默认解释为训练同意。
- 若涉及未成年人，需在注册或提交前显示监护人同意提示。
- 允许用户删除作文、图片和诊断记录。
- 删除图片时必须同时删除云存储对象或标记进入删除队列。
- 管理后台不得展示完整手机号、邮箱等敏感字段，除非必要。
- 商户号密钥不得明文入库。
- 可以显著说明“AI 自动生成，不逐篇人工批改”，但不得写成免除售后、退款、投诉责任的格式条款。
- 前端和规则页不得出现“拒绝售后”“不接受退款”“最终解释权归平台所有”等排除用户权利的表达。
- 退款规则页必须可访问，并说明未出报告时的自助重试、自动退款和异常处理流程。
- `订单异常 / 申请退款` 入口必须清晰可见，不得刻意隐藏；但系统不得承诺“无条件秒退”或“100% 消除投诉”。
- AI 自助助手不得替代售后责任，不得直接决定退款、解锁、补位或订单修改；所有权益变更必须走服务端状态机。
- AI 自助助手不得要求或保存身份证、准考证、学校班级等非必要敏感信息。

### 12.2 CORS 与鉴权

- 生产环境 CORS 必须使用 `ALLOWED_CORS_ORIGINS` 白名单，不得使用 `allow_origins=["*"]`。
- 默认允许域名：`https://qqbytop.com`、`https://www.qqbytop.com`。
- 本地开发域名只能通过环境变量显式加入。
- 所有创建草稿、上传意图、确认上传、识别、诊断、订单、智能申诉接口都必须校验登录态或短期 `draft_token`。
- `draft_token` 默认有效期 15 分钟，绑定 `draft_id`、用户/session、IP 粗粒度指纹和 user-agent 摘要。
- 前端可见的固定请求头 token 不能作为防白嫖主方案。
- 免费入口必须支持 Turnstile/验证码开关，用于突发刷量时启用。

### 12.3 防刷与成本熔断

- 诊断接口必须按 IP、用户/session、draft、手机号/订单维度组合限流，不能只依赖单 IP。
- 免费预览、图片识别、完整报告使用独立额度。
- 同一 draft 不允许并发创建多个识别或诊断任务。
- AI 调用必须有每日预算熔断配置，超过预算后免费任务暂停，付费任务保留。
- LLM provider 必须有独立 RPM/TPM、错误率、timeout 和预算统计。
- 任一 LLM provider 在 `LLM_CIRCUIT_BREAKER_WINDOW_SECONDS` 窗口内错误率超过阈值时，必须短期熔断并切换 fallback。
- 不得把单次诊断成本、响应时间或 provider 可用性写成固定承诺；前端只能展示排队/处理中状态。
- 队列超过 `DIAGNOSIS_QUEUE_HARD_LIMIT` 时，不再创建免费诊断任务。
- 支付 Webhook、订单同步、退款任务不得被普通诊断任务挤占资源。

默认限流建议值：

```text
FREE_DIAGNOSIS_RATE_LIMIT=3/IP/hour
PAID_DIAGNOSIS_RATE_LIMIT=10/user/hour
UPLOAD_INTENT_RATE_LIMIT=5/draft/hour
SMART_APPEAL_RATE_LIMIT=5/user/hour
WEBHOOK_RATE_LIMIT=100/merchant/minute
```

以上为首版默认值，可通过环境变量调整；Webhook 限流必须按商户号和签名校验结果综合判断，不能阻断合法支付回调。

## 13. 性能目标

首版目标按小规模验证设计：

- 文本诊断任务：P95 完成时间小于 90 秒。
- 图片识别任务：P95 完成时间小于 60 秒。
- 同时诊断任务：30 个。
- 支付 Webhook：P95 响应小于 800ms。
- 报告页首屏加载：P95 小于 2 秒。
- 预签名上传 URL 签发：P95 小于 500ms。
- 创建诊断任务接口：P95 小于 800ms，不同步等待大模型。

单台 4核8GB 正式部署限制：

- 不在 Web 进程中执行长任务。
- 首版正式环境按单台 4核8GB 国内 VPS 规划，并外置托管 PostgreSQL、对象存储和 AI/OCR API。
- 2核4G 仅作为开发、测试或低流量灰度参考，不作为正式收费环境基线。
- 图片上传大小限制为 8MB。
- 单篇作文文本限制为 350 英文词，超过后提示用户裁剪为高考作文长度。
- 对图片识别和诊断接口做用户/IP 级限流。
- 图片必须由浏览器直传云存储，VPS 不承载图片上传带宽。
- 兼容调试上传接口若启用，本地临时文件必须在请求结束前删除。
- 普通诊断接口拥塞时返回排队状态或 429，不阻塞 Webhook。
- Webhook 路由必须使用独立限流策略，不受普通 API 限流池影响。

Serverless 限制：

- 单个请求不得依赖超过 20 秒的同步执行。
- 图片识别和诊断必须通过任务状态轮询完成。
- Webhook、订单查询、报告查询必须无状态。
- 智能申诉接口不得同步执行完整诊断或退款长流程，只能同步状态、写入动作、触发队列任务。
- 自动退款阈值默认 300 秒，由 `REPORT_AUTO_REFUND_AFTER_SECONDS` 控制。
- 报告最多自动重试 2 次，由 `REPORT_MAX_RETRY_COUNT` 控制。

前端轮询策略：

- 报告创建后前 30 秒，每 3 秒轮询一次。
- 30-60 秒，每 5 秒轮询一次。
- 60 秒后，每 10 秒轮询一次，并显示 `智能申诉与重试`。
- 5 分钟后停止自动轮询，提示用户点击 `智能申诉与重试` 或手动刷新。
- SSE/WebSocket 作为后续优化，不进入首版必做，也不得成为解锁正确性的唯一依赖。
- 若后续加入实时解锁，数据库订单/团/报告状态仍是唯一事实来源；Redis Pub/Sub 只能做通知加速，不能作为关键解锁事件的唯一存储。关键事件必须写数据库或进入可重放队列/事件流。

## 14. 验收标准

### 14.1 功能验收

- 用户可以粘贴高考英语作文并生成报告。
- 用户可以请求预签名上传 URL，并由浏览器直传图片到云存储。
- 用户完成直传后，后端校验 `upload_intent_id`、`object_key` 和对象元数据，生成 `storage_objects` 记录。
- 生产环境不得要求图片先上传到 Vercel API 或 VPS 再转存云存储。
- 文本输入创建草稿后直接创建诊断任务，不进入校对页。
- 图片输入必须先创建 `source_type = image` 的空草稿，再创建上传意图。
- 用户可以在识别后校对文本。
- 用户必须确认文本后才能诊断。
- 确认文本后生成 `confirmed_text_hash`，同一作文免费摘要优先复用缓存。
- 免费报告和完整报告权限区分正确。
- 免费报告只展示预估分、置信度、风险类型/严重度和最多 1 个短片段，不泄漏修改建议、范文、逻辑图或逐句批注。
- 创建订单时成功选择商户号。
- 支付回调使用订单绑定商户号完成验签。
- 支付成功后自动解锁。
- 支付成功但前端未刷新的用户可以手动补单。
- 报告等待页和支付页显著显示 AI 自动服务说明。
- 报告等待超过 60 秒或状态失败时，用户可以点击 `智能申诉与重试`。
- 报告等待页、报告页底部、支付页和退款规则页提供 `订单异常 / 申请退款` 或等价清晰入口。
- 报告正常生成后点击 `智能申诉与重试`，系统返回“报告已生成”，不触发退款。
- 报告已完整生成并解锁时点击退款入口，不自动秒退，返回退款规则说明并写入 `support_actions`。
- 已支付但任务未启动时，`智能申诉与重试` 会触发诊断任务入队。
- 任务失败且未超过重试次数时，`智能申诉与重试` 会触发重试并增加 `retry_count`。
- 支付超过 5 分钟仍未出完整报告时，系统自动发起退款。
- 退款失败时，订单进入 `REFUND_FAILED`，后台可见，用户端显示“退款处理中”。
- 独立抢分包为 `￥99.00/20篇`，三人同学组队价为 `￥53.00/人/20篇`；当前报告占用 1 篇额度，剩余额度可用于后续报告。
- 官方助力名额在数据库中标记为 `PLATFORM_ASSIST`，仅作为内部兜底和审计记录，不展示为真实成员。
- 前端不展示虚假真实用户参团信息。
- 组队活动不得展示虚假锚定价、虚构稀缺、虚构同学动态或高压恐吓文案。
- 首版支付/组队解锁必须通过 HTTP 轮询或手动补单可达，不依赖 WebSocket 才能正确解锁。
- 未解锁报告接口服务端强制返回 `full_report: null`。
- 登录用户可以进入 `/tools/gaokao-english-essay-diagnosis/my-reports` 查看历史报告。
- 前端可提供 AI 自助助手，能回答上传、OCR、报告等待、退款规则和报告找回问题。
- AI 自助助手触发状态检查或智能申诉时，必须通过受控工具和后端状态机完成，不直接修改订单或报告。
- 用户首次进入时可捕获 UTM/referrer/landing_path 并生成 `marketing_attributions` 记录。
- 文本 draft、图片 draft 和订单可绑定同一个 `attribution_id`。
- 支付成功后由后端 worker 幂等创建 `conversion_events`。
- 关闭前端 Pixel 或第三方回传时，订单解锁和本地转化统计仍正常。
- 后台可按 UTM、`product_type`、`source_type` 和时间范围查看访问、草稿、报告、解锁点击、订单、支付、退款和净收入漏斗。

### 14.2 工程验收

- AI 输出 JSON 经过 schema 校验。
- 支付 Webhook 幂等。
- 后台任务失败可重试。
- 关键状态变更写入审计日志。
- 业务逻辑可被 FastAPI route 和 Serverless handler 共同调用。
- 本地文件系统不是图片、任务、订单状态的持久化依赖。
- 诊断创建接口只入队，不同步调用大模型。
- Webhook 使用独立限流策略，不受普通诊断接口拥塞影响。
- CORS 白名单不允许 `*`。
- 创建草稿、上传意图、确认上传、诊断和订单接口必须校验登录态或短期 `draft_token`。
- 至少有以下测试：
  - 高考诊断 JSON schema 校验测试。
  - 纯文本输入直达诊断测试。
  - `confirmed_text_hash` 生成和免费摘要缓存复用测试。
  - 免费层展示边界测试。
  - 图片输入先创建 draft 再创建 upload intent 测试。
  - 高亮区间渲染测试。
  - 高亮偏移量后处理测试。
  - 预签名上传意图创建测试。
  - 上传完成 object key 归属校验测试。
  - 图片上传云存储 adapter 测试。
  - CORS 白名单配置测试。
  - draft token 过期和错配测试。
  - 队列硬阈值返回 429 测试。
  - LLMRouter provider fallback 测试。
  - LLM provider 429/503/timeout 熔断测试。
  - LLM JSON schema 失败重试和 fallback 测试。
  - LLM 每日预算熔断测试。
  - 禁止通过 API Key 池规避限流的配置审查测试。
  - 支付 Webhook 幂等测试。
  - Webhook 独立限流测试。
  - Webhook 最小事务、写入 `payment_events`、入 `critical` 队列测试。
  - 重复/乱序 Webhook 不重复解锁、不重复退款测试。
  - 商户主体、备案主体、收款主体一致性配置审查测试。
  - UTM first-touch 归因持久化测试。
  - `attribution_id` 绑定 draft/order 测试。
  - 支付成功后幂等创建 `conversion_events` 测试。
  - 前端 Pixel 默认关闭测试。
  - 转化回传 payload 不包含作文、图片、报告、手机号/邮箱明文测试。
  - 商户号轮询选择测试。
  - 商户号 `daily_used_cents` 原子累加测试。
  - 未支付订单过期测试。
  - 未解锁报告服务端隐藏 `full_report` 测试。
  - 智能申诉幂等测试。
  - 未出报告先重试后退款测试。
  - 自助退款入口已生成报告不自动秒退测试。
  - 自助退款重复点击幂等测试。
  - AI 自助助手不直接退款、不直接解锁测试。
  - AI 自助助手敏感信息最小化测试。
  - 退款失败状态展示测试。
  - Webhook 与智能申诉并发测试。
  - 前端禁用排除售后责任文案测试。
  - 前端禁用夸大恐吓式教育营销文案测试。
  - 三人同学组队价与官方助力规则测试。
  - 后台转化漏斗聚合测试。
  - 无 WebSocket 环境下支付/组队解锁轮询测试。
  - 学生作文默认不进入训练、营销同步或 Data Lake 的配置测试。
  - Serverless handler 调用 service 的最小测试。

### 14.3 上线前检查

- OpenAI API key 不出现在前端代码。
- 支付密钥只在服务端环境变量或密钥管理服务中。
- Supabase RLS 策略已启用。
- 上传图片和作文文本有删除入口。
- 隐私政策、退款规则、三人同学组队价与官方助力规则页面可访问。
- 隐私政策必须明确默认不将学生作文、图片和诊断结果用于模型训练、微调、营销案例或公开 SEO 内容。
- 退款规则页包含 AI 自动服务说明、一键自助重试/退款流程和自动退款条件。
- 报告等待页、报告页、支付页和退款规则页存在清晰的订单异常/退款入口。
- 退款规则页说明已完整生成并解锁的报告不承诺无条件秒退。
- AI 自助助手说明“订单处理以系统状态为准”，不得承诺提分、保分或人工批改。
- 所有页面文案都聚焦高考英语作文，没有 IELTS 或其他考试残留。
- 所有显著位置使用统一文案：`AI 自动生成，不逐篇人工批改；异常支持自助重试/退款。`
- 生产环境 `ALLOWED_CORS_ORIGINS` 不包含 `*`。
- 免费入口 Turnstile/验证码开关可配置。
- 诊断队列软硬阈值已配置并可在后台观察。
- `merchant_code` 只包含小写字母、数字和下划线。
- 订单过期任务和商户号每日额度重置任务已配置。
- 报告轮询策略已按 3s/5s/10s 阶梯实现。
- 至少配置 2 个商户号，其中 1 个可设置为 `DRAINING` 验证切换。
- 支付平台后台已配置支付域名和 webhook 域名。
- 已准备业务说明、退款规则、客服入口、支付/收款/退款主体说明。
- 至少验证 1 次 Serverless handler 路径能复用核心 service。

## 15. 开发顺序

1. 初始化 Next.js + FastAPI + Supabase。
2. 建表和基础环境变量。
3. 实现 storage adapter，并接入 Supabase Storage 或 S3 兼容对象存储。
4. 实现 `upload_intents`、预签名 URL 签发、直传完成确认和对象归属校验。
5. 实现文本草稿创建、短期 `draft_token`、CORS 白名单和基础限流。
6. 实现 OCR adapter 图片识别任务和识别结果轮询；首版可用 `gpt-5.5`，正式高并发场景优先接入专业 OCR provider。
7. 实现诊断队列、排队状态、软硬阈值和高考作文诊断 JSON schema 校验。
8. 实现报告页和荧光笔组件。
9. 实现 UTM 归因采集、`marketing_attributions` 和订单归因绑定。
10. 实现 merchant account 表、选择器和后台状态页。
11. 实现支付订单、商户号绑定、Webhook 独立限流和订单同步。
12. 支付成功后实现报告解锁和 `conversion_events` 幂等记录；第三方 Pixel/server-side conversion 默认关闭。
13. 实现 `smart-appeal`、自助退款入口、重试任务、自动退款任务和 `support_actions`。
14. 实现 AI 自助助手及受控工具调用边界。
15. 实现三人同学组队价与官方助力名额机制。
16. 抽象 FastAPI route 与 Serverless handler 共用的 service。
17. 实现管理后台。
18. 补测试、限流、日志、隐私、退款页面和 AI 自动服务显著提示。

## 16. 非目标

以下内容不进入首版 MVP：

- IELTS、托福、四六级、考研英语等其他考试。
- 自动开票。
- 大规模 SEO 页面生成。
- 自动营销图生产线。
- 多模型并行对比路由（同一篇作文同时发给多个模型打分后择优）；不包括 `LLMRouter` 的合规 fallback。
- 真实阅卷老师入驻。
- 成绩预测承诺。
