# 雅思口语 AI 诊断工具编程 PRD

版本：V1.0  
日期：2026-05-05  
目标域名：`qqbytop.com`  
前端部署：Vercel / Next.js  
后端部署：腾讯云轻量服务器 / FastAPI  
后端承载域名：`ielts-api.qqbytop.com`  

## 1. 产品目标

### 1.1 产品定位

面向中国大陆雅思备考用户的 AI 口语诊断工具。用户通过当季雅思口语题库进入练习，完成录音后获得免费基础报告，并可付费解锁深度报告，查看扣分原因、逐句修改建议、发音问题和 7 天训练计划。

核心定位：

> 帮助雅思口语 5.0-6.5 分段用户知道自己为什么卡分，并给出可执行的提分路径。

### 1.2 MVP 目标

第一版只验证最小商业闭环：

```text
题库页访问
→ 用户录音
→ 生成基础报告
→ 付费/消耗次数
→ 生成深度报告
→ 用户复练
```

MVP 不做完整学习 App，不做无限 AI 陪聊，不做摄像头情绪识别，不做官方雅思成绩承诺。

### 1.3 成功指标

| 指标 | MVP 目标 |
|---|---:|
| 题库页录音开始率 | >= 15% |
| 录音完成率 | >= 50% |
| 基础报告生成成功率 | >= 95% |
| 基础报告到首单付费率 | >= 3% |
| 首单用户二次购买率 | >= 15% |
| 深度报告生成成功率 | >= 90% |
| 深度报告退款/投诉率 | <= 3% |

## 2. 用户与场景

### 2.1 目标用户

- 雅思口语目标分 6.0-7.0 的备考用户。
- 当前口语大约 5.0-6.5，想知道具体扣分原因。
- 考前 2-8 周需要大量练当季题库。
- 预算不适合长期真人外教一对一。

### 2.2 用户核心痛点

- 不知道自己的真实口语水平。
- 不知道发音、语法、词汇、流利度分别哪里扣分。
- AI 陪练产品容易给高分，用户不信任。
- 真人外教贵，反馈不够标准化。
- 题库和练习反馈割裂。

### 2.3 关键用户故事

1. 作为备考用户，我想直接练当季口语题，并立即知道自己大概几分。
2. 作为备考用户，我想知道到底是哪几个问题拖累分数。
3. 作为备考用户，我想看到逐句修改，而不是泛泛建议。
4. 作为付费用户，我想保存历史报告并复练对比。
5. 作为运营/管理员，我想查看报告质量、失败任务和付费解锁记录。

## 3. 产品范围

### 3.1 V1 必做

- 题库首页。
- Part 1 / Part 2 / Part 3 题目列表。
- 单题详情页。
- 录音页。
- 音频上传。
- 腾讯云 SOE 评测代理。
- 基础报告。
- 深度报告锁定区。
- 登录后解锁。
- 次数包/单次解锁的数据结构。
- 深度报告生成任务。
- 报告详情页。
- 基础管理后台接口。

### 3.2 V1 不做

- 官方雅思授权声明。
- 保证提分承诺。
- 摄像头表情识别。
- 私有化 Whisper / MFA / wav2vec 发音引擎。
- 开放式自主 Agent 和不可控自动规划。V1 采用受控 LangGraph 多 Agent 状态机，节点固定、输入固定、输出固定、Pydantic 校验固定。
- 无限次深度诊断。
- 所有报告强制人工审核。
- 微信小程序第一版。

## 4. 信息架构与页面

### 4.1 前端路径

```text
/tools/ielts-speaking
/tools/ielts-speaking/topics
/tools/ielts-speaking/topics/[topicSlug]
/tools/ielts-speaking/record/[topicId]
/tools/ielts-speaking/report/[reportId]
/tools/ielts-speaking/pricing
/tools/ielts-speaking/account
/tools/ielts-admin
/tools/ielts-admin/reports
/tools/ielts-admin/reports/[reportId]
```

### 4.2 API 显示路径

前端代码统一请求：

```text
/tools/ielts-api/*
```

Vercel rewrite 到真实后端：

```text
https://ielts-api.qqbytop.com/*
```

### 4.3 Vercel rewrite

`next.config.ts` 需要增加：

