# 雅思口语 AI 诊断工具 DESIGN.md

## Product Context

雅思口语 AI 诊断工具是 `qqbytop.com` 工具矩阵中的应试口语诊断产品。它面向中国大陆雅思备考用户，帮助用户围绕当季口语题库完成录音练习，获得免费基础报告，并通过付费解锁深度报告、四项预估分、扣分证据、逐句修改建议和训练计划。

设计目标不是做一个 AI 概念营销页，而是做一个可信、紧凑、能直接开始练习的“雅思口语诊断工作台”。

用户打开页面后应在 3 秒内知道：

- 这里可以直接练当季雅思口语题。
- 录音后可以免费获得基础报告。
- 深度报告会解释扣分原因，而不是只给分。
- 分数是 AI 预估分，非官方 IELTS 成绩。
- 付费解锁的是证据、逐句建议和训练计划。

## Reference Direction

本设计方向参考几类相邻产品原则，但不复制任何品牌视觉：

- 应试工具的高效率：题目、计时、录音、报告路径必须短。
- 医疗/诊断类报告的信息层级：先结论，再证据，再方案。
- 专业教育产品的可信表达：严谨、克制、不要娱乐化。
- 训练工具的复练反馈：让用户愿意重录同一道题。

最终视觉关键词：

```text
严谨
清晰
低压
考前冲刺
工具型
可复练
```

禁止视觉方向：

- 紫色渐变 AI 工具风。
- 大面积深蓝/紫蓝科技感。
- 营销型 hero 长页面。
- 卡片套卡片。
- 装饰性插画、抽象光效和渐变圆球。
- 游戏化过重，削弱考试可信度。
- 一屏塞满大段文案说明功能。

## Visual Principles

### 1. 工具优先

首屏必须是练习入口，不是品牌故事。用户进入 `/tools/ielts-speaking` 后，应直接看到：

- 当前题库季节。
- Part 1 / Part 2 / Part 3 切换。
- 高频题目列表。
- “录音回答”按钮。
- 最近一次报告入口。

### 2. 诊断可信

报告页要像专业诊断单，而不是聊天机器人回复。必须有：

- 四项分数。
- 证据片段。
- 扣分原因。
- 优先级。
- 下一次练习任务。

不要只展示“你的口语不错”这类泛反馈。

### 3. 开口低压

录音页要减少用户心理负担：

- 视觉焦点只保留题目、计时器、录音按钮。
- 允许重录。
- 明确提示“先练习，不是正式成绩”。
- 不在录音前展示复杂评分标准。

### 4. 付费转化克制

基础报告必须给真实价值，深度报告锁定区只锁证据和方案。CTA 文案买结果，不买次数：

```text
解锁我的扣分原因
查看逐句修改建议
生成 7 天提分计划
```

避免：

```text
购买 Token
购买 AI 调用
立即充值
```

### 5. 移动端优先

雅思备考用户很可能从小红书、微信、手机浏览器进入。所有核心流程必须手机上可完成：

```text
浏览题目
录音
查看基础报告
解锁深度报告
复练
```

任何横向表格都要在移动端改为纵向卡片或分组列表。

## Color Tokens

使用语义 token，不在组件里散写颜色。

```css
:root {
  --ielts-canvas: #f6f3ec;
  --ielts-surface: #ffffff;
  --ielts-surface-soft: #fbfaf6;
  --ielts-surface-tint: #eef6f2;
  --ielts-ink: #16211f;
  --ielts-ink-strong: #071311;
  --ielts-muted: #63706c;
  --ielts-subtle: #89938f;
  --ielts-line: #ddd6c9;
  --ielts-line-soft: #ece6da;
  --ielts-brand: #0f5a4a;
  --ielts-brand-hover: #12705c;
  --ielts-brand-soft: #dcefe9;
  --ielts-accent: #b46b22;
  --ielts-accent-soft: #fff0d8;
  --ielts-danger: #9c3d32;
  --ielts-danger-soft: #f9e8e5;
  --ielts-warning: #9a6a14;
  --ielts-warning-soft: #fff5d8;
  --ielts-success: #2e7b55;
  --ielts-success-soft: #e4f3ea;
  --ielts-info: #2e6171;
  --ielts-info-soft: #e3f0f3;
  --ielts-shadow-sm: 0 1px 3px rgba(22, 33, 31, 0.06);
  --ielts-shadow-md: 0 4px 12px rgba(22, 33, 31, 0.08);
  --ielts-shadow-lg: 0 10px 30px rgba(22, 33, 31, 0.12);
  --ielts-radius-sm: 6px;
  --ielts-radius-md: 8px;
  --ielts-transition-fast: 150ms ease;
  --ielts-transition-base: 220ms ease;
}
```

