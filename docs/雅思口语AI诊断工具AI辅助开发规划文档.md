# 雅思口语 AI 诊断工具 AI 辅助开发规划文档 (AI-Driven PRD)

> **致 AI 作者的系统提示 / System Prompt**
>
> 在开始编写代码之前，请完整阅读本文件。一切架构决策、技术栈、目录结构、API 路径、数据库 Schema、状态机、安全底线与部署方式必须严格以本文档为准。不要凭借自身习惯自由发挥，不要把后端写成只服务 Web 页面的临时代码。V1 先开发网页版，但后端必须从第一天开始支持 Web、App、微信小程序共用。
>
> 如果在执行某一步骤中遇到依赖冲突、腾讯云 SOE 参数不明确、支付渠道未开通、域名/DNS 未解析、密钥缺失、数据库连接失败或设计死角，请立即停止继续扩展代码，并在对应 Milestone 的【阻塞项说明】里记录原因，等待人类确认。不要用 mock 隐藏真实失败，除非该 Milestone 明确允许 mock。

---

## 🟢 第一部分：总纲与底层心智 (The Prompt Base)

### 1. 项目定位与核心目标

- **项目名称：** 雅思口语 AI 诊断工具。
- **目标域名：** `qqbytop.com`。
- **业务一句话描述：** 一个面向中国大陆雅思备考用户的 Web 优先、多端可复用的 AI 口语诊断工具，基于当季雅思口语题库、腾讯云 SOE 口语评测和 LLM 结构化分析，为用户提供基础报告、深度报告、扣分原因和训练计划。
- **核心交互对象：**
  - V1：Web 端 Next.js 页面。
  - 后续：iOS / Android App、微信小程序。
  - 管理侧：Next.js Admin 后台。
- **核心商业闭环：**

```text
题库页访问
→ 用户选择题目
→ 录音并提交
→ 后端调用腾讯云 SOE
→ 免费基础报告
→ 登录/付费/消耗次数
→ LLM 生成深度报告
→ 用户复练或购买次数包
```

- **MVP 核心验证：**
  - 用户是否愿意从题库页开始录音。
  - 基础报告是否能建立信任。
  - 用户是否愿意为深度报告付费。
  - 腾讯云 SOE + LLM 的诊断质量是否足以支撑转化。

### 2. 开发底线与工程心智 (System Directives)

- 后端必须是平台无关 API，严禁把业务逻辑写死在 Web Cookie、Vercel 环境或浏览器专属流程里。
- 所有对外业务 API 必须使用 `/api/v1/*` 版本路径。
- Web 端通过 `/tools/ielts-api/*` rewrite 到后端 `/api/v1/*`。
- App 和微信小程序后续直接请求 `https://ielts-api.qqbytop.com/api/v1/*`。
- 腾讯云 SOE、COS、LLM、支付密钥只允许出现在后端 `.env`，严禁写入前端代码、Git、静态文件或浏览器可见响应。
- 未解锁用户不得收到 `deep_report_json`。严禁先把深度报告返回给前端再用 CSS 模糊遮挡。
- 支付结果只信任支付平台 webhook。严禁信任前端传来的 `paid=true`、`success=true` 或本地状态。
- 所有订单回调必须幂等。重复 webhook 不得重复加次数、重复解锁或重复生成权益。
- 所有外部服务失败必须记录结构化日志，不允许静默吞错。
- 所有错误响应必须包含用户友好信息，内部错误细节只写入服务端日志。
- 所有请求必须带 TraceId 或在中间件中生成 TraceId，并贯穿日志。
- 所有数据库写操作必须有明确事务边界。
- 所有报告状态变更必须遵守本文档状态机。
- 所有 LLM 输出必须使用 Pydantic Schema 校验。校验失败应进入 `failed` 或 `needs_review`，不得把未校验文本直接展示给用户。
- SOE 到雅思分的映射只是“AI 预估分”，不得在代码、页面、文案中暗示官方雅思成绩。
- 页面文案严禁使用“官方认证”“保证提分”“等同真人考官”等表达。
- V1 不强依赖 Docker。当前腾讯云轻量服务器已有宝塔、Nginx、Python 3.11、MySQL、Redis，后端优先采用 `venv + systemd + Nginx` 部署。

### 3. 风险免责与边界说明 (Boundaries & Out-of-Scope)

#### 3.1 V1 绝对不涵盖的功能

- 不做官方 IELTS 授权、官方分数或官方替代考官声明。
- 不做摄像头表情识别和情绪 AI。
- 不做私有化 Whisper / MFA / wav2vec 发音引擎。
- 不做无限 AI 陪聊。
- 不做所有报告强制人工审核。
- 不做微信小程序第一版。
- 不做 App 第一版。
- 不做机构版后台第一版。
- 不做开放式自主 Agent 和不可控自动规划。V1 采用受控 LangGraph 多 Agent 状态机，节点固定、输入固定、输出固定、Pydantic 校验固定。