```ts
const ieltsApiBaseUrl = process.env.IELTS_API_BASE_URL ?? "http://127.0.0.1:8000";

async rewrites() {
  return [
    {
      source: "/tools/ielts-api/:path*",
      destination: `${ieltsApiBaseUrl}/api/v1/:path*`,
    },
  ];
}
```

生产环境 Vercel 变量：

```env
IELTS_API_BASE_URL=https://ielts-api.qqbytop.com
```

端口约定：

- 本地开发：FastAPI 默认可监听 `127.0.0.1:8000`，便于 `uvicorn app.main:app --reload`。
- 生产部署：腾讯云 VPS 上 systemd 服务监听 `127.0.0.1:8710`，Nginx 将 `ielts-api.qqbytop.com` 反代到该端口。
- Vercel 不直接写死端口，只读取 `IELTS_API_BASE_URL`。

## 5. 核心页面需求

### 5.1 题库首页 `/tools/ielts-speaking`

模块：

- 顶部价值主张。
- 当季题库入口。
- Part 1 / Part 2 / Part 3 快速入口。
- 高频练习题。
- 最近生成报告入口。
- CTA：`开始免费口语诊断`。

首屏文案原则：

- 不写“官方评分”。
- 使用“AI 预估分”“参考 IELTS Speaking 四项维度”。

### 5.2 单题详情页 `/topics/[topicSlug]`

字段：

- 题目英文原文。
- 中文解释。
- 题型：Part 1 / Part 2 / Part 3。
- 推荐回答时长。
- 答题思路。
- 常见低分问题。
- 高分表达。
- CTA：`录音回答这道题`。

SEO 要求：

- H1 包含题目关键词。
- 每页有唯一 `title`、`description`。
- 题目页之间有相关题目内链。

### 5.3 录音页 `/record/[topicId]`

状态机：

```text
idle
→ permission_checking
→ ready
→ recording
→ recorded
→ uploading
→ diagnosing
→ basic_ready
→ error
```

功能：

- 检测麦克风权限。
- 显示题目和计时器。
- 显示录音波形或音量反馈。
- 支持重录。
- 上传音频。
- 提交后创建报告。

录音时长：

| 题型 | 推荐时长 | 最大时长 |
|---|---:|---:|
| Part 1 | 30-60 秒 | 90 秒 |
| Part 2 | 90-120 秒 | 150 秒 |
| Part 3 | 45-90 秒 | 120 秒 |

前端限制：

- 单个音频最大 25MB。
- 只允许音频 MIME 类型。
- 如果录音小于 8 秒，提示有效内容过短。

### 5.4 报告页 `/report/[reportId]`

报告页分为：

- 免费基础报告区域。
- 深度报告锁定/生成/展示区域。
- 购买与次数包 CTA。

深度报告状态：

```text
locked
generating
ready
failed
```

未解锁时：

- 前端不得拿到 `deep_result_json`。
- 只展示深度报告摘要占位。
- CTA：`解锁我的扣分原因`。

### 5.5 定价页 `/pricing`

第一版商品：

| 商品 | 价格 | 权益 |
|---|---:|---|
| 首份深度报告 | ￥3.9 | 解锁当前报告 1 次 |
| 单次深度报告 | ￥6.9 | 解锁当前报告 1 次 |
| 5 次诊断包 | ￥29.9 | 5 次深度报告 |
| 15 次冲刺包 | ￥69 | 15 次深度报告 |
| 当季冲刺包 | ￥99 | 25 次深度报告 + 当季题库训练路径 |
| 人工复核 | ￥59/次 | AI 报告基础上人工复核 |

第一版主推：

```text
首份 ￥3.9
5 次 ￥29.9
15 次 ￥69
```

### 5.6 管理后台 `/tools/ielts-admin`

V1 可以只做最小后台：

- 报告列表。
- 报告详情。
- SOE 原始结果查看。
- LLM 输出查看。
- 手动重跑深度报告。
- 手动作废报告。
- 修改报告状态。

后续再做：

- 人工复核工作台。
- 分数校准配置。
- 订单与退款管理。
- 审核日志。

## 6. 基础报告与深度报告

### 6.1 基础报告

生成成本低，提交后立即返回。

内容：

- 回答时长。
- 语速 WPM。
- 停顿次数。
- 发音清晰度。
- 流利度。
- 预估分区间，例如 `5.5-6.0`。
- 2-3 条关键问题。
- 深度报告锁定提示。

基础报告原则：

