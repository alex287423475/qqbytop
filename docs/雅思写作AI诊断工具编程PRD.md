# 雅思写作 AI 诊断工具编程 PRD

版本：V1.0  
日期：2026-05-09  
产品形态：纯 Web C 端独立产品  
前端栈：Next.js App Router + React Client Components + Tailwind CSS  
后端栈：FastAPI + PostgreSQL + Redis + Worker  
部署建议：Vercel 前端 + 腾讯云 VPS 后端  

> 给开发实现者的硬性提示：
>
> 本 PRD 是可直接指导编程的实现文档。开发时不要把本工具做成口语诊断的赠品页，也不要把口语点数和写作点数混用。V1 只做纯 Web 雅思写作诊断，不做小程序、不做 OCR、不做 Streamlit、不做 B 端老师工作台、不做 LangGraph。所有深度报告内容必须由服务端权限控制，未解锁用户不得从接口拿到 `deep_result_json`。
>
> **审查修订决策：** 写作工具作为独立产品售卖，但共享 IELTS Platform 的后端基础设施。后端部署路径为 `/opt/ielts-platform-api`，端口 `8710`，API 统一使用 `/api/v1/*`。写作和口语共享 users、auth、orders、payments、credit_ledger；写作业务模块、报告内容和点数字段保持独立。

---

## 1. 产品定义

### 1.1 产品定位

面向 C 端雅思考生的 AI 写作诊断工具。用户粘贴 IELTS Writing Task 1 或 Task 2 作文后，系统先生成免费基础报告；用户登录并购买点数后，可解锁深度报告，包括四项评分、逐句批改、段落逻辑诊断、高分表达替换和 Band 7+ 改写示例。

一句话定位：

```text
30 秒定位雅思写作扣分点，按 IELTS 四项标准生成可执行提分建议。
```

### 1.2 商业目标

V1 验证下面这条最小商业闭环：

```text
SEO / 小红书 / 题库页
→ 用户粘贴作文
→ 免费基础诊断
→ 报告页建立信任
→ 登录/购买写作深度诊断点数
→ 解锁深度报告
→ 历史报告与错题本促进复购
```

### 1.3 V1 成功指标

| 指标 | V1 目标 |
|---|---:|
| 首页作文提交率 | >= 8% |
| 基础报告生成成功率 | >= 95% |
| 基础报告到深度解锁转化率 | >= 3% |
| 首单用户购买 5 次包占比 | >= 25% |
| 深度报告生成成功率 | >= 90% |
| LLM 结构化输出解析成功率 | >= 98% |
| 支付 webhook 处理成功率 | >= 99% |
| 退款/投诉率 | <= 3% |

---

## 2. 用户与场景

### 2.1 目标用户

- 雅思写作目标分 6.0-7.0 的备考用户。
- 当前写作长期卡在 5.0-6.5 的用户。
- 考前 2-8 周需要高频作文反馈的用户。
- 不想每篇花几十到上百元找人工批改的用户。

### 2.2 用户痛点

- 写完作文不知道真实分数。
- 不知道 Task Response、Coherence and Cohesion、Lexical Resource、Grammar Range and Accuracy 哪项拖后腿。
- 找 AI 改作文容易得到泛泛建议或虚高分。
- 人工批改贵、慢，且批改风格不稳定。
- 不知道下一篇该练什么，复盘资料分散。

### 2.3 用户故事

1. 作为备考用户，我想不登录先粘贴一篇作文，快速看到大概分数和主要扣分点。
2. 作为备考用户，我想看到四项评分，而不是只看到一个总分。
3. 作为付费用户，我想看到逐句批改和高分改写，知道每个错误怎么改。
4. 作为复购用户，我想保存历史作文和高频错误，考前集中复习。
5. 作为系统运营者，我想清楚记录每次点数发放、扣减、订单和报告解锁，避免支付纠纷。

---

## 3. 产品范围

### 3.1 V1 必做

- 纯 Web 首页与作文输入。
- Task 1 / Task 2 类型选择。
- 可选题目输入。
- 匿名基础诊断。
- 报告页。
- 深度报告锁定与解锁。
- 用户登录。
- 写作点数系统。
- 套餐购买。
- 官方支付接口预留：微信 Native、支付宝电脑网站支付/当面付。
- 订单 webhook 幂等处理。
- 历史报告列表。
- 用户中心。
- 题库 SEO 页面基础结构。

