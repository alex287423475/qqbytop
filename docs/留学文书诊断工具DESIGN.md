# 留学文书诊断工具 DESIGN.md

## Product Context

留学文书诊断工具是北京全球博译官网诊断工具矩阵中的文本类获客产品。它面向留学生、申请者和家长，帮助用户快速判断 PS / SOP / Motivation Letter 是否存在主题不清、经历空泛、项目匹配不足、英文表达生硬或文本同质化问题。

设计目标不是做一个营销页，而是做一个可信、克制、可直接使用的“申请材料诊断工作台”。

页面必须让用户第一眼知道：

- 这里可以直接粘贴文书诊断。
- 文书不会默认保存或进入查重系统。
- 结果是结构化判断，不是免费代写。
- 如果问题严重，可以自然进入人工润色或材料包审核服务。

## Reference Direction

本设计方向综合参考了几类相邻产品的设计原则，但不复制任何品牌视觉：

- 工具型产品的高密度布局：信息紧凑、扫描效率高、状态清楚。
- 文档型产品的信息层级：复杂解释要有清楚标题、短段落、分组和锚点。
- 专业服务产品的信任表达：表单、CTA、隐私提示和报价入口需要稳重可信。
- 长文本 AI 产品的温和阅读体验：避免压迫感、避免过度技术化，给用户足够安全感。

最终视觉关键词：

```text
专业
克制
可信
清晰
低压
工具型
```

禁止视觉方向：

- 紫色渐变 AI 工具风。
- 大 hero 营销页。
- 装饰性插画或抽象光效。
- 学校官网式模板感。
- 留学中介广告页风格。
- 过度 dashboard 化，导致申请者看不懂。

## Visual Principles

### 1. 工具优先

首屏必须是工具，不是品牌故事。用户打开页面后，应在 3 秒内看到：

- 申请阶段选择。
- 文书类型选择。
- 文书正文输入框。
- 隐私声明。
- 生成诊断按钮。

### 2. 信息有层级

诊断结果必须按优先级展示：

1. 综合结论。
2. 6 个维度评分。
3. 主要问题与证据。
4. 修改优先级。
5. 服务推荐。
6. 留资表单。

不要让所有模块视觉权重相同。

### 3. 克制建立信任

少用强色块，大面积使用白色、浅灰、浅青绿和暖纸色。强调色只用于：

- 主 CTA。
- 当前步骤。
- 高风险问题标签。
- 评分重点。
- 服务推荐。

### 4. 长文本友好

文书输入、证据片段、诊断摘要都是长文本场景。所有长句必须可换行，不得撑破布局。英文 evidence 不得小到难读。

### 5. 低压转化

CTA 是“选择解决方案”，不是“强迫咨询”。服务推荐要基于诊断问题解释原因。

## Color Tokens

使用语义 token，不直接在组件里散写颜色。

```css
:root {
  --essay-canvas: #f7f5ef;
  --essay-surface: #ffffff;
  --essay-surface-soft: #fbfaf7;
  --essay-surface-tint: #eef7f4;
  --essay-ink: #102f2d;
  --essay-ink-strong: #062421;
  --essay-muted: #64736f;
  --essay-subtle: #8a9692;
  --essay-line: #ded8cc;
  --essay-line-soft: #ece6da;
  --essay-brand: #0f4f48;
  --essay-brand-hover: #14665d;
  --essay-brand-soft: #d9eee9;
  --essay-accent: #b7791f;
  --essay-accent-soft: #fff4d6;
  --essay-danger: #9f3a2f;
  --essay-danger-soft: #fbe8e5;
  --essay-success: #2f7d55;
  --essay-success-soft: #e5f4ea;
  --essay-demo: #5b6170;
  --essay-demo-soft: #eef0f4;
  --essay-shadow-sm: 0 1px 3px rgba(16, 47, 45, 0.06);
  --essay-shadow-md: 0 4px 12px rgba(16, 47, 45, 0.08);
  --essay-shadow-lg: 0 8px 24px rgba(16, 47, 45, 0.10);
  --essay-transition-fast: 150ms ease;
  --essay-transition-base: 220ms ease;
}
```

Color rules:

- 主品牌色使用深青绿，和现有全球博译站点保持一致。
- 高风险不要大面积红底，只用小标签或细边框。
- 隐私声明用浅青绿底，不要做成警告红色。
- Demo 报告用中性灰蓝，避免误认为真实诊断。
- Before / After 案例用浅暖纸色，不要让它比真实诊断更显眼。