```text
给结论，不给完整证据。
给问题方向，不给逐句改写。
让用户相信系统有诊断能力。
```

### 6.2 深度报告

付费或消耗次数后生成。

内容：

- 四项雅思预估分：
  - FC：Fluency & Coherence
  - LR：Lexical Resource
  - GRA：Grammar Range & Accuracy
  - PR：Pronunciation
- 逐句诊断。
- 语法错误分类。
- 低分词替换。
- 高分表达建议。
- 单词级/音素级发音问题。
- 提分优先级。
- 7 天训练计划。

深度报告原则：

```text
给证据。
给修改。
给练习任务。
给下一步路径。
```

## 7. 技术架构

### 7.1 总体架构

```text
Web 用户浏览器
App 客户端
微信小程序
        ↓
统一 API 网关 / HTTPS
        ↓
FastAPI 后端
        ↓
腾讯云 SOE / LLM API / PostgreSQL / COS / 支付渠道
```

当前 V1 先开发 Web 版，访问链路：

```text
用户浏览器
→ Vercel Next.js 前端
→ /tools/ielts-api/* rewrite
→ ielts-api.qqbytop.com
→ 腾讯云 VPS Nginx
→ FastAPI 127.0.0.1:8710
→ 腾讯云 SOE / LLM API / PostgreSQL / COS
```

### 7.2 多端共用后端原则

后端从 V1 开始必须设计为平台无关 API，不能写成只服务 Web 页面的接口。

可共用能力：

- 用户系统。
- 题库。
- 录音上传。
- 腾讯云 SOE 调用。
- 基础报告。
- 深度报告。
- 付费解锁。
- 次数包。
- 订单。
- 报告历史。
- 训练计划。
- 后台审核。

各端差异只放在登录和支付适配层：

| 端 | 登录 | 支付 |
|---|---|---|
| Web | 手机号、邮箱、微信网页授权 | 微信 H5、支付宝网页支付，后续可接 Stripe |
| App | 手机号、Apple、微信 | App 内购或微信/支付宝，按应用商店规则处理 |
| 微信小程序 | 微信 OpenID | 微信小程序支付 |

统一 API 路径建议：

```text
/api/v1/topics
/api/v1/reports
/api/v1/reports/{id}
/api/v1/reports/{id}/unlock
/api/v1/orders
/api/v1/me
```

Web 版通过 Vercel rewrite 访问：

```text
qqbytop.com/tools/ielts-api/* → ielts-api.qqbytop.com/api/v1/*
```

App 和微信小程序后续直接访问：

```text
https://ielts-api.qqbytop.com/api/v1/*
```

### 7.3 前端技术栈

- Next.js。
- React。
- Tailwind CSS。
- Web Audio / MediaRecorder。
- API client 封装。

### 7.4 后端技术栈

- Python 3.11。
- FastAPI。
- LangGraph，使用受控多 Agent 状态机。
- Uvicorn。
- Pydantic。
- SQLAlchemy 或 SQLModel。
- PostgreSQL。
- Redis，可后置。
- systemd 守护进程。

### 7.5 LangGraph 诊断工作流

V1 深度报告必须使用受控 LangGraph 多 Agent 状态机，不使用单次 Prompt 直接生成完整报告。

固定图结构：

```text
START
  ↓
InputNormalizer
  ↓
SOEEvaluationNode
  ↓
BasicMetricsNode
  ↓
并行分支：
  ├─ FC Agent
  ├─ LR Agent
  ├─ GRA Agent
  └─ PR Agent
  ↓
ScoreSynthesizer
  ↓
ReportCritic
  ↓
SchemaValidator
  ↓
QualityGate
  ├─ pass → ready
  ├─ repairable → AutoRepair → SchemaValidator
  └─ high_risk → needs_review
```

节点职责：

| 节点 | 职责 | 禁止行为 |
|---|---|---|
| FC Agent | 停顿、语速、连贯性、答题展开 | 不改语法、不升级词汇 |
| LR Agent | 词汇重复、搭配、地道表达、话题词 | 不纠语法、不写整篇范文 |
| GRA Agent | 时态、主谓一致、句型复杂度、错误密度 | 不评价词汇和发音 |
| PR Agent | 基于 SOE 的发音、音素、重音、流利度解释 | 不凭文本猜发音 |
| ScoreSynthesizer | 汇总四项分数和优先级 | 不忽略子 Agent evidence |
| ReportCritic | 检查分数自洽、建议证据、表达自然度 | 不生成新报告 |
| SchemaValidator | Pydantic 校验 JSON | 不做语义判断 |
| QualityGate | 决定 ready、repairable、needs_review、failed | 不修改报告内容 |