#### 3.2 已知技术风险与绕过

- **SOE 评分并非雅思官方分数。**
  - 绕过：页面统一使用“AI 预估分”“参考 IELTS Speaking 四项维度”。
- **SOE 百分制到雅思 0-9 的映射缺乏真人样本校准。**
  - 绕过：阈值表配置化，后续通过真人评分样本校准。
- **LLM 可能输出不自然、作文式或过度学术表达。**
  - 绕过：使用 LangGraph 分项 Agent，Prompt 中强制 spoken English register，输出必须带 evidence，并由 Critic/Validator 节点拦截。
- **音频上传和 SOE 调用耗时较长。**
  - 绕过：报告状态机异步化；基础报告优先返回，深度报告付费后生成。
- **Web、App、小程序支付规则不同。**
  - 绕过：订单表预留 `client_platform` 和 `provider`，支付适配层独立。
- **服务器当前没有 Docker 和 Node。**
  - 绕过：后端用 Python venv + systemd；前端部署在 Vercel。

---

## 🔵 第二部分：静态设计与硬性契约 (The Blueprints)

### 4. 技术栈选型与目录骨架

#### 4.1 前端技术栈

- 语言：TypeScript。
- 框架：Next.js。
- UI：React + Tailwind CSS。
- 部署：Vercel。
- 主要路径：

```text
/tools/ielts-speaking
/tools/ielts-speaking/topics
/tools/ielts-speaking/topics/[topicSlug]
/tools/ielts-speaking/record/[topicId]
/tools/ielts-speaking/report/[reportId]
/tools/ielts-speaking/pricing
/tools/ielts-speaking/account
/tools/ielts-admin
```

#### 4.2 后端技术栈

- 语言：Python 3.11。
- 框架：FastAPI。
- 工作流：LangGraph，必须使用受控状态机，不允许开放式自主 Agent。
- ASGI：Uvicorn。
- Schema：Pydantic。
- ORM：SQLAlchemy 2.0 或 SQLModel，二选一，不要混用。
- 数据库：PostgreSQL 优先；MVP 如暂未安装 PostgreSQL，可先记录阻塞项，不要临时改成 SQLite，除非人类确认。
- 缓存/队列：Redis 可后置；V1 可先同步处理基础报告，深度报告预留异步任务接口。
- 部署：腾讯云轻量服务器 `82.157.37.57`，`systemd` 守护，Nginx 反向代理。
- 端口：本地开发 FastAPI 可用 `127.0.0.1:8000`；生产 systemd 固定监听 `127.0.0.1:8710`；Vercel 通过 `IELTS_API_BASE_URL` 指向后端域名，不写死生产端口。

#### 4.3 后端强制目录结构

后端项目根目录：

```text
/opt/ielts-speaking-api
  /app
    /api
      /v1
        health.py
        auth.py
        topics.py
        reports.py
        orders.py
        payments.py
        me.py
        admin_reports.py
      router.py
    /core
      config.py
      logging.py
      security.py
      errors.py
    /db
      base.py
      session.py
      migrations.py
    /models
      user.py
      topic.py
      report.py
      order.py
      audit_log.py
    /schemas
      common.py
      user.py
      topic.py
      report.py
      order.py
      soe.py
      llm.py
    /services
      topic_service.py
      report_service.py
      soe_service.py
      scoring_service.py
      llm_service.py
      unlock_service.py
      order_service.py
      payment_service.py
      storage_service.py
      admin_service.py
    /repositories
      user_repo.py
      topic_repo.py
      report_repo.py
      order_repo.py
      audit_repo.py
    /integrations
      tencent_soe.py
      tencent_cos.py
      llm_client.py
      payment_client.py
    /graphs
      ielts_scoring_graph.py
      graph_state.py
      /nodes
        input_normalizer.py
        soe_node.py
        fc_agent.py
        lr_agent.py
        gra_agent.py
        pr_agent.py
        score_synthesizer.py
        report_critic.py
        schema_validator.py
        quality_gate.py
    /workers
      deep_report_worker.py
    main.py
  /scripts
    init_db.py
    seed_topics.py
    run_local.sh
  /tests
    test_health.py
    test_report_state.py
    test_unlock.py
    test_scoring_mapping.py
  /logs
  .env
  .env.example
  requirements.txt
  README.md
```

禁止：

- 禁止把后端源码放进 `/www/wwwroot`。
- 禁止把 `.env` 放进可公开访问目录。
- 禁止把业务逻辑写在 `main.py` 里。`main.py` 只负责装配应用、路由和中间件。

