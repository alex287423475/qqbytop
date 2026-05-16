# 高考作文素材文件内部使用审计

审计对象来自本机目录 `C:\Users\Administrator\Desktop\高考作文\`，仅作为内部质量工程素材，不作为公开展示内容。

## 文件结论

| 文件 | 当前价值 | 建议用途 | 禁止用途 |
|---|---|---|---|
| `真题.txt` | 高 | 结构化真题任务库、质量闸门题型覆盖、Prompt 回归测试 | 不直接公开全文，不直接拼入生产 Prompt |
| `综合.txt` | 高但很杂 | 扩展错误 taxonomy、补充扣分点、生成错误标签 | 不整段进入 RAG 或 LLM 上下文 |
| `范文.txt` | 中高 | 范文风格参照、两版范文质量抽检、主题表达校准 | 不原文复用为用户报告，不作为公开范文库 |
| `高考英语作文.txt` | 高 | 评分规则、错误分类、扣分点 | 不作为官方标准宣传 |
| `标准.txt` | 中高 | 写作诊断检查清单、study_plan 建议、词汇升级和考场检查 SOP | 不覆盖 25 分制 Rubric，不把高级词汇/从句数量作为硬性评分规则 |
| `错误.txt` | 暂无 | 目前为空，可作为后续人工错题整理目标文件 | 暂不接入流程 |

## 已落地资产

- `backend/prompts/gaokao_scoring_rubric.md`：生产评分 Rubric。
- `backend/prompts/gaokao_error_taxonomy.md`：生产错误分类。
- `backend/prompts/gaokao_writing_checklist.md`：诊断建议清单，用于逻辑建议、范文重写和 7 天训练计划校准。
- `test_inputs/gaokao_tasks/gaokao_writing_tasks.jsonl`：由 `真题.txt` 抽取的内部真题任务库。

## 生产链路新增接入

- 首页文本输入区已新增「作文题目/任务要求（选填）」。
- 用户填写题目后，前端会把 `task_prompt`、`task_type=application_writing`、`expected_word_count=80-120 words` 传给后端。
- 后端诊断 payload 已包含 `task_context`，用于检查要点完整、应用文格式、对象语气、跑题风险和任务相关的改写方向。
- 报告 `diagnosis_meta` 会记录 `task_context_provided`、`task_type`、`expected_word_count`，方便后续质量追踪。
- 同一篇作文在不同题目下会使用不同诊断缓存键，避免真题任务不同导致报告串用。

这表示 `真题.txt` 沉淀出的最大经验已经进入生产流程：诊断不再只能看“孤立作文正文”，而是可以按具体题目要求做审题和扣分判断。但原始真题库仍只作为内部任务覆盖资产，不直接整段注入 Prompt。

## Taxonomy 扩充记录

- 应用文任务层：新增格式要素缺失、对象语气不匹配、要点展开不足。
- 篇章结构层：新增主题句缺失、段间过渡突兀、模板句堆砌。
- 词汇搭配层：新增介词误用、拼写错误、词义不准、固定短语误用。
- 语法准确层：新增从句结构错误、动词句型错误、汉语句式迁移、标点大小写错误。
- 表达层级层：新增基础词贫乏、机械高级词、语气错位。

这些分类已同步进生产诊断 payload，用于约束 `highlight_spans.category` 和质量闸门测试；它们是内部诊断标签，不作为对外营销承诺。

## 使用边界

1. 这些文件的内容来源复杂，不能作为官方评分标准、官方真题库或公开范文库对外宣传。
2. 生产 Prompt 只引用经人工清洗后的 Rubric 和 Taxonomy，不直接注入原始大文本。
3. Golden Dataset 可以使用真题库的任务类型和摘要，但学生作文样本应使用合成或授权文本。
4. 范文只用于内部判断“稳妥版/进阶版”的风格质量，不得直接复制进用户报告。
5. 每次更新 Rubric、Taxonomy 或 Prompt 后，必须跑质量闸门批测。

## 质量闸门接入命令

```powershell
cd D:\projects\北京全球博译翻译官网\next-vercel\backend
uv run python tools\extract_gaokao_tasks.py
uv run python tools\batch_report_tester.py --task-bank-only --output ..\test_outputs\gaokao_task_coverage
```

`batch_report_tester.py` 在常规批测时也会读取 `test_inputs/gaokao_tasks/gaokao_writing_tasks.jsonl`，并在输出目录写入：

- `task_coverage.json`：题型、年份、试卷来源覆盖摘要。
- `task_coverage.csv`：逐题机器可读清单，便于后台或表格检查。

这一步只验证题型覆盖，不会调用真实大模型，也不会把真题原文注入生产诊断请求。