颜色使用规则：

- 主背景：暖纸色 `--ielts-canvas`。
- 主要工具面板：白色 `--ielts-surface`。
- 主 CTA：深绿 `--ielts-brand`。
- 价格和高价值权益：暖金 `--ielts-accent`。
- 严重扣分问题：红棕 `--ielts-danger`。
- 一般提醒：琥珀 `--ielts-warning`。
- 进步和通过：绿色 `--ielts-success`。

## Typography

字体策略：

```text
中文：使用系统中文字体，避免奇怪 display 字体影响阅读。
英文题目和答案片段：使用 Georgia / Charter 类 serif fallback，增强考试材料感。
数字和分数：使用 tabular-nums。
```

CSS 建议：

```css
.ielts-root {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  letter-spacing: 0;
}

.ielts-question,
.ielts-answer-evidence {
  font-family: Georgia, "Times New Roman", serif;
}

.ielts-score {
  font-variant-numeric: tabular-nums;
}
```

字号规则：

- 页面 H1：32-40px desktop，26-30px mobile。
- 工具面板标题：18-22px。
- 题目正文：20-24px desktop，18-20px mobile。
- 报告正文：15-17px。
- 证据片段：15-16px。
- 标签和元信息：12-13px。

不要使用 viewport width 动态缩放字体。

## Layout System

### 页面宽度

```css
.ielts-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .ielts-shell {
    padding: 16px;
  }
}
```

### 栅格

题库和报告页 desktop 使用 12 栏思路：

```text
左侧主内容：8 栏
右侧行动栏：4 栏
```

移动端：

```text
全部单列
行动栏改为底部 sticky CTA
```

### 卡片规则

- 卡片圆角最大 8px。
- 不允许卡片套卡片。
- 页面区块不要全部做成浮动卡片。
- 重复题目项、报告问题项、价格项可以使用卡片。
- 报告主区块用白色面板和分割线，不要堆叠装饰阴影。

## Route-Level Design

## 1. `/tools/ielts-speaking`

### 页面目标

承接 SEO、小红书和直接访问流量，让用户快速进入题库练习。

### Desktop 布局

```text
TopBar
MainBand
  Left: 当季题库与快速开始
  Right: 最近报告 / 今日练习次数 / 价格入口
PartTabs
TopicList
WhyTrustBand
FAQ
```

### 首屏模块

#### TopBar

元素：

- Logo / `QQBYTOP IELTS Speaking`
- 入口：题库、报告、价格、登录
- 移动端折叠菜单

#### MainBand

左侧：

- H1：`雅思口语当季题库 AI 诊断`
- 支持文案：`录音回答一道题，先看免费基础报告，再决定是否解锁深度扣分原因。`
- 主要 CTA：`开始免费诊断`
- 次要 CTA：`查看当季高频题`

右侧：

- `本季题库` 摘要
- `Part 1 / 2 / 3` 数量
- `AI 预估分，非官方成绩` 说明
- 最近报告入口，如果无报告则展示示例报告

#### PartTabs

使用 segmented control：

```text
Part 1
Part 2
Part 3
考前高频
```

不要用下拉作为主要入口。

#### TopicList

题目项字段：

- Part 标签。
- 题目英文。
- 中文解释。
- 推荐时长。
- 高频/新题/复练标签。
- CTA：`录音回答`。

移动端题目项：

- 英文题目最多显示 3 行。
- 中文解释 1-2 行。
- CTA 固定在卡片底部。

## 2. `/tools/ielts-speaking/topics/[topicSlug]`

### 页面目标

让题库页既能 SEO，也能变成练习入口。

### 信息结构

```text
Breadcrumb
TopicHeader
QuestionBlock
AnswerPlanning
LowScoreTraps
HighScoreLanguage
RecordCTA
RelatedTopics
```

### TopicHeader

字段：

- Part。
- 题库季节。
- 高频标签。
- 推荐回答时长。
- 难度。

### QuestionBlock

显示：

- 英文原题。
- 中文解释。
- Part 2 cue card 子问题，如适用。

设计要求：

- 英文题目使用 serif，增加考试材料感。
- Cue card 使用左侧细线，不使用大卡片套卡片。