### 7.6 后端部署目录

```text
/opt/ielts-speaking-api
  app/
    graphs/
      ielts_scoring_graph.py
      graph_state.py
      nodes/
        fc_agent.py
        lr_agent.py
        gra_agent.py
        pr_agent.py
        score_synthesizer.py
        report_critic.py
        schema_validator.py
        quality_gate.py
  migrations/
  logs/
  scripts/
  .env
  requirements.txt
  README.md
```

后端服务：

```text
127.0.0.1:8710
```

systemd 服务名：

```text
ielts-speaking-api.service
```

## 8. 腾讯云 SOE 集成

### 8.1 SOE 角色

SOE 负责：

- 发音准确度。
- 流利度。
- 完整度。
- 单词级错误。
- 音素级错误。
- 停顿特征。

SOE 不负责：

- 完整雅思四项评分。
- 语法诊断。
- 词汇升级。
- 论证结构判断。

SOE 转写边界：

- 腾讯云 SOE 在自由说/流式评测场景中可返回识别文本、断句和单词级结果，但它不是通用 ASR 产品。
- V1 可以先将 SOE 返回的识别/断句结果作为 `transcript` 来源，并允许后台人工修正。
- 如果测试发现长回答转写不稳定、乱码率高、断句不适合 LLM 分析，应追加独立 ASR Provider，例如腾讯云语音识别或 Whisper。
- 后端必须把 `transcript_source` 写入报告：`soe`、`manual`、`asr_provider`、`mixed`。
- PR Agent 只能基于 SOE 音素/单词证据解释发音，不能根据转写文本猜测发音错误。

### 8.2 参数原则

```text
server_engine_type = 16k_en
score_coeff = 4.0 或后端配置项
```

评测模式：

| 场景 | eval_mode |
|---|---:|
| 自由说，雅思 Part 1/2/3 | 3 |
| 句子跟读 | 1 |
| 段落朗读 | 2 |
| 单词音素纠错 | 4 |

### 8.3 SOE 结果标准化

后端应将腾讯云原始 JSON 归一化为内部结构：

```json
{
  "provider": "tencent_soe",
  "engine": "16k_en",
  "eval_mode": 3,
  "raw_score": 82.5,
  "pron_accuracy": 78.0,
  "pron_fluency": 74.0,
  "integrity": 88.0,
  "transcript": "I would like to talk about a memorable journey...",
  "transcript_source": "soe",
  "words_pause": 12,
  "words": [
    {
      "word": "comfortable",
      "start_ms": 1200,
      "end_ms": 1800,
      "accuracy": 65.0,
      "match_tag": 3,
      "phones": [
        {
          "phone": "th",
          "accuracy": 52.0,
          "start_ms": 1220,
          "end_ms": 1320
        }
      ]
    }
  ],
  "raw": {}
}
```

## 9. 分数逻辑

### 9.1 分数声明

产品内所有分数必须显示为：

```text
AI 预估分
非官方成绩
参考 IELTS Speaking 四项评分维度
```

禁止：

```text
官方雅思分数
等同真人考官
保证提分
```

### 9.2 SOE 到 PR 分映射

第一版使用可配置阈值表，不硬编码。

示例配置：

```json
{
  "pronunciation_thresholds": [
    { "min": 0, "max": 55, "band": 4.0 },
    { "min": 55, "max": 65, "band": 4.5 },
    { "min": 65, "max": 73, "band": 5.0 },
    { "min": 73, "max": 80, "band": 5.5 },
    { "min": 80, "max": 85, "band": 6.0 },
    { "min": 85, "max": 90, "band": 6.5 },
    { "min": 90, "max": 94, "band": 7.0 },
    { "min": 94, "max": 97, "band": 7.5 },
    { "min": 97, "max": 99, "band": 8.0 },
    { "min": 99, "max": 100, "band": 8.5 }
  ]
}
```

注意：该映射只是 MVP 预估逻辑，后续必须用真人评分样本校准。

### 9.3 FC 分数

FC 由以下特征共同决定：