### 5. 核心外部系统交互 (API/Dependencies)

#### 5.1 腾讯云 SOE

用途：

- 发音准确度。
- 流利度。
- 完整度。
- 单词级错误。
- 音素级错误。
- 停顿特征。

参数契约：

```text
server_engine_type = 16k_en
score_coeff = 4.0 或后端配置项
```

评测模式：

| 场景 | eval_mode |
|---|---:|
| 雅思 Part 1/2/3 自由回答 | 3 |
| 句子跟读 | 1 |
| 段落朗读 | 2 |
| 单词音素纠错 | 4 |

SOE 原始结果必须保存到 `soe_results.raw_result_json`，标准化结果保存到 `soe_results.normalized_json`。

SOE 转写边界：

- SOE 在自由说/流式评测场景中可返回识别文本、断句和单词级结果，但它不是通用 ASR 产品。
- V1 允许先使用 SOE 识别结果作为 `transcript`，但必须记录 `transcript_source = "soe"`。
- 如果长回答转写质量不足，新增独立 ASR Provider，例如腾讯云语音识别或 Whisper；不得让 LR/GRA Agent 在没有可靠 transcript 的情况下强行生成深度报告。
- 后台必须允许人工修正 transcript，修正后记录 `transcript_source = "manual"` 或 `"mixed"`。
- PR Agent 只允许引用 SOE 音素/单词证据，不能凭转写文本猜发音。

#### 5.2 LLM

用途：

- 语法诊断。
- 词汇升级。
- 连贯性分析。
- 雅思四项评分解释。
- 7 天训练计划。

约束：

- LLM 不负责原始发音评分。
- LLM 输出必须是 JSON。
- LLM 输出必须通过 Pydantic 校验。
- LLM Prompt 版本必须写入 `llm_results.prompt_version`。

#### 5.3 COS

用途：

- 存储用户音频。
- 后续存储数据库备份和报告导出文件。

MVP 允许临时本地存储，但必须保留 `cos_key` 字段和 `storage_service` 抽象。

#### 5.4 支付渠道

V1 先设计数据结构，实际接入可延后。

平台差异：

| 平台 | 登录 | 支付 |
|---|---|---|
| Web | 手机号、邮箱、微信网页授权 | 微信 H5、支付宝网页 |
| App | 手机号、Apple、微信 | App 内购或微信/支付宝 |
| 微信小程序 | 微信 OpenID | 微信小程序支付 |

支付回调必须验签、幂等、事务化。

#### 5.5 LangGraph 诊断状态机

V1 必须采用受控 LangGraph 多 Agent 状态机。这里的“多 Agent”不是开放式自主规划，而是固定节点、固定输入、固定输出、固定校验的诊断管线。

强制图结构：

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
| InputNormalizer | 清洗输入、统一题目、音频、ASR、SOE 字段 | 不打分 |
| SOEEvaluationNode | 调用或读取腾讯云 SOE，生成标准化发音数据 | 不生成雅思四项报告 |
| BasicMetricsNode | 计算时长、WPM、停顿、有效内容长度 | 不调用 LLM |
| FC Agent | 判断流利度、连贯性、答题展开、停顿类型 | 不纠语法，不升级词汇 |
| LR Agent | 判断词汇重复、搭配、地道表达、话题词 | 不纠语法，不写整篇范文 |
| GRA Agent | 判断时态、主谓一致、句型复杂度、错误密度 | 不评价词汇和发音 |
| PR Agent | 基于 SOE 数据解释发音、音素、重音、流利度 | 不凭文本猜发音 |
| ScoreSynthesizer | 汇总四项分数、总分和提分优先级 | 不重新发明子 Agent 结论 |
| ReportCritic | 检查分数自洽性、证据充分性、建议自然度 | 不生成新报告 |
| SchemaValidator | Pydantic 校验最终 JSON | 不做语义判断 |
| QualityGate | 决定 ready、repairable、needs_review、failed | 不修改报告内容 |

强制质量规则：

- 每个 Agent 输出必须有独立 Pydantic Schema。
- 每个 Agent 输出必须入库或写入可追踪日志，便于后台定位问题。
- ScoreSynthesizer 只能基于子 Agent 结果汇总，不得忽略子 Agent evidence。
- ReportCritic 如果发现“分数与证据矛盾”“建议无 evidence”“PR 凭文本猜测发音”“LR 建议过度书面化”，必须打回。
- AutoRepair 最多执行 1 次。修复失败进入 `needs_review`，不得无限重试。
- QualityGate 发现高风险输出时必须进入 `needs_review`，不能硬转 `ready`。

### 6. 核心数据实体与 Schema

#### 6.1 枚举定义