### Tailwind Mapping

如果页面使用 Tailwind，必须把语义 token 映射到 `tailwind.config.ts` 或项目当前 Tailwind token 扩展中，不要在 JSX 中散写任意 hex。

建议映射：

```ts
theme: {
  extend: {
    colors: {
      essay: {
        canvas: "var(--essay-canvas)",
        surface: "var(--essay-surface)",
        "surface-soft": "var(--essay-surface-soft)",
        "surface-tint": "var(--essay-surface-tint)",
        ink: "var(--essay-ink)",
        "ink-strong": "var(--essay-ink-strong)",
        muted: "var(--essay-muted)",
        subtle: "var(--essay-subtle)",
        line: "var(--essay-line)",
        "line-soft": "var(--essay-line-soft)",
        brand: "var(--essay-brand)",
        "brand-hover": "var(--essay-brand-hover)",
        "brand-soft": "var(--essay-brand-soft)",
        accent: "var(--essay-accent)",
        "accent-soft": "var(--essay-accent-soft)",
        danger: "var(--essay-danger)",
        "danger-soft": "var(--essay-danger-soft)",
        success: "var(--essay-success)",
        "success-soft": "var(--essay-success-soft)",
        demo: "var(--essay-demo)",
        "demo-soft": "var(--essay-demo-soft)",
      },
    },
  },
}
```

组件中优先使用：

```text
bg-essay-surface
text-essay-ink
text-essay-muted
border-essay-line
bg-essay-brand
bg-essay-brand-soft
bg-essay-danger-soft
```

不要混用大量 `slate-*`、`emerald-*`、`amber-*` 替代语义 token，除非是在主站既有组件中无法避免。

## Typography

### Font Stack

不要引入额外付费字体。使用系统可用字体：