### 3.2 V1 不做

- 口语诊断。
- 口语与写作共享点数。
- 微信小程序。
- OCR 拍照识别。
- Word / PDF 上传解析。
- B 端老师工作台。
- Streamlit 审核台。
- LangGraph。
- 无限次包月。
- 官方雅思授权暗示。
- Band 9 保证、保分、保提分承诺。
- AI 生成检测。

---

## 4. 信息架构与前端页面

### 4.1 前端路由

建议路径：

```text
/tools/ielts-writing
/tools/ielts-writing/report/[reportId]
/tools/ielts-writing/pricing
/tools/ielts-writing/profile
/tools/ielts-writing/topics
/tools/ielts-writing/topics/[topicSlug]
/tools/ielts-writing/login
```

如后续需要保持工具族统一，可将 API 代理放在：

```text
/tools/ielts-writing-api/*
```

### 4.2 首页 `/tools/ielts-writing`

#### 页面目标

用户在 10 秒内理解工具价值，并完成作文提交。

#### 首屏结构

```text
Header
  Logo
  题库
  套餐
  我的报告
  登录/头像

Hero
  H1: 雅思写作 AI 诊断，30 秒找出你的扣分点
  Subtitle: 按 IELTS Writing 四项标准分析 Task 1 / Task 2，先免费查看基础报告

EssayInputPanel
  Task 类型 segmented control: Task 1 / Task 2
  题目输入 textarea，可选
  作文输入 textarea，必填
  字数统计
  免费诊断按钮
  输入边界提示

TrustStrip
  四项评分
  逐句批改
  高分改写
  历史复盘
```

#### 输入校验

前端校验：

```text
content 字符数 >= 80
content 字符数 <= 15000
英文词数建议 >= 120
Task 2 推荐 >= 250 words
Task 1 推荐 >= 150 words
```

后端必须重复校验，不能只信前端。

#### 状态

```text
idle
validating
submitting
queued
failed
```

提交成功后跳转：

```text
/tools/ielts-writing/report/[reportId]
```

### 4.3 报告页 `/tools/ielts-writing/report/[reportId]`

#### 页面目标

免费报告给足信任，深度模块促进付费。

#### 报告页布局

```text
ReportHeader
  预估分区间
  Task 类型
  字数
  报告生成状态

ScoreRadar
  TR
  CC
  LR
  GRA

BasicFindings
  是否偏题
  结构完整度
  3 个主要扣分点
  1 个句子修改示例

DeepReportGate
  深度报告锁定摘要
  解锁当前报告 CTA
  购买套餐 CTA

DeepReportContent unlocked only
  四项细分评分
  逐段诊断
  逐句批改
  高分词汇替换
  Band 7+ 改写示例
  下一篇练习建议
```

#### 权限硬规则

未解锁时，接口只返回：

```json
{
  "basic": {},
  "deep": null,
  "deep_status": "locked",
  "unlocked": false
}
```

严禁把 `deep_result_json` 返回前端后再用 CSS 模糊隐藏。

#### 轮询逻辑

V1 优先用轮询，不强制 SSE：

```text
GET /api/v1/writing/reports/{reportId}/status
间隔：2 秒
超时：90 秒
```

状态：

```text
basic_queued
basic_processing
basic_ready
basic_failed
deep_locked
deep_queued
deep_processing
deep_ready
deep_failed
```

### 4.4 套餐页 `/tools/ielts-writing/pricing`

#### 套餐

| SKU | 价格 | 权益 |
|---|---:|---|
| `writing_trial_1` | ￥3.9 | 1 次写作深度诊断 |
| `writing_pack_5` | ￥29.9 | 5 次写作深度诊断 |
| `writing_pack_15` | ￥69 | 15 次写作深度诊断 |

后续可加：

| SKU | 价格 | 权益 |
|---|---:|---|
| `human_review_1` | ￥59-99 | 1 次人工精批 |

#### 说明

- V1 不做无限包月。
- 写作深度点数只用于写作。
- 后续口语产品使用 `speaking_deep_credits`，不得与写作共享。