### AnswerPlanning

不要写完整范文，避免用户只背答案。提供：

- 3 步答题结构。
- 可替换个人经历槽位。
- 连接方式建议。

### LowScoreTraps

展示常见扣分：

- 回答太短。
- 只列事实没有展开。
- 过去时不稳定。
- 高频词重复。
- 长停顿集中在从句前。

### RecordCTA

文案：

```text
录音回答这道题
先生成免费基础报告
```

移动端使用 sticky bottom CTA。

## 3. `/tools/ielts-speaking/record/[topicId]`

### 页面目标

降低开口压力，完成一次有效录音。

### 状态机 UI

```text
permission_checking
ready
recording
recorded
uploading
diagnosing
error
```

### Ready 状态

元素：

- 题目。
- 推荐回答时长。
- 小提示：`这不是正式考试，先完整说完比追求完美更重要。`
- 主按钮：麦克风图标 + `开始录音`
- 次按钮：`换一道题`

### Recording 状态

元素：

- 大计时器。
- 简洁音量波形。
- 停止按钮。
- 当前题目缩略显示。

设计要求：

- 屏幕中心只保留录音相关内容。
- 最后 10 秒计时器变为 warning 色。
- 不在录音中显示评分维度，避免干扰表达。

### Recorded 状态

元素：

- 播放录音。
- 重录。
- 提交诊断。
- 音频时长。

校验：

- 小于 8 秒：提示 `有效内容过短，请至少完整回答一句。`
- 超过最大时长：允许提交，但提示后续会截取有效部分或按题型限制处理。

### Uploading / Diagnosing 状态

文案分阶段：

```text
正在上传录音
正在评估发音和流利度
正在生成基础报告
```

不要伪造“考官正在打分”。

## 4. `/tools/ielts-speaking/report/[reportId]`

### 页面目标

基础报告建立信任，深度报告完成转化和复练。

### 页面结构

```text
ReportHeader
BasicSummary
ScorePreview
KeyIssues
TranscriptPreview
DeepReportLock / DeepReportReady
PracticeNextStep
```

### ReportHeader

字段：

- 题目。
- Part。
- 录音时长。
- 生成时间。
- `AI 预估分，非官方成绩` 标签。

### BasicSummary

显示：

- 预估区间：`5.5-6.0`
- 发音清晰度。
- 流利度。
- 语速。
- 停顿次数。

设计：

- 使用横向指标条，不使用花哨雷达图作为主表达。
- 移动端改为 2 列或单列。

### KeyIssues

基础报告只展示 2-3 个问题方向：

```text
过去时不稳定
停顿偏多
词汇重复明显
```

每个问题给一句短证据，但不展示完整逐句改写。

### TranscriptPreview

显示 ASR 文本前若干行。

设计：

- 用户可展开全文。
- 标注 `转写可能存在误差，深度报告会结合发音评测结果分析。`

### DeepReportLock

锁定区展示：

- 已检测到的深度模块数量：
  - `4 项分数`
  - `逐句修改`
  - `发音问题`
  - `7 天训练计划`
- 价格 CTA：
  - 首次：`￥3.9 解锁本次扣分原因`
  - 非首次：`消耗 1 次诊断额度`
- 次数包推荐：
  - `￥29.9 / 5 次`
  - `￥69 / 15 次`

不要展示假模糊长文本，避免廉价感。可以展示结构化 skeleton。

### DeepReportReady

内容顺序：

1. 四项分数。
2. 提分优先级。
3. 逐句诊断。
4. 词汇升级。
5. 发音问题。
6. 7 天训练计划。
7. 重录同题。

#### 四项分数模块

四项卡：

```text
FC
LR
GRA
PR
```

每项包含：

- 分数。
- 主要扣分点。
- 是否优先处理。

#### 逐句诊断

格式：

```text
原句
问题类型
修改建议
为什么扣分
```

移动端不要左右对照，改为上下结构。

#### 发音问题

只展示 SOE 支撑的数据：

- 低分单词。
- 音素问题。
- 重音问题。
- 跟读练习句。

必须避免“凭文本猜发音”。

#### 训练计划

7 天列表，每天包含：

- 目标。
- 练习题。
- 错音词或语法点。
- 复录提醒。

## 5. `/tools/ielts-speaking/pricing`

### 页面目标

解释深度报告价值，并推动次数包购买。

### 推荐价格展示