```python
from typing import Literal

ClientPlatform = Literal["web", "app", "wechat_mini"]
ReportStatus = Literal["active", "voided", "deleted"]
DeepStatus = Literal["locked", "generating", "ready", "failed", "needs_review"]
UnlockSource = Literal["paid", "credit", "trial", "admin"]
OrderStatus = Literal["pending", "paid", "failed", "refunded", "closed"]
PaymentProvider = Literal["wechat_h5", "wechat_jsapi", "alipay_web", "apple_iap", "manual"]
IdentityProvider = Literal["phone", "email", "wechat_web", "wechat_mini", "apple"]
IELTSPart = Literal["part1", "part2", "part3"]
```

#### 6.2 User

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    id: str
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    primary_platform: Optional[ClientPlatform] = None
```

#### 6.3 UserIdentity

```python
class UserIdentity(BaseModel):
    id: str
    user_id: str
    provider: IdentityProvider
    provider_uid: str
    verified_at: Optional[str] = None
```

#### 6.4 Topic

```python
class Topic(BaseModel):
    id: str
    slug: str
    part: IELTSPart
    question: str
    question_zh: Optional[str] = None
    season: Optional[str] = None
    tags: list[str] = []
    content_json: dict = {}
    is_active: bool = True
```

#### 6.5 Report

```python
class Report(BaseModel):
    id: str
    user_id: Optional[str] = None
    topic_id: str
    client_platform: ClientPlatform = "web"
    audio_url: Optional[str] = None
    cos_key: Optional[str] = None
    transcript: Optional[str] = None
    basic_result_json: dict = {}
    deep_result_json: Optional[dict] = None
    deep_status: DeepStatus = "locked"
    status: ReportStatus = "active"
```

#### 6.6 Normalized SOE Result

```python
class PhoneInfo(BaseModel):
    phone: str
    accuracy: float
    start_ms: int | None = None
    end_ms: int | None = None

class WordInfo(BaseModel):
    word: str
    start_ms: int | None = None
    end_ms: int | None = None
    accuracy: float | None = None
    match_tag: int | None = None
    phones: list[PhoneInfo] = []

class NormalizedSOEResult(BaseModel):
    provider: str = "tencent_soe"
    engine: str = "16k_en"
    eval_mode: int
    raw_score: float | None = None
    pron_accuracy: float | None = None
    pron_fluency: float | None = None
    integrity: float | None = None
    words_pause: int | None = None
    words: list[WordInfo] = []
```

#### 6.7 Basic Report

```python
class BasicReport(BaseModel):
    duration_sec: int
    wpm: float | None = None
    pause_count: int | None = None
    pronunciation_score: float | None = None
    fluency_score: float | None = None
    estimated_band_range: str
    key_issues: list[str]
    locked_deep_preview: dict
```

#### 6.8 Deep Report

```python
class IELTSScores(BaseModel):
    fc: float
    lr: float
    gra: float
    pr: float
    overall: float

class Issue(BaseModel):
    dimension: Literal["FC", "LR", "GRA", "PR"]
    severity: Literal["low", "medium", "high"]
    title: str
    evidence: str
    suggestion: str

class SentenceFeedback(BaseModel):
    original: str
    issue_type: str
    corrected: str
    reason: str

class TrainingTask(BaseModel):
    day: int
    task: str
    practice_items: list[str]

class DeepReport(BaseModel):
    scores: IELTSScores
    summary: str
    top_issues: list[Issue]
    sentence_feedback: list[SentenceFeedback]
    vocabulary_upgrades: list[dict]
    pronunciation_feedback: list[dict]
    training_plan: list[TrainingTask]
```

#### 6.9 Order

```python
class Order(BaseModel):
    id: str
    user_id: str | None = None
    report_id: str | None = None
    product_id: str
    amount_cents: int
    currency: str = "CNY"
    status: OrderStatus = "pending"
    client_platform: ClientPlatform = "web"
    provider: PaymentProvider
    provider_order_id: str | None = None
```

### 7. 核心业务状态机 (State Machine)

#### 7.1 Report Deep Status

唯一合法状态集合：

```text
locked
generating
ready
failed
needs_review
```

转移规则：

```text
locked -> generating
  条件：用户已支付、消耗次数、首份体验或管理员解锁。

generating -> ready
  条件：LLM 输出通过 Pydantic 校验，且报告 JSON 成功入库。

generating -> failed
  条件：SOE/LLM/数据库写入失败，且重试后仍失败。

generating -> needs_review
  条件：LLM 输出可解析但存在风险，例如分数异常、空内容、疑似越狱、ASR 乱码。

failed -> generating
  条件：管理员或系统重试。

needs_review -> ready
  条件：管理员审核通过。

ready -> generating
  条件：管理员手动重跑。必须保留旧版本 llm_result 记录。