### 4.5 个人中心 `/tools/ielts-writing/profile`

#### 页面目标

承载历史记录、点数余额和复购。

模块：

```text
CreditSummary
  writing_deep_credits
  human_review_credits

ReportHistory
  作文标题/题目
  Task 类型
  预估分
  深度报告状态
  创建时间

ProgressPanel
  最近 10 篇分数趋势
  高频错误类型

Orders
  订单记录
```

### 4.6 题库页 `/tools/ielts-writing/topics`

#### 页面目标

承接 SEO 长尾流量，并导向作文诊断。

页面类型：

```text
Task 1 Line Graph
Task 1 Bar Chart
Task 1 Map
Task 2 Education
Task 2 Technology
Task 2 Environment
Task 2 Work and Career
```

单题页结构：

```text
题目原文
中文解释
写作思路
高分词汇
范文片段
粘贴你的答案，立即诊断
```

SEO 页面必须对用户有实际帮助，不能生成空洞关键词页。

---

## 5. 后端架构

### 5.1 服务分工

```text
Next.js
  页面渲染
  表单交互
  支付二维码展示
  报告状态轮询

FastAPI
  用户与匿名 session
  作文提交
  报告查询
  点数与权限
  订单创建
  支付 webhook

PostgreSQL
  用户
  作文
  报告
  点数
  订单
  流水

Redis
  任务队列
  限流
  临时 session
  任务状态缓存

Worker
  基础诊断
  深度诊断
  LLM 调用
  Pydantic 校验
```

### 5.1.1 共享后端决策

```text
服务名称：IELTS Platform API
部署路径：/opt/ielts-platform-api
本地端口：8710
生产域名建议：ielts-api.qqbytop.com
API 前缀：/api/v1

共享模块：
  users
  user_identities
  auth
  orders
  payments
  credit_ledger
  user_entitlements

写作模块：
  /api/v1/writing/*

口语模块：
  /api/v1/speaking/*
```

V1 不建设第二套写作专属用户系统、支付系统或订单系统。

### 5.2 后端目录建议

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
      auth_service.py
    workers/
      tasks.py
    models/
      user.py
      user_identity.py
      sms_verification_code.py
      anonymous_session.py
      essay.py
      report.py
      order.py
      credit_ledger.py
    schemas/
      diagnostic.py
      api.py
    db/
      session.py
      migrations/