只首屏展示 3 个主卡：

```text
首份体验
￥3.9
解锁当前深度报告

5 次诊断包
￥29.9
适合练 1 周

15 次冲刺包
￥69
考前 2-4 周推荐
```

二级区域展示：

```text
当季冲刺包 ￥99
人工复核 ￥59/次
```

### 设计要求

- 主推 `15 次冲刺包`，但不要用夸张“最划算”大贴纸。
- 用“适合谁”解释，而不是只列功能。
- 价格卡高度一致，移动端单列。

## 6. `/tools/ielts-admin/reports/[reportId]`

### 页面目标

让管理员快速判断报告是否可发布、是否需要重跑、是哪一个 Agent 出问题。

### 页面结构

```text
AdminTopBar
ReportMeta
AudioAndTranscript
AgentOutputs
FinalReport
Actions
AuditLog
```

### AgentOutputs

用 tabs：

```text
SOE
FC
LR
GRA
PR
Synthesizer
Critic
Validator
```

每个 tab 展示：

- 输入摘要。
- 输出 JSON。
- 风险标记。
- 耗时。
- 模型。
- Prompt 版本。

### Actions

按钮：

- `通过`
- `重跑深度报告`
- `标记需复核`
- `作废`

危险按钮必须二次确认。

## Component Inventory

### Core Components

```text
IeltsShell
IeltsTopBar
PartSegmentedControl
TopicCard
QuestionPanel
RecordingPanel
AudioWave
TimerBadge
BasicMetricStrip
IssueList
TranscriptPreview
DeepReportLockPanel
ScoreDimensionGrid
SentenceFeedbackList
PronunciationIssueList
TrainingPlanList
PricingPlanCard
AdminAgentTabs
```

### Component Rules

- 所有按钮高度至少 44px，适合移动端点击。
- 录音按钮尺寸稳定，状态变化不能导致布局跳动。
- 分数卡宽高稳定，分数从 `5.5` 到 `7.0` 不应撑破布局。
- 英文长题目必须自动换行。
- 证据片段不使用小于 14px 字号。

## Interaction Rules

### 录音交互

- 首次进入录音页时先请求麦克风权限。
- 权限拒绝后展示修复说明。
- 录音中禁止切换题目。
- 提交中禁止重复点击。
- 上传失败允许重试，不丢失本地录音。

### 报告交互

- 基础报告生成后立即展示。
- 深度报告 `generating` 时展示状态条。
- 深度报告 `failed` 时展示重试/联系客服。
- 深度报告 `needs_review` 时文案为：`报告需要复核，我们会尽快处理。`

### 付费交互

- 未登录点击解锁，先弹登录。
- 有次数时优先消耗次数。
- 无次数时进入购买。
- 支付后返回报告页并轮询深度报告状态。

### 登录交互

V1 使用轻量登录弹窗，不跳出当前报告页。

触发入口：

- 点击 `解锁本次报告`。
- 点击价格卡 `选择方案`。
- 访问账户页但未登录。
- 查询历史报告但未登录。

弹窗结构：

- 标题：`登录后解锁深度报告`。
- 说明：`用于保存报告、同步购买额度，并防止同一报告重复扣费。`
- 输入：手机号或邮箱。
- 动作：`发送验证码`、`登录并继续`。
- 辅助说明：微信授权、App 登录、小程序 OpenID 后续接入同一账户体系。

状态：

```text
closed
input_identity
code_sent
verifying
verified
error
```

设计约束：

- 不使用整页登录打断录音和报告阅读。
- 登录弹窗必须可关闭。
- 错误提示显示在输入框下方。
- 验证码倒计时期间不可重复发送。
- 登录成功后回到用户原来的动作：解锁报告或进入购买。
- 移动端弹窗宽度不超过视口，底部留出系统安全区。

## Responsive Requirements

### Desktop

- 主内容最大宽度 1180px。
- 报告页采用主内容 + 右侧行动栏。
- 管理后台可使用高密度表格。

### Tablet

- 题库列表 2 列。
- 报告页右侧行动栏下移。

### Mobile

- 单列布局。
- Sticky bottom CTA。
- 录音页隐藏非核心信息。
- 价格卡单列。
- 管理后台仅保证可查看，复杂编辑可 desktop 优先。

## Accessibility

- 所有录音和提交按钮有明确 `aria-label`。
- 录音状态用文字同步表达，不能只靠颜色或动画。
- 颜色对比度达到 WCAG AA。
- 错误提示必须关联输入控件。
- 键盘可操作基础流程。