```

禁止转移：

```text
ready -> locked
failed -> ready  # 未重新生成或人工修复时禁止
locked -> ready  # 必须经过 generating 或 admin 特殊操作并写 audit_log
```

#### 7.2 Order Status

唯一合法状态集合：

```text
pending
paid
failed
refunded
closed
```

转移规则：

```text
pending -> paid
  条件：支付平台 webhook 验签通过，金额、订单号、状态一致。

pending -> failed
  条件：支付平台明确失败。

pending -> closed
  条件：超时未支付。

paid -> refunded
  条件：退款 webhook 或管理员确认退款。
```

禁止转移：

```text
failed -> paid
refunded -> paid
closed -> paid
```

#### 7.3 Unlock

解锁来源：

```text
paid
credit
trial
admin
```

约束：

- 同一 `user_id + report_id` 只能解锁一次。
- 消耗次数必须事务化：扣减 `user_credits` 与写入 `report_unlocks` 必须同一事务。
- 支付解锁必须由 `orders.status = paid` 触发，不得由前端触发。

#### 7.4 Auth Session

V1 使用验证码登录，不做账号密码。

合法状态：

```text
anonymous
code_sent
authenticated
expired
revoked
```

约束：

- 未登录用户可以创建基础报告，但只能保存短期匿名记录。
- 点击解锁深度报告时必须先登录。
- `POST /api/v1/auth/send-code` 只发送验证码，不暴露用户是否已注册。
- `POST /api/v1/auth/verify-code` 成功后创建或复用 `users`，写入 `user_identities` 和 `platform_sessions`。
- `POST /api/v1/auth/logout` 必须撤销当前 session。
- 前端登录成功只能继续购买或消耗额度，不能绕过后端解锁校验。

---

## 🟠 第三部分：执行控制平台 (The Execution Engine)

### 8. 全局推荐开发顺序 (Global Execution Order)

执行顺序必须严格如下：

1. Milestone 1：后端工程骨架、配置、日志、健康检查。
2. Milestone 2：数据库 Schema、Repository、基础迁移。
3. Milestone 3：题库与报告基础 CRUD。
4. Milestone 4：腾讯云 SOE 集成与基础报告。
5. Milestone 5：前端题库、录音、基础报告页面。
6. Milestone 6：LangGraph 多 Agent 深度诊断状态机。
7. Milestone 7：解锁、次数包、订单骨架。
8. Milestone 8：管理后台与审核能力。
9. Milestone 9：部署、反代、域名与生产验收。

严禁未完成上一阶段验收就进入下一阶段。若必须并行，只允许前端静态页面与后端接口 mock 并行，但 mock 名称必须明确标记，不得冒充真实 SOE/LLM。

### 9. 切分出来的多个里程碑 (Milestones)

> **致 AI 的执行规范：** 请严格按顺序解锁 Milestone。在未完成上一阶段的验收时，严禁开始下一个阶段。每次对代码进行重大推进，请自行更新“当前进度”。如果遇到缺少密钥、域名未解析、依赖安装失败、腾讯云接口不通、数据库未安装等问题，必须在对应【阻塞项说明】记录，不要绕过。

---

## 🏁 Milestone 1：后端工程骨架与健康检查

### 🎯 局部任务目标

建立 FastAPI 后端项目骨架，打通配置读取、日志、错误处理、中间件和 `/health`。

### 🚧 前置依赖

无。

### 👣 局部微观执行步骤

1. 在 `/opt/ielts-speaking-api` 或本地开发目录创建强制目录结构。
2. 创建 `requirements.txt`。
3. 创建 `app/core/config.py`，使用 Pydantic Settings 读取 `.env`。
4. 创建 `app/core/logging.py`，实现带 TraceId 的结构化日志。
5. 创建 `app/core/errors.py`，统一异常响应。
6. 创建 `app/api/v1/health.py`。
7. 创建 `app/main.py`，挂载 `/api/v1` 路由。
8. 增加测试 `tests/test_health.py`。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 暂无。

### 📋 局部阶段验收清单

- [ ] `GET /api/v1/health` 返回 `ok=true`。
- [ ] 每个请求日志包含 TraceId。
- [ ] 缺少必要 `.env` 时服务 Fail-Fast。
- [ ] 单元测试通过。

---

## 🏁 Milestone 2：数据库基建与核心实体

### 🎯 局部任务目标

将第 6 节 Schema 落地成真实 ORM Models、数据库连接、Repository 和初始化脚本。

### 🚧 前置依赖

Milestone 1 完成。

### 👣 局部微观执行步骤

1. 编写 `app/db/session.py`。
2. 编写 ORM Models：User、UserIdentity、Topic、Report、SOEResult、LLMResult、UserCredit、ReportUnlock、Order、AuditLog、PlatformSession。
3. 编写 Repository 基础 CRUD。
4. 编写 `scripts/init_db.py`。
5. 写入基础题库 seed 脚本 `scripts/seed_topics.py`。
6. 编写数据库测试。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 如果 PostgreSQL 未安装或无连接串，在这里记录并停止。

### 📋 局部阶段验收清单

- [ ] 所有表可创建。
- [ ] 外键无错误。
- [ ] 可插入一个 topic。
- [ ] 可创建一个 report。
- [ ] `user_identities` 唯一约束生效。
- [ ] `report_unlocks` 的 `user_id + report_id` 唯一约束生效。

---

## 🏁 Milestone 3：题库与报告基础 API

### 🎯 局部任务目标

实现题库读取、报告创建、报告查询的基础 API。不接 SOE 前允许返回受控 mock 基础报告，但必须标记 `provider=mock`。

### 🚧 前置依赖

Milestone 2 完成。

### 👣 局部微观执行步骤

1. 实现 `GET /api/v1/topics`。
2. 实现 `GET /api/v1/topics/{slug}`。
3. 实现 `POST /api/v1/reports`，支持 `multipart/form-data`。
4. 预留 `cos_key` JSON 提交方式。
5. 实现 `GET /api/v1/reports/{report_id}`。
6. 未解锁时确保 `deep_report=null`。
7. 写测试覆盖报告归属和未解锁逻辑。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 暂无。

### 📋 局部阶段验收清单

- [ ] 可获取题库列表。
- [ ] 可上传一段测试音频创建报告。
- [ ] 未解锁报告不返回深度报告。
- [ ] 超过大小限制的音频被拒绝。
- [ ] 小于 8 秒的音频被拒绝或标记为有效内容不足。

---

## 🏁 Milestone 4：腾讯云 SOE 集成与基础报告

### 🎯 局部任务目标

接入腾讯云 SOE，标准化结果，生成基础报告。

### 🚧 前置依赖

Milestone 3 完成。需要腾讯云 SOE 可用密钥。

### 👣 局部微观执行步骤

1. 编写 `app/integrations/tencent_soe.py`。
2. 编写 `app/services/soe_service.py`。
3. 设置 SOE 参数：
   - `server_engine_type=16k_en`
   - 自由说 `eval_mode=3`
4. 保存 SOE raw JSON。
5. 生成 NormalizedSOEResult。
6. 编写 `scoring_service.py`，从 SOE 结果映射 PR 和基础报告。
7. 更新 `POST /api/v1/reports`，真实生成基础报告。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 如果 `TENCENTCLOUD_SECRET_ID`、`TENCENTCLOUD_SECRET_KEY` 或 SOE 权限缺失，在这里记录并停止真实接入。

### 📋 局部阶段验收清单

- [ ] SOE 请求成功。
- [ ] SOE raw JSON 入库。
- [ ] normalized JSON 入库。
- [ ] 基础报告包含时长、发音、流利度、预估分区间、关键问题。
- [ ] SOE 失败时报告状态可追踪，不产生 500 裸错误。

---

## 🏁 Milestone 5：Web 前端题库、录音与基础报告

### 🎯 局部任务目标

在 Next.js 中实现 V1 Web 端最小闭环页面：题库页、录音页、报告页。

### 🚧 前置依赖

Milestone 3 可并行 mock，正式验收依赖 Milestone 4。

### 👣 局部微观执行步骤

1. 实现 `/tools/ielts-speaking`。
2. 实现 `/tools/ielts-speaking/topics`。
3. 实现 `/tools/ielts-speaking/topics/[topicSlug]`。
4. 实现 `/tools/ielts-speaking/record/[topicId]`。
5. 使用浏览器 MediaRecorder 录音。
6. 提交音频到 `/tools/ielts-api/reports`。
7. 实现 `/tools/ielts-speaking/report/[reportId]`。
8. 未解锁时展示深度报告锁定区。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 暂无。

### 📋 局部阶段验收清单

- [ ] 移动端可完成录音。
- [ ] 麦克风权限拒绝时有用户友好提示。
- [ ] 录音页不出现布局溢出。
- [ ] 上传后跳转报告页。
- [ ] 报告页未解锁时不请求或不显示深度报告。

---

## 🏁 Milestone 6：LangGraph 多 Agent 深度诊断状态机

### 🎯 局部任务目标

实现付费后可生成的受控 LangGraph 深度诊断状态机，包含 FC、LR、GRA、PR 分项 Agent、ScoreSynthesizer、ReportCritic、SchemaValidator 和 QualityGate，最终输出四项分数、逐句诊断、词汇升级、发音反馈和 7 天训练计划。

### 🚧 前置依赖

Milestone 4 完成。需要 LLM API Key。

### 👣 局部微观执行步骤

1. 编写 `app/integrations/llm_client.py`。
2. 编写 `app/services/llm_service.py`。
3. 编写 DeepReport Pydantic Schema。
4. 编写 `app/graphs/graph_state.py`，定义全图共享状态。
5. 编写各节点：
   - `input_normalizer.py`
   - `soe_node.py`
   - `fc_agent.py`
   - `lr_agent.py`
   - `gra_agent.py`
   - `pr_agent.py`
   - `score_synthesizer.py`
   - `report_critic.py`
   - `schema_validator.py`
   - `quality_gate.py`
6. 编写 `app/graphs/ielts_scoring_graph.py`，固定图结构，不允许运行时自由改边。
7. 为 FC/LR/GRA/PR 分别编写 Prompt v1。
8. 实现 `deep_report_worker.py` 调用 LangGraph。
9. 状态机：`locked -> generating -> ready/failed/needs_review`。
10. 记录每个 Agent 输出到 `llm_results` 或可追踪的节点输出表。
11. 添加黄金用例测试，至少 10 条，后续扩展到 50 条。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 如果 LLM API Key 缺失，在这里记录并停止真实生成，可保留 mock 但不得当作完成验收。

### 📋 局部阶段验收清单

- [ ] LLM 输出可被 Pydantic 校验。
- [ ] 校验失败进入 `failed` 或 `needs_review`。
- [ ] 深度报告不包含官方成绩承诺。
- [ ] 每条核心建议有 evidence。
- [ ] 同一报告重复获取不重复调用 LLM。
- [ ] FC/LR/GRA/PR 四个 Agent 可独立测试。
- [ ] PR Agent 只基于 SOE 数据解释发音，不凭转写文本猜发音。
- [ ] LR Agent 不输出过度学术或作文式表达。
- [ ] GRA Agent 不把“简单但正确”的回答评为高语法分。
- [ ] ReportCritic 能拦截至少 3 类质量问题。
- [ ] QualityGate 能把高风险报告转为 `needs_review`。

---

## 🏁 Milestone 7：解锁、次数包与订单骨架

### 🎯 局部任务目标

实现深度报告解锁机制、次数包、订单状态机。支付真实渠道可后置，但订单模型和 webhook 入口必须按生产方式设计。

### 🚧 前置依赖

Milestone 6 完成。

### 👣 局部微观执行步骤

1. 实现 `POST /api/v1/reports/{id}/unlock-with-credit`。
2. 实现 `POST /api/v1/orders`。
3. 实现 `POST /api/v1/payments/webhook` 骨架。
4. 实现 `user_credits` 扣减事务。
5. 实现 `report_unlocks` 唯一约束。
6. 写订单幂等测试。
7. 预留 `client_platform` 和 `provider`。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 如果微信支付/支付宝商户未开通，记录为支付接入阻塞，但订单骨架仍可完成。

### 📋 局部阶段验收清单

- [ ] 有次数时可解锁报告。
- [ ] 无次数时返回明确错误。
- [ ] 重复解锁不重复扣次数。
- [ ] webhook 重复回调不重复加次数。
- [ ] 订单状态非法转移被拒绝。

---

## 🏁 Milestone 8：管理后台与审核能力

### 🎯 局部任务目标

实现最小管理后台 API 和 Next.js 页面，用于查看报告、SOE 原始结果、LLM 输出、重跑和作废。

### 🚧 前置依赖

Milestone 6 完成。

### 👣 局部微观执行步骤

1. 实现 `GET /api/v1/admin/reports`。
2. 实现 `GET /api/v1/admin/reports/{id}`。
3. 实现管理员重跑深度报告。
4. 实现管理员作废报告。
5. 写 audit_log。
6. 创建 `/tools/ielts-admin` 页面。
7. 管理后台必须有鉴权，MVP 可先用 `ADMIN_TOKEN`。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 暂无。

### 📋 局部阶段验收清单

- [ ] 未带管理员权限不能访问后台 API。
- [ ] 可查看报告列表。
- [ ] 可查看 SOE raw JSON。
- [ ] 可查看 LLM 输出。
- [ ] 重跑会保留旧 LLM 记录。
- [ ] 作废报告写入 audit_log。

---

## 🏁 Milestone 9：部署、反代与生产验收

### 🎯 局部任务目标

把后端部署到腾讯云轻量服务器，配置 `ielts-api.qqbytop.com`，前端 Vercel rewrite 到后端。

### 🚧 前置依赖

Milestone 1 至 Milestone 7 完成。需要 DNS 解析权限和服务器权限。

### 👣 局部微观执行步骤

1. 在腾讯云 DNS 中解析：
   - `qqbytop.com -> Vercel`
   - `www.qqbytop.com -> Vercel`
   - `ielts-api.qqbytop.com -> 82.157.37.57`
2. 在服务器创建 `/opt/ielts-speaking-api`。
3. 创建 Python venv。
4. 安装依赖。
5. 创建 `.env`。
6. 创建 systemd service。
7. 配置 Nginx 反代到 `127.0.0.1:8710`。
8. 配置 SSL。
9. Vercel 配置 rewrite。
10. 生产环境跑通 `/api/v1/health`。

### 📊 当前进度 (Current Progress)

待启动。

AI 修改区：

- 暂无。

### 🛑 阻塞项说明 (Blockers)

AI 修改区：

- 如果 DNS 未解析或 SSL 申请失败，在这里记录。

### 📋 局部阶段验收清单

- [ ] `https://ielts-api.qqbytop.com/api/v1/health` 正常。
- [ ] `https://qqbytop.com/tools/ielts-api/health` 经 Vercel rewrite 正常。
- [ ] systemd 重启后服务自动恢复。
- [ ] Nginx 日志和应用日志可查看。
- [ ] 生产环境 `.env` 不在公开目录。