- SOE `pron_fluency`。
- 回答时长。
- WPM。
- 停顿次数。
- 过长静音片段。
- 自我修正和重复。
- LLM 对连贯性的结构化判断。

### 9.4 LR / GRA 分数

由 LLM 结构化输出 + 规则约束生成：

- LR 看重复词、低级词、搭配、话题词汇。
- GRA 看错误密度、复杂句比例、时态、主谓一致、冠词、介词。

GRA 不能只看语法错误数量。如果句子全部简单但无错误，GRA 不应给高分。

## 10. LLM 分析模块

### 10.1 输入

LLM 输入结构：

```json
{
  "topic": {
    "part": "part2",
    "question": "Describe a memorable journey you had.",
    "expected_duration_sec": 120
  },
  "transcript": "User transcript here...",
  "soe_summary": {
    "pron_accuracy": 78,
    "pron_fluency": 74,
    "words_pause": 12,
    "low_score_words": ["comfortable", "through"]
  },
  "basic_metrics": {
    "duration_sec": 96,
    "wpm": 112,
    "pause_count": 14
  }
}
```

### 10.2 输出

LLM 必须返回 JSON，不能返回 Markdown：

```json
{
  "scores": {
    "fc": 5.5,
    "lr": 5.5,
    "gra": 5.0,
    "pr": 6.0,
    "overall": 5.5
  },
  "diagnosis": {
    "summary": "Your answer is understandable but limited by tense errors and long pauses.",
    "top_issues": [
      {
        "dimension": "GRA",
        "severity": "high",
        "title": "Past tense instability",
        "evidence": "Yesterday I go...",
        "suggestion": "Use went for past events."
      }
    ]
  },
  "sentence_feedback": [
    {
      "original": "Yesterday I go to a park.",
      "issue_type": "tense",
      "corrected": "Yesterday I went to a park.",
      "reason": "The time marker yesterday requires past tense."
    }
  ],
  "vocabulary_upgrades": [
    {
      "original": "very good",
      "suggested": "really worthwhile",
      "reason": "More natural spoken expression for IELTS."
    }
  ],
  "training_plan": [
    {
      "day": 1,
      "task": "Re-record this answer using stable past tense.",
      "practice_items": ["went", "visited", "spent"]
    }
  ]
}
```

### 10.3 Prompt 约束

- 不许承诺官方分数。
- 不许过度改写用户原意。
- 不许强塞学术大词。
- 口语表达应自然，不要写作文式表达。
- 每条建议必须有证据。
- 输出必须可被 Pydantic 校验。

## 11. 后端 API

### 11.1 健康检查

```http
GET /health
```

响应：

```json
{
  "ok": true,
  "service": "ielts-speaking-api",
  "version": "0.1.0"
}
```

### 11.2 创建报告并上传音频

Web 当前路径经 rewrite 后等价于 `/api/v1/reports`。

```http
POST /api/v1/reports
Content-Type: multipart/form-data
```

字段：

| 字段 | 类型 | 必填 |
|---|---|---|
| topic_id | string | 是 |
| part | string | 是 |
| audio | file | 是 |
| user_id | string | 否 |

响应：

```json
{
  "report_id": "rpt_...",
  "status": "basic_ready",
  "basic_report": {}
}
```

### 11.3 获取报告

```http
GET /api/v1/reports/{report_id}
```

未解锁响应：

```json
{
  "report_id": "rpt_...",
  "unlocked": false,
  "basic_report": {},
  "deep_report": null,
  "deep_status": "locked"
}
```

已解锁响应：

```json
{
  "report_id": "rpt_...",
  "unlocked": true,
  "basic_report": {},
  "deep_report": {},
  "deep_status": "ready"
}
```

### 11.4 使用次数解锁

```http
POST /api/v1/reports/{report_id}/unlock-with-credit
```

响应：

```json
{
  "report_id": "rpt_...",
  "deep_status": "generating",
  "remaining_credits": 4
}
```

### 11.5 创建订单

```http
POST /api/v1/orders
```

请求：

```json
{
  "product_id": "credits_5",
  "report_id": "rpt_..."
}
```

响应：

```json
{
  "order_id": "ord_...",
  "pay_url": "...",
  "status": "pending"
}
```

### 11.6 支付回调

```http
POST /api/v1/payments/webhook
```

要求：