## Copywriting Guidelines

### 推荐文案

```text
AI 预估分，非官方成绩
参考 IELTS Speaking 四项维度
先看免费基础报告
解锁我的扣分原因
查看逐句修改建议
生成 7 天提分计划
重录同一道题，对比进步
```

### 禁止文案

```text
官方雅思评分
雅思官方认证
保证提分
与真人考官完全一致
无限 AI 精批
```

## Frontend Acceptance Checklist

### 题库页

- [ ] 首屏能直接开始练习。
- [ ] Part 切换清楚。
- [ ] 题目卡移动端不溢出。
- [ ] 每个题目都有录音 CTA。

### 录音页

- [ ] 麦克风权限拒绝时有提示。
- [ ] 录音中按钮和计时器稳定。
- [ ] 小于 8 秒不能提交或明确提示。
- [ ] 上传失败可重试。

### 报告页

- [ ] 基础报告和深度报告边界清楚。
- [ ] 未解锁时不展示深度报告正文。
- [ ] 四项分数移动端可读。
- [ ] 逐句诊断不撑破布局。
- [ ] 付费 CTA 明确但不过度压迫。

### 价格页

- [ ] 首屏只展示 3 个主方案。
- [ ] 主推方案明确。
- [ ] 用户能理解每个方案适合谁。

### 管理后台

- [ ] 可查看每个 Agent 输出。
- [ ] 可执行通过、重跑、作废。
- [ ] 危险操作有二次确认。

## Implementation Notes

- 前端先实现静态假数据版本，再接 `/tools/ielts-api/*`。
- 所有报告假数据必须与后端 Pydantic Schema 对齐。
- 不要在前端模拟深度报告解锁权限，权限必须由服务端返回。
- 不要把腾讯云 SOE、COS、LLM Key 放入前端环境变量。
- `NEXT_PUBLIC_IELTS_API_BASE=/tools/ielts-api`。

## Design Optimization Addendum

本附录使用 `frontend-design` 与 `awesome-design-md` 两套规则补强本项目设计方向。参考风格只抽象原则，不复制任何第三方品牌视觉、标志、专有字体、截图构图或按钮形状。

### Reference Abstraction

抽象参考：

- Linear 类产品的状态密度：任务、状态、风险、历史记录要能快速扫描，但不复制其深色品牌画布。
- Mintlify 类文档产品的信息秩序：复杂说明拆成主内容、局部导航、清晰标题和短段落，但不复制其品牌绿色和营销云图。
- Stripe 类商业产品的可信转化：价格和权益要精确、克制、有边界，不做夸张促销视觉。

项目自己的设计方向：

```text
Diagnostic Workspace
题库入口 + 录音工具 + 诊断报告 + 复练任务
```

产品记忆点：

```text
用户录完一道雅思题后，能像看体检报告一样看到“扣分证据”和“下一步练什么”。
```

### Optimized Experience Principles

1. 首页从“介绍产品”改为“直接练题”。
2. 录音页从“表单页面”改为“低压考试舱”。
3. 报告页从“AI 文本回复”改为“诊断单 + 证据 + 训练处方”。
4. 价格页从“套餐列表”改为“考前阶段选择”。
5. 后台从“报告表格”改为“Agent 输出审查台”。

### State-First Interface

界面必须优先表达状态，而不是装饰：

```text
未录音
录音中
正在评测
基础报告已生成
深度报告锁定
深度报告生成中
需要复核
已完成
```

每个状态必须同时具备：

- 明确标题。
- 用户当前能做什么。
- 系统正在做什么。
- 下一步 CTA。

### Evidence-Driven UI

报告页组件必须围绕证据建立：

```text
分数
→ 扣分原因
→ 原句/单词/音素证据
→ 修改建议
→ 下一步练习
```

没有 evidence 的建议只能放在“通用练习建议”，不能进入“核心扣分原因”。

### Density Rules

| 页面 | 密度 | 原则 |
|---|---|---|
| 首页 | 中等 | 快速进入题库，不堆功能说明 |
| 题目页 | 中高 | SEO 内容和练习入口并存 |
| 录音页 | 低 | 只保留开口所需信息 |
| 基础报告页 | 中高 | 先给可扫读结论 |
| 深度报告页 | 高 | 证据、分数、训练任务清晰分组 |
| 后台审核页 | 高 | 支持快速定位 Agent 问题 |