```

---

### 5.3A 腾讯云短信服务

手机号验证码登录只能经过后端封装：

```text
backend/app/services/sms_service.py
```

开发环境可使用 mock provider，只在服务端日志输出验证码；生产环境必须接腾讯云短信或同等级官方短信服务。

生产环境变量：

```env
TENCENTCLOUD_SECRET_ID=
TENCENTCLOUD_SECRET_KEY=
TENCENT_SMS_APP_ID=
TENCENT_SMS_SIGN_NAME=
TENCENT_SMS_TEMPLATE_ID_LOGIN=
```

---

## 6. API 契约

### 6.1 提交作文

```text
POST /api/v1/writing/essays/submit
```

请求：

```json
{
  "anonymous_session_id": "optional-uuid",
  "task_type": "task2",
  "prompt": "Some people think...",
  "content": "In recent years...",
  "source": "homepage"
}
```

响应：

```json
{
  "essay_id": "uuid",
  "report_id": "uuid",
  "anonymous_session_id": "uuid",
  "basic_status": "queued"
}
```

后端动作：

```text
1. 校验输入长度、词数、频率
2. 创建 anonymous_session 或复用已有 session
3. 创建 essays 记录
4. 创建 reports 记录，basic_status=queued, deep_status=locked
5. 推送 basic_diagnostic 任务
6. 返回 report_id
```

### 6.2 获取报告

```text
GET /api/v1/writing/reports/{report_id}
```

响应未解锁：

```json
{
  "report_id": "uuid",
  "essay_id": "uuid",
  "basic_status": "ready",
  "deep_status": "locked",
  "unlocked": false,
  "basic": {
    "estimated_band_range": {"low": 5.5, "high": 6.0}
  },
  "deep": null
}
```

响应已解锁：

```json
{
  "report_id": "uuid",
  "essay_id": "uuid",
  "basic_status": "ready",
  "deep_status": "ready",
  "unlocked": true,
  "basic": {},
  "deep": {}
}
```

权限：

```text
匿名用户只能查看同 anonymous_session_id 下的报告
登录用户只能查看归属自己的报告
管理员接口另行设计
```

### 6.3 报告状态

```text
GET /api/v1/writing/reports/{report_id}/status
```

响应：

```json
{
  "basic_status": "ready",
  "deep_status": "locked",
  "updated_at": "2026-05-09T13:00:00+08:00"
}
```

### 6.4 解锁深度报告

```text
POST /api/v1/writing/reports/{report_id}/unlock
```

请求：

```json
{
  "method": "credit"
}
```

响应成功：

```json
{
  "report_id": "uuid",
  "deep_status": "queued",
  "writing_deep_credits_left": 4
}
```

响应无点数：

```json
{
  "error": "INSUFFICIENT_CREDITS",
  "message": "请购买写作深度诊断点数后解锁。"
}
```

后端动作：

```text
1. 必须要求登录用户
2. 校验报告归属
3. 检查 writing_deep_credits > 0
4. 在事务中扣 1 点并写 credit_ledger
5. 更新 deep_status=queued
6. 推送 deep_diagnostic 任务
```

### 6.5 创建订单

```text
POST /api/v1/orders/create
```

请求：

```json
{
  "sku_id": "writing_pack_5",
  "provider": "wechat_native"
}
```

响应：

```json
{
  "order_id": "uuid",
  "status": "pending",
  "amount_cents": 2990,
  "currency": "CNY",
  "provider": "wechat_native",
  "checkout": {
    "type": "qr_code",
    "code_url": "weixin://wxpay/bizpayurl?pr=..."
  }
}
```

### 6.6 查询订单

```text
GET /api/v1/orders/{order_id}/status
```

响应：

```json
{
  "order_id": "uuid",
  "status": "paid",
  "fulfilled": true
}
```

### 6.7 支付回调

```text
POST /api/v1/payments/wechat/webhook
POST /api/v1/payments/alipay/webhook
POST /api/v1/payments/stripe/webhook
```

要求：

```text
必须验签
必须幂等
必须在数据库事务中更新订单和点数
必须记录原始 provider event id
前端支付成功状态不得作为发货依据
```

---

## 6A. Auth 认证设计

V1 使用共享 IELTS Platform Auth，不为写作工具单独实现用户体系。

登录方式：

```text
V1 必做：手机号短信验证码登录
V1.5 可做：微信服务号带参二维码登录
V2 可做：邮箱验证码 / 微信开放平台网站应用 / Google OAuth
```

Token 策略：

```text
后端签发 JWT access token，默认 7 天有效。
生产环境优先使用 HttpOnly Cookie。
跨域调试阶段可临时使用 Authorization: Bearer <token>。
```

匿名合并：

```text
1. 用户提交作文时创建 anonymous_session。
2. 用户在报告页点击解锁或购买时触发登录。
3. 登录成功后，将 anonymous_session 下 essays 绑定到 user_id。
4. reports 通过 essays 归属该用户。
5. 合并必须幂等，重复登录不重复创建报告或点数。
```

身份表：

```text
users：内部用户主表。
user_identities：登录身份绑定表，V1 支持 phone，后续支持 email、wechat_openid、google_sub。
sms_verification_codes：短信验证码表，用于登录验证码发送、校验、限流和审计。
```

短信验证码安全规则：

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

---

## 7. 数据库设计

### 7.1 users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.2 user_identities

```sql
CREATE TABLE user_identities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);
```

### 7.3 sms_verification_codes

```sql
CREATE TABLE sms_verification_codes (
  id UUID PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.4 anonymous_sessions

```sql
CREATE TABLE anonymous_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  client_fingerprint_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.5 essays

```sql
CREATE TABLE essays (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  anonymous_session_id UUID REFERENCES anonymous_sessions(id),
  task_type TEXT NOT NULL CHECK (task_type IN ('task1', 'task2')),
  prompt TEXT,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.6 reports

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  essay_id UUID NOT NULL REFERENCES essays(id),
  basic_result_json JSONB,
  deep_result_json JSONB,
  meta_json JSONB,
  basic_status TEXT NOT NULL DEFAULT 'queued',
  deep_status TEXT NOT NULL DEFAULT 'locked',
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.7 user_entitlements

```sql
CREATE TABLE user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  writing_deep_credits INTEGER NOT NULL DEFAULT 0,
  speaking_deep_credits INTEGER NOT NULL DEFAULT 0,
  human_review_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.8 credit_ledger

```sql
CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  credit_type TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID,
  report_id UUID REFERENCES reports(id),
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`credit_type` 允许值：

```text
writing_deep
speaking_deep
human_review
```

### 7.9 skus

```sql
CREATE TABLE skus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  is_active BOOLEAN NOT NULL DEFAULT true,
  entitlements_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

SKU 初始数据：

```json
[
  {
    "id": "writing_trial_1",
    "name": "首篇深度诊断",
    "amount_cents": 390,
    "entitlements_json": {"writing_deep": 1}
  },
  {
    "id": "writing_pack_5",
    "name": "5 次写作深度诊断",
    "amount_cents": 2990,
    "entitlements_json": {"writing_deep": 5}
  },
  {
    "id": "writing_pack_15",
    "name": "15 次写作深度诊断",
    "amount_cents": 6900,
    "entitlements_json": {"writing_deep": 15}
  }
]
```

### 7.10 orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  sku_id TEXT NOT NULL REFERENCES skus(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL,
  provider_order_id TEXT,
  provider_event_id TEXT,
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

状态：

```text
pending
paid
failed
closed
refunded
```

---

### 7.11 索引策略

```sql
CREATE INDEX idx_user_identities_user_id ON user_identities(user_id);
CREATE INDEX idx_sms_codes_phone_created_at ON sms_verification_codes(phone, created_at);
CREATE INDEX idx_sms_codes_expires_at ON sms_verification_codes(expires_at);
CREATE INDEX idx_anonymous_sessions_user_id ON anonymous_sessions(user_id);
CREATE INDEX idx_anonymous_sessions_expires_at ON anonymous_sessions(expires_at);
CREATE INDEX idx_essays_anonymous_session ON essays(anonymous_session_id);
CREATE INDEX idx_essays_user_id ON essays(user_id);
CREATE INDEX idx_essays_content_hash ON essays(content_hash);
CREATE INDEX idx_reports_essay_id ON reports(essay_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_credit_ledger_user_id ON credit_ledger(user_id);
```

### 7.12 匿名数据清理

```text
anonymous_sessions 默认 7 天过期。
过期匿名 session 下未登录、未付费、未解锁的 essay/report 可由定时任务软删除或归档。
已登录合并、已付费、已解锁报告不得被匿名清理任务删除。
```

---

## 8. AI 诊断设计

### 8.1 V1 不使用 LangGraph

V1 使用：

```text
Async Python + Pydantic + 固定流水线
```

原因：

```text
写作单次诊断是固定 DAG，不需要 Agent 自主规划。
原生 async 更快、更好调试、更省 token。
Pydantic 保证输出格式稳定。
```

### 8.1.1 固定流水线与成本预算

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
→ 并发调用 3 个异步函数：
   1. sentence_correction_agent：逐句语法/词汇/结构批改
   2. paragraph_logic_agent：段落角色、TR/CC 和论证问题
   3. vocabulary_rewrite_agent：LR、表达替换与 Band 7+ 改写样例
→ aggregator 汇总为 DeepWritingReport
→ Pydantic 校验
→ 生成 meta_json
→ 入库 reports.deep_result_json
```

模型建议：

```text
基础诊断：低成本模型，例如 gpt-4o-mini 或同级别模型。
深度诊断：MVP 可先用低成本模型；如质量不足，仅 aggregator 或 rewrite 节点升级到更强模型。
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

### 8.2 基础诊断

触发条件：

```text
用户提交作文后自动触发
不要求登录
不扣点数
```

输出内容：

```text
estimated_band_range
dimension_scores 粗分
word_count
task_fit
top_issues 前 3 个
sample_revision 1 个句子
upgrade_hint 锁定内容摘要
```

### 8.3 深度诊断

触发条件：

```text
用户登录
writing_deep_credits > 0
扣点成功
```

输出内容：

```text
四项精确预估分
逐段诊断
逐句批改
错误分类
高分表达替换
Band 7+ 改写示例
下一篇练习建议
```

### 8.4 Pydantic Schema

基础报告：

```python
class DimensionScore(BaseModel):
    dimension: Literal["TR", "CC", "LR", "GRA"]
    score: float = Field(ge=0, le=9, multiple_of=0.5)
    summary_zh: str

class BandRange(BaseModel):
    low: float = Field(ge=0, le=9, multiple_of=0.5)
    high: float = Field(ge=0, le=9, multiple_of=0.5)

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
```

深度报告：

```python
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
        "TaskResponse"
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

### 8.5 Prompt 边界

LLM 必须遵守：

```text
不要承诺官方分数
不要输出 Band 9 保证
不要全文免费改写基础报告
不要把口语建议混入写作报告
不要判断是否 AI 写作
不要推荐不自然的大词堆砌
中文解释，英文证据片段
```

### 8.6 后端校验

所有 LLM 输出入库前必须校验：

```text
Pydantic parse 成功
score 在 0-9
score 以 0.5 为建议粒度
evidence 尽量来自原文
列表长度受控
空字段 fallback
```

---

## 9. 点数与权限

### 9.1 点数不共享

写作和口语使用不同点数：

```text
writing_deep_credits
speaking_deep_credits
human_review_credits
```

规则：

```text
写作深度报告只扣 writing_deep_credits
口语深度报告只扣 speaking_deep_credits
人工复核只扣 human_review_credits
```

### 9.2 匿名用户

匿名用户可：

```text
提交作文
查看基础报告
进入登录/支付弹窗
```

匿名用户不可：

```text
购买点数
解锁深度报告
保存长期历史
查看个人中心
```

### 9.3 登录合并

登录成功后：

```text
1. 将当前 anonymous_session 下 essays 绑定到 user_id
2. 将 reports 通过 essays 间接归属用户
3. 保留 anonymous_session 用于审计
```

---

## 10. 支付设计

### 10.1 支付渠道

V1 建议顺序：

```text
1. 微信支付 Native
2. 支付宝电脑网站支付 / 当面付
3. Stripe Checkout
```

正式产品使用官方商户接口，不使用免签、个人码、来路不明聚合支付。

### 10.2 支付流程

```text
用户选择 SKU
→ 必须登录
→ 后端创建 pending 订单
→ 后端请求支付渠道创建预支付
→ 前端展示二维码/跳转收银台
→ 前端轮询订单状态
→ 支付渠道 webhook 通知后端
→ 后端验签
→ 后端事务中标记 paid 并发放点数
→ 前端看到 paid，更新余额
```

### 10.3 支付安全

必须实现：

```text
Webhook 验签
订单幂等
金额校验
SKU 校验
provider_order_id 唯一性
订单状态机
credit_ledger 流水
失败回滚
```

禁止：

```text
前端传 paid=true 后直接发货
用 float 存金额
重复 webhook 重复加点
不同 SKU 混发点数
```

---

## 11. 限流与风控

### 11.1 限流维度

```text
IP 每分钟提交次数
anonymous_session 每日基础诊断次数
user_id 每日基础诊断次数
user_id 深度诊断并发数
content_hash 重复提交
```

### 11.2 建议规则

```text
匿名用户：每日 1-3 次基础诊断
登录用户：每日 5 次基础诊断
深度诊断：有点数即可，但同一用户同时最多 2 个处理中任务
同一 anonymous_session / user_id + 同一 content_hash 24 小时内可复用已有 report_id
```

### 11.3 重复提交

后端计算：

```text
content_hash = sha256(normalized_content)
```

去重规则：

```text
1. 同一 anonymous_session 或同一 user_id，在 24 小时内提交相同 content_hash，直接返回已有 report_id。
2. 不同用户提交相同作文，不共享报告结果，必须创建各自独立 essay/report。
3. 深度解锁始终绑定具体 report_id，不绑定 content_hash。
4. 如果已有 report_id 的 deep_status=ready，再次查看不得重复扣点或重复生成。
5. content_hash 只用于去重和限流，不作为跨用户共享缓存依据。
```

如 24 小时内同一用户提交相同内容：

```text
基础报告直接返回已有报告
深度报告已生成则直接返回
不重复扣点
```

---

## 12. 环境变量

前端：

```env
NEXT_PUBLIC_IELTS_WRITING_API_BASE=
NEXT_PUBLIC_SITE_URL=
```

后端：

```env
DATABASE_URL=
REDIS_URL=
OPENAI_API_KEY=
LLM_MODEL_BASIC=
LLM_MODEL_DEEP=
TENCENTCLOUD_SECRET_ID=
TENCENTCLOUD_SECRET_KEY=
TENCENT_SMS_APP_ID=
TENCENT_SMS_SIGN_NAME=
TENCENT_SMS_TEMPLATE_ID_LOGIN=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_APP_ID=
WECHAT_PAY_API_V3_KEY=
WECHAT_PAY_PRIVATE_KEY_PATH=
WECHAT_PAY_CERT_SERIAL_NO=
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

密钥只能在后端保存，不能暴露给 Next.js 客户端。

---

## 13. 前端组件清单

### 13.1 首页组件

```text
IeltsWritingLandingPage
HeaderNav
EssayInputPanel
TaskTypeSegment
WordCountMeter
TrustStrip
ReportPreview
FaqSection
```

### 13.2 报告页组件

```text
ReportPage
ReportLoadingState
ReportHeader
ScoreRadar
DimensionScoreCards
BasicFindings
IssueCard
DeepReportGate
PricingInlineCTA
DeepReportContent
SentenceCorrectionList
VocabularyUpgradeTable
BandRewritePanel
NextPracticeTasks
```

### 13.3 支付组件

```text
LoginRequiredModal
CheckoutModal
PaymentQRCode
OrderStatusPoller
CreditBalanceBadge
```

### 13.4 个人中心组件

```text
ProfilePage
CreditSummary
ReportHistoryTable
ProgressChart
FrequentIssueList
OrderHistoryTable
```

---

## 14. 视觉与交互要求

### 14.1 风格

```text
白底
深蓝/墨绿作为主强调色
红色只用于错误
绿色只用于修正建议
灰色用于锁定区与说明
整体学术、干净、可信
```

### 14.2 首页交互

- 首屏即工具，不做大面积营销 hero。
- 文本框高度桌面端不低于 280px。
- 移动端优先粘贴输入，不做 OCR。
- 提交按钮在输入不足时 disabled，并给出原因。

### 14.3 报告页交互

- 等待时展示扫描骨架屏，不展示空白。
- 基础报告先显示最关键结果。
- 深度锁定区展示“可解锁内容摘要”，不展示真实深度内容。
- 解锁按钮明确写价格或点数消耗。

### 14.4 响应式

桌面端：

```text
报告页可使用双列布局：左侧评分与问题，右侧 CTA/余额/历史
```

移动端：

```text
全部单列
CTA 固定在可见区域底部，但不得遮挡正文
```

---

## 15. 开发里程碑

里程碑编号以 `docs/雅思写作AI诊断工具AI辅助开发规划文档.md` 为准，统一为 M1-M8。本节为编程 PRD 摘要，不再另起一套编号。

统一里程碑：

```text
M1 前端静态页面与 Mock 数据
M2 数据库与基础 API
M3 基础诊断 Worker 与 LLM Schema
M4 登录、匿名合并、点数系统
M5 深度诊断与解锁权限
M6 官方支付闭环
M7 题库 SEO 与增长页
M8 生产部署与全链路验收
```

并行执行规则：

```text
M1 和 M2 可以同时启动。
M7 可在 M1 完成后启动，不必等待支付。
M8 必须等待 M1-M7 全部验收完成。
涉及真实扣点、支付、报告权限的联调必须等待 M4-M6 完成。
```

### Milestone 1：静态前端与本地 mock

范围：

```text
首页
报告页 mock
套餐页
个人中心空状态
题库列表 mock
```

验收：

```text
npm run typecheck 通过
npm run build 通过
桌面和移动端布局无明显溢出
报告页能展示 basic/deep 两种 mock 状态
```

### Milestone 2：FastAPI 基础 API 与数据库

范围：

```text
PostgreSQL schema
作文提交 API
报告查询 API
状态查询 API
匿名 session
```

验收：

```text
可提交作文
可生成 report_id
可查询报告状态
未解锁 deep 返回 null
```

### Milestone 3：AI 基础诊断

范围：

```text
Worker
Redis 队列
BasicWritingReport schema
LLM 调用
基础报告入库
前端轮询展示
```

验收：

```text
基础报告 90 秒内返回
Pydantic 校验失败有 fallback
接口不暴露原始异常
```

### Milestone 4：登录、匿名合并、点数系统

范围：

```text
用户登录
匿名报告合并
user_entitlements
credit_ledger
profile API
点数余额展示
```

验收：

```text
匿名报告可合并到登录用户
用户可查看 writing_deep_credits
点数变动写 credit_ledger
speaking_deep_credits 不参与写作解锁
```

### Milestone 5：深度诊断与解锁权限

范围：

```text
unlock API
DeepWritingReport schema
扣点事务
深度诊断 Worker
deep_result_json 入库
```

验收：

```text
无点数不能解锁
有点数扣 1 次
扣点写流水
深度报告生成后可展示
同一报告重复查看不重复扣点
```

### Milestone 6：官方支付闭环

范围：

```text
SKU
订单创建
微信 Native 支付
订单状态轮询
Webhook 验签与幂等
点数发放
```

验收：

```text
支付成功后自动增加 writing_deep_credits
重复 webhook 不重复加点
支付失败不发点
订单记录可查
```

### Milestone 7：题库 SEO 与增长页

范围：

```text
题库页
单题页
SEO metadata
报告页分享图预留
报告页 noindex
```

验收：

```text
每个题库页都有诊断入口
页面标题唯一且准确
用户报告页 noindex，题库页 index
题库页内容不是空洞关键词堆砌
```

### Milestone 8：生产部署与全链路验收

范围：

```text
Vercel 前端部署
腾讯云 VPS 后端部署
PostgreSQL / Redis / Worker 常驻
Nginx / HTTPS / CORS
支付 webhook 生产回调地址
结构化日志与队列监控
```

验收：

```text
前端生产域名可访问
后端健康检查可访问
Worker 可消费任务
支付回调 URL 可公网访问
全链路从提交作文到付费解锁可跑通
队列积压数量可查看
支付 webhook 失败有 ERROR 日志
```

---

## 16. 验收清单

### 16.1 产品验收

- 用户不登录可以提交作文。
- 用户可以看到基础报告。
- 用户未解锁时看不到深度报告真实内容。
- 用户登录后可购买写作深度点数。
- 用户有点数可解锁深度报告。
- 历史报告能在个人中心查看。
- 写作点数和未来口语点数不共享。

### 16.2 技术验收

- 前端 typecheck 通过。
- 前端 build 通过。
- 后端输入校验完整。
- LLM 输出使用 Pydantic 校验。
- 报告接口权限正确。
- 支付 webhook 验签。
- 订单发货幂等。
- 金额使用整数分。
- 关键异常只进服务端日志。

### 16.3 安全验收

- 未登录用户不能访问他人报告。
- 登录用户不能访问非本人报告。
- 未解锁接口不返回 deep JSON。
- 前端不保存支付密钥。
- 后端不信任前端支付状态。
- rate limit 生效。

---

## 17. 未来扩展

V2 可做：

```text
服务号扫码登录
邀请奖励
小红书分享海报
写作人工精批
Word 文件上传
Task 1 图表识别
口语诊断独立产品
写作 + 口语输出项组合包
```

V2 仍需保持：

```text
写作点数和口语点数分开
账号与支付可统一
用户中心可统一
报告权限由服务端控制
```

---

## 18. 开发优先级结论

第一周优先完成：

```text
首页输入
报告页 mock
数据库 schema
作文提交 API
基础诊断 Worker
```

第二周优先完成：

```text
登录
点数扣减
深度诊断
套餐页
个人中心
```

第三周优先完成：

```text
微信 Native 支付
订单 webhook
题库 SEO 页
灰度测试
```

项目完成的最低可售卖标准：

```text
用户可以免费生成基础报告；
用户可以购买写作深度诊断点数；
用户可以用点数解锁一份深度报告；
深度报告质量足以让用户知道为什么扣分以及下一步怎么改。
```