- 必须验签。
- 必须幂等。
- 重复回调不能重复加次数。
- 只信任支付平台回调，不信任前端 `paid=true`。

### 11.7 管理后台报告列表

```http
GET /api/v1/admin/reports?status=pending_review&page=1
```

需要管理员权限。

### 11.8 登录与会话

V1 不做账号密码登录，优先使用验证码登录。验证码可以是手机号或邮箱，微信网页授权后置。

#### 发送验证码

```http
POST /api/v1/auth/send-code
```

请求：

```json
{
  "identity_type": "phone",
  "identity": "13800000000",
  "client_platform": "web"
}
```

响应：

```json
{
  "challenge_id": "chg_...",
  "expires_in": 300
}
```

要求：

- 同一 identity 60 秒内只能发送 1 次。
- 同一 IP 每小时发送次数限流。
- 响应不得泄露该手机号/邮箱是否已注册。

#### 验证验证码并登录

```http
POST /api/v1/auth/verify-code
```

请求：

```json
{
  "challenge_id": "chg_...",
  "code": "123456",
  "client_platform": "web"
}
```

响应：

```json
{
  "user_id": "usr_...",
  "session_id": "ses_...",
  "access_token": "jwt_or_session_token",
  "expires_at": "2026-06-08T00:00:00Z"
}
```

Web V1 可使用 HttpOnly Cookie 保存会话；App 和小程序后续使用 Bearer Token 或平台会话。前端不得把腾讯云、支付、LLM 密钥放入登录响应。

#### 退出登录

```http
POST /api/v1/auth/logout
```

要求：

- 撤销当前 `platform_sessions`。
- 清除 Web Cookie。

### 11.9 获取当前用户

```http
GET /api/v1/me
```

响应：

```json
{
  "user_id": "usr_...",
  "platform": "web",
  "credits": 4,
  "identities": [
    {
      "provider": "phone",
      "provider_uid_masked": "138****0000"
    }
  ]
}
```

### 11.10 解锁深度报告的登录门槛

解锁按钮必须按以下顺序执行：

```text
未登录 → 弹登录
已登录且有 credits → 消耗 1 次并生成/展示深度报告
已登录但无 credits → 创建订单
支付成功 → webhook 增加 credits 或写入 report_unlocks
```

前端严禁在未登录状态下请求或缓存 `deep_result_json`。服务端必须再次校验当前用户是否拥有报告、是否已解锁，不信任前端状态。

### 11.11 多端音频提交方式

同一个报告创建接口必须支持两种提交方式：

1. `multipart/form-data` 直接上传音频，适合 Web MVP。
2. COS 直传后提交 `cos_key`，适合 App 和微信小程序。

`multipart/form-data` 字段：

| 字段 | 类型 | 必填 |
|---|---|---|
| topic_id | string | 是 |
| part | string | 是 |
| audio | file | 是 |
| client_platform | string | 是，web/app/wechat_mini |

`cos_key` JSON 字段：

```json
{
  "topic_id": "topic_...",
  "part": "part2",
  "cos_key": "uploads/usr_xxx/audio_xxx.m4a",
  "client_platform": "wechat_mini"
}
```

## 12. 数据库设计

### 12.1 users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  primary_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.2 user_identities

用于绑定 Web、App、微信小程序等不同登录身份。同一个自然人后续可以合并到同一个 `user_id`。

```sql
CREATE TABLE user_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_uid TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_uid)
);
```

`provider` 示例：

```text
phone
email
wechat_web
wechat_mini
apple
```

### 12.3 topics