### Optimized Wireframes

#### 首页首屏

```text
┌──────────────────────────────────────────────┐
│ TopBar                                       │
├──────────────────────────────┬───────────────┤
│ H1 + season + primary CTA    │ PracticeCard  │
│ Part segmented control       │ RecentReport  │
├──────────────────────────────┴───────────────┤
│ 高频题目列表：TopicCard x 6                   │
└──────────────────────────────────────────────┘
```

首屏不放：

- 大段品牌故事。
- 超过 3 个 CTA。
- 全屏插图。
- 用户评价墙。

#### 报告页

```text
┌──────────────────────────────────────────────┐
│ ReportHeader: topic / part / non-official    │
├──────────────────────────────┬───────────────┤
│ BasicSummary                 │ ActionRail    │
│ ScorePreview                 │ Unlock / Pack │
│ KeyIssues                    │ Next Practice │
│ TranscriptPreview            │               │
├──────────────────────────────┴───────────────┤
│ DeepReportLock OR DeepReportReady             │
└──────────────────────────────────────────────┘
```

移动端顺序：

```text
ReportHeader
BasicSummary
KeyIssues
DeepReportLock / Ready
Sticky CTA
```

### Recording Control Refinement

录音页唯一强视觉元素是圆形录音控制区。它必须稳定，不随状态变化改变大小：

```text
ready：麦克风图标
recording：红点 + 波形
recorded：播放图标
uploading：进度环
diagnosing：检查图标
```

录音波形只用于告诉用户“系统正在收音”，不要做成音乐播放器风格。录音过程中不要展示复杂评分维度，避免干扰表达。

### Score Presentation Refinement

四项分数不使用雷达图作为主展示。使用 4 个稳定宽高的 `ScoreCell`：

```text
FC
LR
GRA
PR
```

每个 `ScoreCell` 只展示：

- 分数。
- 一个主扣分点。
- 是否优先处理。

总分放在上方，不与四项分数争夺视觉焦点。

### Pricing Refinement

价格页不是“套餐表”，而是“备考阶段选择”：

```text
首份体验：还不确定 AI 报告是否适合自己
5 次诊断包：想集中练一个 Part 或一个话题组
15 次冲刺包：考前 2-4 周，需要反复复录和对比
当季冲刺包：准备系统刷完整个换题季
人工复核：已经临近考试，需要人工确认高风险报告
```

首屏只展示 3 个主方案：

```text
首份体验 ￥3.9
5 次诊断包 ￥29.9
15 次冲刺包 ￥69
```

### Agent Quality UI

后台和调试模式必须能显示每个 LangGraph 节点的质量状态：

```text
FC Agent: pass / warning / failed
LR Agent: pass / warning / failed
GRA Agent: pass / warning / failed
PR Agent: pass / warning / failed
Critic: pass / repairable / high_risk
Validator: pass / schema_error
QualityGate: ready / needs_review / failed
```

用户端不展示 Agent 技术名，只展示自然语言状态：

```text
正在分析流利度
正在检查词汇和语法
正在核对发音证据
正在生成训练计划
```

### Added Components

在原组件清单基础上补充：

```text
PracticeCard
RecentReportCard
ScoreCell
QualityGateBadge
AgentStatusRow
EvidenceBlock
StickyMobileCTA
```

### Do / Don't

Do:

- 用考试材料感、诊断单结构和训练任务建立可信度。
- 用明确状态告诉用户系统正在做什么。
- 用证据片段支撑评分和建议。
- 用短 CTA 推动下一步练习或解锁。
- 为移动端设计 sticky CTA 和单列报告。

Don't:

- 不做 AI 聊天框式报告。
- 不做紫色渐变大 hero。
- 不用“官方评分”“保证提分”。
- 不把深度报告假模糊后发给未付费用户。
- 不用复杂动画干扰录音。
- 不复制任何参考品牌的标志、专有布局和视觉资产。

### Additional Acceptance Checks

- [ ] 首页首屏 3 秒内能进入练题，不需要阅读长文案。
- [ ] 录音页在移动端只有一个主操作焦点。
- [ ] 每个核心扣分原因都有 evidence。
- [ ] `needs_review` 状态不会展示不完整深度报告。
- [ ] 后台能区分 Critic、Validator、QualityGate 的失败原因。
- [ ] 价格页能让用户理解“我现在该买哪个”，而不是只比较次数。