---

## 🔴 第四部分：总验收与收尾把控 (The Final QC)

### 10. 最终集成验收清单 (Global Acceptance Checklist)

在所有 Milestone 的标记均变为“已完成”后，才允许合并进入生产发布。

#### 10.1 环境与配置

- [ ] `.env` 缺少关键密钥时项目启动 Fail-Fast。
- [ ] 篡改数据库密码后项目启动或健康检查明确失败，不进入半运行状态。
- [ ] 前端环境变量不包含腾讯云、COS、LLM、支付私钥。
- [ ] 后端 `.env` 不在 `/www/wwwroot`。

#### 10.2 API 与状态机

- [ ] 所有业务接口位于 `/api/v1/*`。
- [ ] Web rewrite `/tools/ielts-api/*` 正常转发。
- [ ] 未解锁报告不返回 `deep_report_json`。
- [ ] `locked -> generating -> ready` 路径可跑通。
- [ ] `generating -> failed` 路径可观测。
- [ ] 订单非法状态转移被拒绝。

#### 10.3 破坏性测试

- [ ] 上传超大音频被拒绝，不产生 Server 500。
- [ ] 上传非音频文件被拒绝。
- [ ] 空录音或小于 8 秒录音不触发昂贵 LLM。
- [ ] 越狱文本不会改变系统 Prompt 或直接给 9 分。
- [ ] 重复点击解锁不会重复扣次数。
- [ ] 重复 webhook 不会重复发放权益。