```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  part TEXT NOT NULL,
  question TEXT NOT NULL,
  question_zh TEXT,
  season TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  content_json JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.4 reports

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  topic_id TEXT REFERENCES topics(id),
  client_platform TEXT NOT NULL DEFAULT 'web',
  audio_url TEXT,
  cos_key TEXT,
  transcript TEXT,
  basic_result_json JSONB NOT NULL DEFAULT '{}',
  deep_result_json JSONB,
  deep_status TEXT NOT NULL DEFAULT 'locked',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.5 soe_results

```sql
CREATE TABLE soe_results (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  provider TEXT NOT NULL DEFAULT 'tencent_soe',
  raw_result_json JSONB NOT NULL,
  normalized_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.6 llm_results

```sql
CREATE TABLE llm_results (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  input_json JSONB NOT NULL,
  output_json JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.7 user_credits

```sql
CREATE TABLE user_credits (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  deep_report_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.8 report_unlocks

```sql
CREATE TABLE report_unlocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  report_id TEXT NOT NULL REFERENCES reports(id),
  source TEXT NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_id)
);
```

### 12.9 orders

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  report_id TEXT REFERENCES reports(id),
  product_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'pending',
  client_platform TEXT NOT NULL DEFAULT 'web',
  provider TEXT NOT NULL,
  provider_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
```

### 12.10 audit_logs

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.11 platform_sessions

可选表。用于记录多端会话，便于后续 App 和小程序统一登录态管理。

```sql
CREATE TABLE platform_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  client_platform TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
```

## 13. 权限与解锁逻辑

### 13.1 报告访问

服务端必须判断：

- 当前用户是否拥有该报告。
- 当前用户是否管理员。
- 当前用户是否已解锁该报告。

未解锁时：

```json
{
  "deep_report": null
}
```

禁止把深度报告返回给前端再用 CSS 模糊遮挡。

### 13.2 解锁方式

支持：

- `paid`：订单支付。
- `credit`：消耗次数。
- `trial`：新用户首份体验。
- `admin`：管理员手动解锁。

### 13.3 深度报告生成时机

第一版采用：

```text
付费/解锁后再生成深度报告
```

状态：

```text
locked
→ generating
→ ready
→ failed
```

## 14. 对象存储与音频策略

### 14.1 存储策略

音频文件推荐存 COS：

```text
未登录用户：保存 7 天
免费用户：保存 30 天
付费用户：保存 90 天
人工复核订单：保存 180 天
```

到期删除音频，保留：

- 转写文本。
- 基础报告。
- 深度报告。
- 订单记录。

### 14.2 MVP 简化

如果 COS 尚未接入，MVP 可临时将音频保存到：

```text
/opt/ielts-speaking-api/data/uploads
```

但必须：

- 禁止 Nginx 直接暴露该目录。
- 定时清理。
- 文件名使用 UUID，不使用原始文件名。

## 15. 环境变量

后端 `.env`：

```env
APP_ENV=production
APP_HOST=127.0.0.1
APP_PORT=8710

DATABASE_URL=postgresql://user:password@127.0.0.1:5432/ielts_speaking

TENCENTCLOUD_SECRET_ID=
TENCENTCLOUD_SECRET_KEY=
TENCENT_SOE_REGION=ap-guangzhou
TENCENT_SOE_ENGINE=16k_en
TENCENT_SOE_SCORE_COEFF=4.0

COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=

LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=

ADMIN_TOKEN=
ALLOWED_ORIGINS=https://qqbytop.com,https://www.qqbytop.com
```

前端环境变量：

```env
NEXT_PUBLIC_IELTS_API_BASE=/tools/ielts-api
IELTS_API_BASE_URL=https://ielts-api.qqbytop.com
```

前端不得保存：

- 腾讯云密钥。
- COS 密钥。
- LLM API Key。
- 支付私钥。

## 16. 部署要求

### 16.1 DNS

```text
qqbytop.com              → Vercel
www.qqbytop.com          → Vercel
ielts-api.qqbytop.com    → 82.157.37.57
```

Web 用户看到的业务路径是：

```text
https://qqbytop.com/tools/ielts-speaking
https://qqbytop.com/tools/ielts-api/*
```

后续 App 和微信小程序直接调用：

```text
https://ielts-api.qqbytop.com/api/v1/*
```

### 16.2 腾讯云 VPS

已知服务器：

```text
地域：北京
公网 IP：82.157.37.57
系统：OpenCloudOS 9.4
配置：2 核 4GB / 70GB
已有：宝塔、Nginx、MySQL、Redis、Python 3.11
```

后端建议：

- 使用 Python venv。
- 使用 systemd。
- 使用 Nginx 反代。
- 不强依赖 Docker。

### 16.3 Nginx 配置

`ielts-api.qqbytop.com`：

```nginx
server {
    listen 80;
    server_name ielts-api.qqbytop.com;

    location / {
        proxy_pass http://127.0.0.1:8710;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25m;
        proxy_read_timeout 180s;
    }
}
```

SSL 由宝塔或 acme.sh 配置。

## 17. 安全与合规

### 17.1 支付安全

- 支付结果只信任 webhook。
- webhook 必须验签。
- 订单回调幂等。
- 重复回调不重复加次数。
- 退款后应记录权益变化。

### 17.2 数据安全

- 音频不可公开访问。
- `.env` 不放入 Git。
- 管理后台必须鉴权。
- 用户只能访问自己的报告。
- 后端接口限流。
- 上传文件做类型和大小校验。

### 17.3 宣传合规

禁止文案：

```text
官方雅思评分
雅思官方认证
保证提分
与真人考官完全一致
```

推荐文案：

```text
AI 预估分
参考 IELTS Speaking 四项维度
非官方成绩
用于备考诊断
```

## 18. SEO 与获客

### 18.1 页面类型

- 当季题库页。
- Part 1 题目页。
- Part 2 题目页。
- Part 3 题目页。
- 低分错误页。
- 发音纠错页。
- 高分表达页。

### 18.2 转化链路

```text
搜索题库
→ 题目页
→ 录音回答
→ 基础报告
→ 解锁深度报告
→ 购买次数包
```

### 18.3 小红书内容方向

- 雅思口语 5.5 卡分原因。
- Part 2 高频题拆解。
- Part 3 追问崩盘原因。
- 过去时错误。
- 中式英语表达。
- 发音高频错音。

## 19. 测试与验收

### 19.1 前端验收

- 用户可从题库页进入录音页。
- 麦克风权限异常有提示。
- 录音小于 8 秒不能提交。
- 录音提交后能看到基础报告。
- 未解锁时看不到深度报告 JSON。
- 解锁后能看到深度报告。
- 移动端页面不溢出。

### 19.2 后端验收

- `GET /health` 返回正常。
- 上传音频能创建报告。
- `/api/v1` 接口不依赖 Web 专属 Cookie，后续可供 App/小程序复用。
- 报告创建接口支持 `multipart/form-data`，并预留 `cos_key` 提交方式。
- SOE 调用失败时报告状态为 `failed`，不崩溃。
- LLM 输出 JSON 可校验。
- 重复获取报告不重复调用 LLM。
- 同一用户同一报告只能解锁一次。
- 未授权用户不能访问他人报告。

### 19.3 支付验收

- 创建订单成功。
- 支付成功回调后订单变 `paid`。
- 用户次数增加或报告解锁。
- 重复 webhook 不重复加次数。
- 支付失败不解锁。

### 19.4 管理后台验收

- 可查看报告列表。
- 可查看单个报告详情。
- 可查看 SOE 原始 JSON。
- 可重跑深度报告。
- 可作废报告。

## 20. 里程碑

### Phase 1：后端基础

- FastAPI 项目骨架。
- `/health`。
- 数据库连接。
- 报告表。
- systemd 部署。
- Nginx 反代。

### Phase 2：录音与基础报告

- 前端录音页。
- 音频上传。
- SOE 调用。
- 基础报告生成。
- 报告页展示。

### Phase 3：深度报告

- LLM 结构化诊断。
- 深度报告状态机。
- 解锁逻辑。
- 报告缓存。

### Phase 4：商业化

- 商品配置。
- 订单表。
- 支付 webhook。
- 次数包。
- 用户中心。
- 预留 `client_platform` 和 `provider`，使 Web、App、小程序支付共用订单模型。

### Phase 5：多端准备

- `user_identities` 接入微信小程序 OpenID。
- COS 直传模式。
- App/小程序共用 `/api/v1` 接口验收。

### Phase 6：流量与后台

- 当季题库页。
- SEO 元数据。
- 管理后台。
- 小红书落地页追踪。

## 21. 开发优先级

最高优先级：

```text
GET /health
POST /reports
GET /reports/{id}
SOE 标准化
基础报告
报告页
```

第二优先级：

```text
深度报告
用户登录
次数解锁
支付
```

第三优先级：

```text
后台审核
历史趋势
复练对比
人工复核
```

## 22. 最小可交付定义

V1 最小可交付必须跑通：

```text
用户访问 /tools/ielts-speaking
→ 选择一道题
→ 录音提交
→ 后端调用腾讯云 SOE
→ 页面展示基础报告
→ 用户点击解锁
→ 后端生成深度报告
→ 页面展示四项分数和逐句建议
```

如果支付暂未接入，可先用管理员测试解锁或测试次数包模拟，但数据结构必须按真实付费逻辑设计。