```css
--essay-font-sans: "Noto Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
--essay-font-serif: "Noto Serif SC", "Songti SC", serif;
--essay-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

### Type Scale

```css
--essay-text-xs: 12px;
--essay-text-sm: 13px;
--essay-text-base: 15px;
--essay-text-md: 16px;
--essay-text-lg: 18px;
--essay-text-xl: 22px;
--essay-text-2xl: 28px;
--essay-text-3xl: 34px;
```

Typography rules:

- 不使用随 viewport 缩放的字号。
- letter-spacing 保持 `0`，不要使用负字距。
- 首屏标题最大不超过 34px。
- 结果页卡片标题 16-18px。
- evidence 文本最小 13px。
- 英文 evidence 可使用 mono 或正常 sans，但必须易读。
- 不要在紧凑组件里使用 hero 级字号。

Line-height rules:

- 标题：`1.25-1.35`。
- 正文与诊断说明：`1.6-1.7`。
- 表单 label、按钮、标签：`1.35-1.45`。
- evidence 引用块：`1.55-1.65`。
- 紧凑评分卡短评：`1.45-1.55`。

## Motion / Transition

第一版只做轻量动效，不做大面积入场动画。

规则：

- 按钮 hover / active：`150ms ease`。
- Segmented control 状态切换：`150ms ease`。
- 卡片 hover：允许边框变深或阴影从 `--essay-shadow-sm` 到 `--essay-shadow-md`，不使用明显放大。
- 结果区出现：可使用 `opacity: 0 -> 1` 和 `translateY(4px -> 0)`，时长 `220ms ease`。
- 进度条：宽度变化使用 `320ms ease`。
- 禁止使用弹跳、旋转、强缩放、闪烁动效。
- `prefers-reduced-motion: reduce` 下必须关闭 transform 类动效，只保留必要的状态变化。

## Dark Mode

第一版明确不支持暗色模式。

不要自行添加 `prefers-color-scheme` 自动切换，也不要实现一套未验证的 dark token。若未来要做暗色模式，必须另开设计评审。

## Layout & Spacing

### Desktop

推荐工具主体：

```text
max-width: 1280px
grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.82fr)
gap: 24px
padding: 24px
```

左侧：

- 工具标题。
- 核心表单。
- 文书输入框。
- 隐私声明。
- 生成按钮。

右侧：

- 空状态预览。
- 生成进度。
- 诊断结果。
- 服务推荐。

### Mobile

移动端单列顺序：

```text
工具标题
核心字段
补充字段
文书输入
隐私声明
生成按钮
结果
CTA
留资
```

Spacing:

- 页面左右 padding：桌面 24px，移动端 14-16px。
- 模块间距：20-28px。
- 卡片内边距：16-20px。
- 紧凑列表间距：8-12px。
- 不使用超过 32px 的圆角。
- 常规卡片圆角 8px。

## Components

### Top Navigation

工具页顶部导航必须和主站一致：

- Logo 链接 `/zh`。
- 主站导航。
- 获取报价。
- 咨询电话 `400-869-9562`。

电话链接：

```css
.tool-phone-link,
.tool-phone-link:visited,
.tool-phone-link:hover,
.tool-phone-link:focus-visible {
  color: var(--essay-brand);
  text-decoration: none;
}
```

### Segmented Controls

用于：

- 申请阶段。
- 文书类型。
- 用户担心问题。

文书类型枚举必须与 PRD 一致：

```text
PS
SOP
Motivation Letter
Scholarship Essay
不确定
```

规则：

- 默认白底灰边。
- 选中状态浅青绿底 + 深青绿文字。
- hover 状态：边框加深到 `--essay-brand-soft` 或背景变为 `--essay-surface-tint`。
- focus-visible：2px 深青绿 outline，offset 2px。
- disabled：浅灰底、低对比文字、不可 hover。
- 按钮允许换行。
- 移动端不允许横向滚动。
- 每个按钮高度至少 38px。

### Essay Textarea

规则：

- 桌面端最小高度 280px。
- 移动端默认最小高度 160px，获得焦点或已有输入后可展开到 220px。
- 移动端首屏必须尽量让“生成文书诊断”按钮可见；如果 textarea 过高导致按钮掉到首屏之外，优先降低 textarea 初始高度而不是压缩隐私文案。
- 右下角或底部显示字符数、英文词数和状态。
- 禁止把正文写入 `localStorage`。
- placeholder 要明确示例，不要吓人。

状态文案：

```text
内容过短，只能做初步判断。
可诊断，但置信度较低。
适合诊断。
内容较长，建议确认是否只粘贴了一篇文书。
这篇内容过长，请拆分后再诊断。
```

### Privacy Notice

位置：文书输入框下方、生成按钮上方。

样式：

- 浅青绿底。
- 左侧可以有锁形图标。
- 文案不超过两行，移动端允许三行。
- 不使用红色或警告样式。

文案：

```text
你的文书仅用于本次实时诊断。默认不保存完整正文，不用于 AI 训练，也不会提交到任何查重系统。
```

### Primary Action

主按钮文案：

```text
生成文书诊断
```

规则：

- 深青绿底。
- 白字。
- 圆角 8px。
- 高度 46-52px。
- loading 时显示“正在生成诊断...”，禁用重复点击。
- 输入不合法时禁用，并在按钮上方显示原因。

### Diagnosis Progress

AI 诊断可能持续 10-45 秒。加载态必须主动建立等待预期，不能只使用一个 spinner 或单一句“正在生成诊断...”。

进度结构：

```text
0-10s：正在解析文本结构
10-20s：正在比对申请匹配度
20-30s：正在提取原文证据
30-45s：正在生成修改优先级
```

交互规则：

- 使用伪进度条或分步状态，进度最高停在 90%，等待接口真实返回后到 100%。
- 每 8-10 秒轮换一次说明文案。
- 20 秒后显示低压提示：“文书较长时诊断会多花一点时间，请勿关闭页面。”
- 35 秒后显示备选提示：“如果接口繁忙，我们会展示示例报告，你也可以稍后重试。”
- 不要让 loading 状态导致整页空白；用户原文和申请背景仍应保留。
- 失败 fallback 到 demo 时，必须让用户知道这是示例，不是真实诊断。

### Result Summary

顶部结论条包括：

- 综合评分。
- 置信度。
- 文书类型判断。
- demo 状态。

不要把综合评分做成夸张仪表盘。分数是参考，不是考试成绩。

### Dimension Scores

展示 6 项：

- 主题清晰度。
- 结构完整度。
- 申请匹配度。
- 经历说服力。
- 语言表达。
- 文本同质化/空泛度风险。

桌面端 2 或 3 列，移动端 1 或 2 列。

### Problem Card

每个主要问题包括：

- 标题。
- 严重度标签。
- evidence 引用块。
- 为什么重要。
- 修改方向。

Evidence block CSS 必须包含：

```css
overflow-wrap: anywhere;
word-break: break-word;
white-space: normal;
```

### Result Visual Rhythm

结果区视觉节奏：

```text
Result Summary：全宽浅青绿结论条，轻边框，低阴影
Dimension Scores：紧凑网格，卡片高度一致，用细边框区分
Main Problems：纵向列表，使用 gap，不使用重 divider
Revision Priorities：紧凑列表或三段式轻量区块
Quick Wins：浅暖底 checklist
Service Recommendation：主推荐卡片高亮，其余服务普通卡片
Lead Capture：结果区底部独立表单卡片
```

不要让所有模块都使用同等阴影和同等标题字号。综合结论和主推荐服务可以有较高权重，问题卡片次之，quick wins 和 FAQ 更轻。

### Service CTA

服务卡片必须按问题分流：

```text
我只需要英文润色
我需要重写结构和逻辑
我不确定 PS/SOP 怎么写
我还有 CV、推荐信、成绩单
我还需要英文简历一起优化
```

每张卡片包含：

- 服务名称。
- 适用情况。
- 一句选择理由。
- CTA 按钮。

推荐服务可以高亮，但不要让其他服务不可见。

### Before / After Example

Before / After 使用固定样例，不使用用户正文。

视觉规则：

- 放在服务推荐之后、留资表单之前。
- 使用双列对比，移动端变单列。
- Before 使用浅灰或浅暖底，After 使用浅青绿底。
- 区块顶部必须有说明：“示例，不是对你文书的完整改写”。
- Before 不超过 60 英文词，After 不超过 80 英文词。
- 不使用红色批判样式，不制造羞辱感。

### Lead Capture

表单只在结果生成后出现，或用户点击 CTA 后展开。

字段：

- 联系方式。
- 申请地区。
- 申请阶段。
- 目标专业。
- 当前材料状态。
- 选择的服务。
- 是否授权人工顾问查看完整文书。

授权选项默认不勾选。

## Responsive Behavior

### Breakpoints

```css
desktop: >= 1024px
tablet: 720px - 1023px
mobile: < 720px
```

Rules:

- `< 1024px`：双栏变单栏。
- `< 720px`：按钮组换行，CTA 单列，评分卡 1 列或 2 列。
- `< 420px`：所有卡片单列，按钮文字允许两行但不得溢出。
- 任何英文长词、URL、evidence 都必须换行。

### Mobile Fold Rule

移动端首屏必须控制输入区高度，避免用户进入页面后看不到主按钮。

目标：

```text
在 390x844 级别视口中，用户应能在首屏或轻微滚动内看到“生成文书诊断”按钮。
```

规则：

- 移动端标题和说明不超过 2 行 + 2 行。
- 申请阶段和文书类型按钮组最多各占 2 行。
- 补充字段默认折叠。
- textarea 初始高度 160px；focus 或有内容后可扩展。
- 隐私声明移动端最多 3 行。
- 如果按钮仍掉出首屏，优先减少说明文案和字段间距，不要隐藏隐私声明。

## Accessibility & Interaction

- 所有表单字段必须有 label。
- 按钮组要有明确 `aria-pressed` 或等价状态。
- 生成进度区域使用 `aria-live="polite"`。
- 错误提示不要只靠颜色表达。
- focus 状态必须可见。
- 电话链接必须有 `aria-label`。
- CTA 卡片按钮文案要能脱离上下文理解。
- 不使用自动弹窗打断用户阅读结果。

## Do / Don't

### Do

- 做成可直接操作的诊断工作台。
- 使用紧凑但不拥挤的信息层级。
- 用浅色引用块展示 evidence。
- 用服务分流卡片承接转化。
- 保持隐私承诺醒目、可信、不吓人。
- 让 demo 状态和真实诊断状态视觉上可区分。

### Don't

- 不做大幅营销 hero。
- 不使用紫色 AI 渐变。
- 不使用大量装饰图、光斑、渐变球。
- 不把 evidence 做成不可换行的代码块。
- 不把所有结果模块做成同样大小的卡片。
- 不在结果页输出完整文书改写。
- 不强制用户留资才能看结果。
- 不把授权人工查看文书默认勾选。

## Agent Implementation Notes

实现页面前必须同时阅读：

- `docs/留学文书诊断工具AI辅助开发PRD.md`
- `docs/留学文书诊断工具DESIGN.md`

实现优先级：

1. 工具可用。
2. 隐私边界清楚。
3. 结果可读。
4. CTA 分流明确。
5. 移动端不溢出。

如果 PRD 和 DESIGN.md 出现冲突，以 PRD 的安全、隐私、API 和业务边界为准；以 DESIGN.md 的 UI、布局、视觉和交互规则为准。
