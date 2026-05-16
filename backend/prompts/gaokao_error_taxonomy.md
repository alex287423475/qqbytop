本错误分类用于高考英语作文诊断的生产默认错误识别。它来自高考书面表达常见错误整理，只作为内部质量控制和模型诊断参考，不作为公开宣传材料。

## 审题与内容完成

- task_deviation：审题草率、偏离主题、把求助信写成求职信、缺漏题目要点或无限发挥。
- missing_key_points：未覆盖时间、地点、活动内容、邀请理由、感谢/期待等应用文关键要素。
- format_element_missing：应用文格式要素缺失，如称呼、署名、写信目的、活动时间地点、邀请理由或期待回复。
- audience_register_mismatch：对象、身份或语气不匹配，如给外教写信却使用同学口吻，通知、演讲、投稿语域混乱。
- key_point_underdeveloped：要点虽然提到，但没有展开理由、细节、例子或与题目任务的关系。
- contradiction：前后观点或选择自相矛盾，导致读者无法判断真实立场。
- off_topic_filler：夹杂与题目无关的背诵句、阅读理解句或模板句。

## 结构与连贯

- paragraph_disorder：从头到尾只有一段，或随意过度分段，首尾不能呼应。
- topic_sentence_missing：段落缺少主题句，读者难以快速判断本段功能。
- weak_cohesion：缺少连接成分，句子之间只是堆叠，逻辑跳跃。
- connector_misuse：Although/but、Because/so 连用；and/then/so 机械堆叠。
- transition_gap：段落之间跳转突兀，缺少承接、转折、因果或总结信号。
- template_stacking：模板句堆砌，句子看似高级但与具体任务脱节，导致逻辑断裂。
- run_on_or_fragment：连写多个动词、缺主语或缺谓语，句子结构不完整。

## 词汇与搭配

- collocation_error：词汇搭配不当，如 introduce ... for 应改为 introduce ... to。
- preposition_error：介词误用或遗漏，如 discuss about、arrive to、be interested with。
- spelling_error：拼写错误，如 becuase、beatiful、enviroment，按是否影响理解分级。
- word_form_error：词性误用，如 well/good、healthy/health、other/others。
- word_choice_imprecision：词义选择不准或近义词误用，如把“打开电视”写成 open the TV 而不是 turn on the TV。
- idiom_or_phrase_misuse：固定短语、习语或动词短语误用，如 look forward to do、make a progress。
- countability_error：可数/不可数和单复数误用，如 informations、luggages。
- article_error：冠词多余、缺失或误用，如 in the society、by the hands。
- chinglish_literal_translation：逐字翻译导致中式英语，如 my heart is very pain、I very like。
- redundant_expression：重复累赘，如 speak fluent English fluently、reason why ... because。

## 语法准确性

- tense_error：时态不一致或文体时态错误，叙事、书信、通知、观点文时态混乱。
- voice_error：被动语态误用或缺失，如 will be hold、I will accept。
- subject_verb_agreement：主谓一致错误，如 The eating habit ... have。
- pronoun_reference_error：代词指代或单复数不一致，如 shoes ... like it。
- clause_structure_error：从句结构或关系词错误，如 I think he can comes、the place where we visited。
- verb_pattern_error：动词后接形式错误，如 enjoy to do、let sb to do、suggest sb to do。
- sentence_pattern_transfer：汉语句式迁移导致英语结构异常，如 “There are many students like play basketball”。
- modifier_error：悬垂修饰语或逻辑主语不一致，如 At the age of six, my father...
- parallelism_error：并列结构不平行，如 do shopping, banking and read。
- nonfinite_clause_error：定语从句、非谓语、分词作定语使用错误。
- punctuation_capitalization_error：标点、大小写、句号逗号误用，影响阅读节奏或应用文格式。

## 表达层级

- simple_sentence_overuse：句式长期停留在简单主谓宾，缺少同位语、从句、非谓语或有效连接。
- vague_basic_vocabulary：good/bad/important/thing/people 等基础词反复出现，表达准确但层级偏低。
- forced_advanced_expression：伪高级表达；为追求高级而滥用生僻词或冗长句，造成啰嗦、晦涩或身份不合适。
- mechanical_advanced_wording：机械替换高级词或万能句，词义、场景或搭配不自然。
- weak_register：应用文语气不合适，邀请、求助、感谢、建议等功能句不够自然。
- tone_inappropriateness：正式/非正式语气错位，礼貌程度、情绪强度或立场表达不符合任务对象。

## 诊断输出要求

- `highlight_spans.category` 应优先使用以上类别或其中文等价表达，避免泛泛写成“语法问题”。
- 每条高亮必须给出：错误片段、错误类型、为什么扣分、如何改写、对应提分原理。
- 对低分作文要果断识别结构崩塌和离题风险，不要替学生补全不存在的内容。
- 对语法基本正确但表达平庸的作文，不应只说“没有大错”，必须指出句式单一、表达层级不足和可升级路径。