#### 10.4 日志与审计

- [ ] 每个请求都有 TraceId。
- [ ] SOE 调用失败有 ERROR 日志。
- [ ] LLM 校验失败有 ERROR 日志。
- [ ] 管理员作废、重跑、手动解锁写入 audit_log。
- [ ] 日志不输出明文密钥。

#### 10.5 多端复用

- [ ] 后端接口不依赖 Web 专属 Cookie。
- [ ] `client_platform` 可记录 `web/app/wechat_mini`。
- [ ] `user_identities` 可绑定 `wechat_mini`。
- [ ] 报告创建接口预留 `cos_key` 模式。
- [ ] App/小程序可直接调用 `https://ielts-api.qqbytop.com/api/v1/*`。

#### 10.6 生产部署

- [ ] systemd service 可启动、停止、重启。
- [ ] Nginx 反代可用。
- [ ] SSL 可用。
- [ ] Vercel rewrite 可用。
- [ ] 服务重启后 `/api/v1/health` 正常。

### 11. 第一版最小可交付定义

第一版必须可演示：

```text
用户访问 https://qqbytop.com/tools/ielts-speaking
→ 选择一道雅思口语题
→ 录音并提交
→ 后端调用腾讯云 SOE
→ 页面展示免费基础报告
→ 用户通过测试方式解锁深度报告
→ 后端生成 LLM 深度报告
→ 页面展示四项预估分、扣分原因、逐句建议和训练计划
```

如果支付渠道尚未开通，允许使用 `admin` 或测试次数包模拟解锁，但数据库结构、订单状态机和接口必须按真实商业化方式保留。

### 12. 当前阻塞项总表

AI 修改区：

- [ ] 腾讯云 SOE SecretId / SecretKey 是否已准备。
- [ ] `ielts-api.qqbytop.com` DNS 是否已解析到 `82.157.37.57`。
- [ ] PostgreSQL 是否使用 VPS 自建还是腾讯云托管。
- [ ] LLM API Key 与模型是否已确定。
- [ ] 支付渠道第一版是否接入，或先使用测试解锁。
