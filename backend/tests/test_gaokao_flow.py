from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.adapters.llm import (
    LlmRouter,
    build_gaokao_diagnosis_payload,
    load_gaokao_error_taxonomy,
    load_gaokao_system_prompt,
    load_gaokao_writing_checklist,
)
from app.adapters.support_llm import SupportAssistantLLM
from app.config import Settings
from app.main import app
from app.models.schemas import ESSAY_CREDIT_PACK_PRODUCT, GROUP_ESSAY_CREDIT_PACK_PRODUCT, FullReport
from app.services.core import service
from app.services.report_quality import GeneratedReportQualityError, score_generated_report_quality, validate_generated_report_quality

client = TestClient(app)

ESSAY = (
    "Dear editor, Recently our school has started a campaign about green life. "
    "I think it is meaningful because small habits can make a real difference. "
    "First, students can bring reusable bottles instead of buying plastic ones every day. "
    "Second, we should turn off the lights when we leave the classroom. "
    "However, some students believe one person cannot change much. "
    "In my opinion, if everyone takes one step, the whole school will become cleaner."
)


def test_text_report_order_unlock_and_refund_rule() -> None:
    draft_res = client.post("/api/v1/drafts", json={"source_type": "text", "raw_input_text": ESSAY})
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["next_step"] == "create_report"
    assert draft["word_count"] >= 41
    assert draft["draft_token"]
    auth = {"authorization": f"Bearer {draft['draft_token']}"}

    missing_token_res = client.post("/api/v1/reports", json={"draft_id": draft["draft_id"]})
    assert missing_token_res.status_code == 401

    report_res = client.post("/api/v1/reports", json={"draft_id": draft["draft_id"]}, headers=auth)
    assert report_res.status_code == 200
    report_id = report_res.json()["report_id"]

    locked_res = client.get(f"/api/v1/reports/{report_id}")
    assert locked_res.status_code == 200
    locked_report = locked_res.json()
    assert locked_report["full_report"] is None
    assert locked_report["is_unlocked"] is False

    missing_contact_res = client.post("/api/v1/orders", json={"report_id": report_id, "product_type": "full_report_single"})
    assert missing_contact_res.status_code == 400

    order_res = client.post("/api/v1/orders", json={"report_id": report_id, "product_type": ESSAY_CREDIT_PACK_PRODUCT, "payer_contact": "student@example.com"})
    assert order_res.status_code == 200
    order = order_res.json()
    assert order["amount_cents"] == 9900
    assert order["credit_granted"] == 20
    assert order["merchant_code"]

    sync_res = client.post(f"/api/v1/orders/{order['order_id']}/sync")
    assert sync_res.status_code == 200
    assert sync_res.json()["status"] == "PAID"
    assert service.repo.credit_accounts["student@example.com"].remaining_credits == 19

    unlocked_res = client.get(f"/api/v1/reports/{report_id}")
    assert unlocked_res.status_code == 200
    unlocked_report = unlocked_res.json()
    assert unlocked_report["is_unlocked"] is True
    assert unlocked_report["full_report"] is not None
    full_report = unlocked_report["full_report"]
    assert full_report["overall_review"]
    assert len(full_report["fatal_risks"]) == 3
    assert 3 <= len(full_report["highlight_spans"]) <= 8
    assert all(span["correction"] and span["principle"] and span["risk_note"] for span in full_report["highlight_spans"])
    assert full_report["rewrites"]["safe_version"]
    assert full_report["rewrites"]["advanced_version"]
    assert len(full_report["study_plan"]) >= 3
    assert full_report["advanced_phrases"]

    refund_res = client.post(f"/api/v1/orders/{order['order_id']}/refund-request", json={"reason": "user_clicked"})
    assert refund_res.status_code == 200
    assert refund_res.json()["refund_triggered"] is False

    report_2, _ = _create_completed_report()
    credit_unlock_res = client.post(f"/api/v1/reports/{report_2}/unlock-with-credit", json={"payer_contact": "student@example.com"})
    assert credit_unlock_res.status_code == 200
    assert credit_unlock_res.json()["credit_remaining"] == 18
    report_2_unlocked = client.get(f"/api/v1/reports/{report_2}").json()
    assert report_2_unlocked["is_unlocked"] is True


def test_full_report_schema_rejects_incomplete_deep_report() -> None:
    with pytest.raises(ValidationError):
        FullReport.model_validate(
            {
                "overall_review": "整体评价",
                "fatal_risks": [
                    {"title": "风险一", "severity": "major", "explanation": "说明"},
                    {"title": "风险二", "severity": "major", "explanation": "说明"},
                    {"title": "风险三", "severity": "minor", "explanation": "说明"},
                ],
                "gaokao_dimensions": {
                    "content": {"score": 4, "max": 5, "comment": "ok"},
                    "language": {"score": 3, "max": 5, "comment": "ok"},
                    "structure": {"score": 4, "max": 5, "comment": "ok"},
                    "cohesion": {"score": 3, "max": 5, "comment": "ok"},
                    "format": {"score": 4, "max": 5, "comment": "ok"},
                },
                "highlight_spans": [
                    {
                        "start": 0,
                        "end": 4,
                        "original": "test",
                        "severity": "major",
                        "category": "logic",
                        "comment": "missing correction and principle",
                        "position_status": "aligned",
                    }
                ],
                "logic_map": [],
                "rewrites": {"safe_version": "safe", "advanced_version": "advanced"},
                "study_plan": [{"priority": 1, "skill": "skill", "exercise": "exercise"}],
                "advanced_phrases": [],
                "disclaimer": "AI report",
            }
        )


def test_image_upload_ocr_confirm_report_path() -> None:
    draft_res = client.post("/api/v1/drafts", json={"source_type": "image"})
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["next_step"] == "upload_image"
    auth = {"authorization": f"Bearer {draft['draft_token']}"}

    upload_res = client.post(
        "/api/v1/uploads/intents",
        json={"draft_id": draft["draft_id"], "file_name": "essay.jpg", "mime_type": "image/jpeg", "size_bytes": 1000},
        headers=auth,
    )
    assert upload_res.status_code == 200
    upload = upload_res.json()
    assert upload["upload_url"].startswith("https://mock-cos.local/")

    complete_res = client.post(
        f"/api/v1/uploads/{upload['upload_intent_id']}/complete",
        json={"bucket": upload["bucket"], "object_key": upload["object_key"], "mime_type": "image/jpeg", "size_bytes": 1000},
        headers=auth,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["recognition_status"] == "COMPLETED"

    recognition_res = client.get(f"/api/v1/drafts/{draft['draft_id']}/recognition", headers=auth)
    assert recognition_res.status_code == 200
    ocr = recognition_res.json()["ocr_result"]
    assert ocr["transcribed_text"]
    assert ocr["uncertain_spans"]

    confirm_res = client.post(f"/api/v1/drafts/{draft['draft_id']}/confirm", json={"confirmed_text": ocr["transcribed_text"]}, headers=auth)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["confirmed"] is True

    report_res = client.post("/api/v1/reports", json={"draft_id": draft["draft_id"]}, headers=auth)
    assert report_res.status_code == 200


def test_failed_report_smart_appeal_recovers() -> None:
    draft_res = client.post("/api/v1/drafts", json={"source_type": "text", "raw_input_text": ESSAY})
    draft = draft_res.json()
    report_res = client.post(
        "/api/v1/reports",
        json={"draft_id": draft["draft_id"], "mock_strategy": "failed"},
        headers={"authorization": f"Bearer {draft['draft_token']}"},
    )
    report_id = report_res.json()["report_id"]
    before = client.get(f"/api/v1/reports/{report_id}").json()
    assert before["status"] == "FAILED"

    appeal_res = client.post(f"/api/v1/reports/{report_id}/smart-appeal", json={"reason": "report_not_generated"})
    assert appeal_res.status_code == 200
    assert appeal_res.json()["retry_triggered"] is True
    after = client.get(f"/api/v1/reports/{report_id}").json()
    assert after["status"] == "COMPLETED"


def _create_completed_report() -> tuple[str, dict[str, str]]:
    draft_res = client.post(
        "/api/v1/drafts",
        json={"source_type": "text", "raw_input_text": ESSAY},
        headers={"x-forwarded-for": f"203.0.113.{uuid4().int % 200 + 1}"},
    )
    draft = draft_res.json()
    auth = {"authorization": f"Bearer {draft['draft_token']}"}
    report_res = client.post("/api/v1/reports", json={"draft_id": draft["draft_id"]}, headers=auth)
    return report_res.json()["report_id"], auth


def test_group_buy_requires_three_paid_members_or_explicit_official_assist() -> None:
    report_1, _ = _create_completed_report()
    order_1_res = client.post("/api/v1/orders", json={"report_id": report_1, "product_type": GROUP_ESSAY_CREDIT_PACK_PRODUCT, "payer_contact": "student1@example.com"})
    assert order_1_res.status_code == 200
    order_1 = order_1_res.json()
    group_id = order_1["group_buy_id"]
    assert order_1["amount_cents"] == 5300
    assert group_id

    sync_1 = client.post(f"/api/v1/orders/{order_1['order_id']}/sync")
    assert sync_1.status_code == 200
    assert sync_1.json()["status"] == "PAID"
    locked_1 = client.get(f"/api/v1/reports/{report_1}").json()
    assert locked_1["is_unlocked"] is False

    report_2, _ = _create_completed_report()
    order_2 = client.post(
        "/api/v1/orders",
        json={"report_id": report_2, "product_type": GROUP_ESSAY_CREDIT_PACK_PRODUCT, "group_buy_id": group_id, "payer_contact": "student2@example.com"},
    ).json()
    client.post(f"/api/v1/orders/{order_2['order_id']}/sync")
    still_locked_2 = client.get(f"/api/v1/reports/{report_2}").json()
    assert still_locked_2["is_unlocked"] is False

    assist_res = client.post(f"/api/v1/groups/{group_id}/official-assist")
    assert assist_res.status_code == 200
    group = assist_res.json()
    assert group["official_assist_used"] is True
    assert group["status"] == "SUCCESS"
    platform_members = [
        member
        for member in service.repo.group_members.values()
        if str(member.group_buy_id) == group_id and member.member_type == "PLATFORM_ASSIST" and member.payment_status == "ASSISTED"
    ]
    assert len(platform_members) == 1
    assert platform_members[0].order_id is None
    assert platform_members[0].report_id is None
    assert any(action.action == "OFFICIAL_ASSIST_APPLIED" and f"group_buy_id={group_id}" in (action.message or "") for action in service.repo.support_actions)

    unlocked_1 = client.get(f"/api/v1/reports/{report_1}").json()
    unlocked_2 = client.get(f"/api/v1/reports/{report_2}").json()
    assert unlocked_1["is_unlocked"] is True
    assert unlocked_2["is_unlocked"] is True
    assert service.repo.credit_accounts["student1@example.com"].remaining_credits == 19
    assert service.repo.credit_accounts["student2@example.com"].remaining_credits == 19


def test_production_config_fails_fast_on_mock_defaults() -> None:
    settings = Settings(environment="production")
    with pytest.raises(RuntimeError) as exc:
        settings.validate_runtime()
    message = str(exc.value)
    assert "Invalid production configuration" in message
    assert "DATABASE_URL" in message
    assert "PAYMENT_PROVIDER" in message


def test_tencent_tokenhub_routes_paid_to_pro_then_flash_fallback() -> None:
    settings = Settings(
        llm_provider_order="tencent_tokenhub",
        tencent_tokenhub_api_key="test-key",
        tencent_tokenhub_free_model="deepseek-v4-flash",
        tencent_tokenhub_paid_model="deepseek-v4-pro",
        tencent_tokenhub_fallback_model="deepseek-v4-flash",
    )
    router = LlmRouter(settings.llm_provider_list, settings)

    paid_configs = router._provider_configs(tier="paid")
    assert [config.model for config in paid_configs] == ["deepseek-v4-pro", "deepseek-v4-flash"]
    assert [config.model_tier for config in paid_configs] == ["pro", "fallback"]

    free_configs = router._provider_configs(tier="free")
    assert [config.model for config in free_configs] == ["deepseek-v4-flash"]
    assert free_configs[0].model_tier == "flash"


def test_generated_report_quality_accepts_mock_report() -> None:
    free_summary, full_report, _ = LlmRouter(["mock"]).diagnose(
        essay_text=ESSAY,
        word_count=70,
        source_type="text",
    )

    validate_generated_report_quality(ESSAY, free_summary, full_report)
    quality = score_generated_report_quality(ESSAY, free_summary, full_report)

    assert quality.schema_ok is True
    assert quality.score >= 80


def test_generated_report_quality_rejects_banned_terms() -> None:
    free_summary, full_report, _ = LlmRouter(["mock"]).diagnose(
        essay_text=ESSAY,
        word_count=70,
        source_type="text",
    )
    broken = full_report.model_copy(update={"disclaimer": "本报告保证提分。"})

    with pytest.raises(GeneratedReportQualityError) as exc:
        validate_generated_report_quality(ESSAY, free_summary, broken)

    assert "banned terms found" in str(exc.value)


def test_generated_report_quality_rejects_missing_aligned_original() -> None:
    free_summary, full_report, _ = LlmRouter(["mock"]).diagnose(
        essay_text=ESSAY,
        word_count=70,
        source_type="text",
    )
    spans = list(full_report.highlight_spans)
    spans[0] = spans[0].model_copy(update={"original": "This sentence is not in the essay.", "position_status": "aligned"})
    broken = full_report.model_copy(update={"highlight_spans": spans})

    with pytest.raises(GeneratedReportQualityError) as exc:
        validate_generated_report_quality(ESSAY, free_summary, broken)

    assert "highlight original not found" in str(exc.value)


def test_generated_report_quality_accepts_ellipsis_fuzzy_original() -> None:
    free_summary, full_report, _ = LlmRouter(["mock"]).diagnose(
        essay_text=ESSAY,
        word_count=70,
        source_type="text",
    )
    spans = list(full_report.highlight_spans)
    spans[0] = spans[0].model_copy(update={"original": "small habits can make a real difference...", "position_status": "aligned"})
    adjusted = full_report.model_copy(update={"highlight_spans": spans})

    quality = score_generated_report_quality(ESSAY, free_summary, adjusted)

    assert quality.schema_ok is True


def test_generated_report_quality_rejects_missing_dimensions() -> None:
    free_summary, full_report, _ = LlmRouter(["mock"]).diagnose(
        essay_text=ESSAY,
        word_count=70,
        source_type="text",
    )
    broken = full_report.model_copy()
    broken.gaokao_dimensions = {"content": full_report.gaokao_dimensions["content"]}

    with pytest.raises(GeneratedReportQualityError) as exc:
        validate_generated_report_quality(ESSAY, free_summary, broken)

    assert "missing dimensions" in str(exc.value)


def test_gaokao_prompt_includes_production_scoring_rubric() -> None:
    prompt = load_gaokao_system_prompt()

    assert "25 分制五档锚点" in prompt
    assert "21-25 分" in prompt
    assert "16-20 分" in prompt
    assert "100-120 词" in prompt
    assert "读后续写" in prompt
    assert "不得由 `gaokao_dimensions` 简单相加" in prompt
    assert "高考常见错误 Taxonomy" in prompt
    assert "chinglish_literal_translation" in prompt
    assert "forced_advanced_expression" in prompt
    assert "高考写作诊断 Checklist" in prompt
    assert "审题 3 分钟" in prompt
    assert "不得把“使用 5 个高级词汇”" in prompt


def test_gaokao_payload_includes_structured_scoring_rubric() -> None:
    payload = build_gaokao_diagnosis_payload(
        provider_name="mock",
        essay_text=ESSAY,
        word_count=len(ESSAY.split()),
        source_type="text",
        prompt_version="gaokao_default",
    )

    rubric = payload["scoring_rubric"]
    assert rubric["max_score"] == 25
    assert rubric["score_bands"][0]["range"] == "21-25"
    assert rubric["score_bands"][-1]["range"] == "1-5"
    assert rubric["word_count_rules"]["traditional_single_essay_target"] == "100-120 words"
    assert rubric["word_count_rules"]["new_gaokao_application_target"] == "about 80 words"
    assert rubric["word_count_rules"]["new_gaokao_continuation_target"] == "about 150 words"
    assert any("five-band scoring_rubric" in item for item in payload["quality_requirements"])
    checklist = payload["writing_checklist"]
    assert checklist["diagnosis_priority"] == ["content_key_points", "language_quality", "essay_structure"]
    assert checklist["exam_time_advice"]["plan_minutes"] == 3
    assert "subject-verb agreement" in checklist["exam_time_advice"]["check_targets"]
    assert any("writing_checklist" in item for item in payload["quality_requirements"])


def test_gaokao_payload_accepts_optional_task_context() -> None:
    task_prompt = "假设你是李华，请写邮件邀请外教 Mr. Smith 参加学校端午节文化活动。内容包括：活动时间地点、主要内容、邀请理由。"
    payload = build_gaokao_diagnosis_payload(
        provider_name="mock",
        essay_text=ESSAY,
        word_count=len(ESSAY.split()),
        source_type="text",
        prompt_version="gaokao_default",
        task_prompt=task_prompt,
        task_type="application_writing",
        expected_word_count="80-120 words",
    )

    assert payload["task_context"]["provided"] is True
    assert payload["task_context"]["task_prompt"] == task_prompt
    assert payload["task_context"]["task_type"] == "application_writing"
    assert payload["task_context"]["expected_word_count"] == "80-120 words"
    assert any("task_context.task_prompt" in item for item in payload["quality_requirements"])
    meta_schema = payload["required_schema"]["full_report"]["diagnosis_meta"]
    assert meta_schema["task_context_provided"] is True
    assert meta_schema["task_type"] == "application_writing"


def test_gaokao_payload_includes_error_taxonomy() -> None:
    payload = build_gaokao_diagnosis_payload(
        provider_name="mock",
        essay_text=ESSAY,
        word_count=len(ESSAY.split()),
        source_type="text",
        prompt_version="gaokao_default",
    )

    taxonomy = payload["error_taxonomy"]
    assert "task_deviation" in taxonomy["task_and_content"]
    assert "format_element_missing" in taxonomy["task_and_content"]
    assert "audience_register_mismatch" in taxonomy["task_and_content"]
    assert "connector_misuse" in taxonomy["structure_and_cohesion"]
    assert "topic_sentence_missing" in taxonomy["structure_and_cohesion"]
    assert "template_stacking" in taxonomy["structure_and_cohesion"]
    assert "chinglish_literal_translation" in taxonomy["lexis_and_collocation"]
    assert "preposition_error" in taxonomy["lexis_and_collocation"]
    assert "spelling_error" in taxonomy["lexis_and_collocation"]
    assert "word_choice_imprecision" in taxonomy["lexis_and_collocation"]
    assert "subject_verb_agreement" in taxonomy["grammar_accuracy"]
    assert "clause_structure_error" in taxonomy["grammar_accuracy"]
    assert "verb_pattern_error" in taxonomy["grammar_accuracy"]
    assert "punctuation_capitalization_error" in taxonomy["grammar_accuracy"]
    assert "forced_advanced_expression" in taxonomy["expression_level"]
    assert "vague_basic_vocabulary" in taxonomy["expression_level"]
    assert "mechanical_advanced_wording" in taxonomy["expression_level"]
    assert any("known error_taxonomy ids" in item for item in payload["quality_requirements"])


def test_gaokao_error_taxonomy_file_captures_common_student_errors() -> None:
    taxonomy = load_gaokao_error_taxonomy()

    assert "审题草率" in taxonomy
    assert "Although/but" in taxonomy
    assert "introduce ... for" in taxonomy
    assert "my heart is very pain" in taxonomy
    assert "称呼、署名" in taxonomy
    assert "主题句" in taxonomy
    assert "enjoy to do" in taxonomy
    assert "open the TV" in taxonomy
    assert "good/bad/important" in taxonomy
    assert "伪高级表达" in taxonomy


def test_gaokao_writing_checklist_file_captures_actionable_advice() -> None:
    checklist = load_gaokao_writing_checklist()

    assert "内容要点" in checklist
    assert "语言质量" in checklist
    assert "篇章结构" in checklist
    assert "important -> vital" in checklist
    assert "审题 3 分钟" in checklist
    assert "不得把“使用 5 个高级词汇”“至少 3 种从句”当作硬性评分规则" in checklist


def test_support_llm_sanitizes_sensitive_input() -> None:
    settings = Settings(support_chat_llm_enabled=True, llm_provider_order="tencent_tokenhub", tencent_tokenhub_api_key="test-key")
    assistant = SupportAssistantLLM(settings)

    sanitized = assistant.sanitize_message("手机号 13812345678 邮箱 test@example.com 订单 12345678901234567890")

    assert "13812345678" not in sanitized
    assert "test@example.com" not in sanitized
    assert "12345678901234567890" not in sanitized
    assert "[手机号已隐藏]" in sanitized
    assert "[邮箱已隐藏]" in sanitized
    assert "[长编号已隐藏]" in sanitized


def test_support_llm_uses_tokenhub_flash_for_rule_miss() -> None:
    class FakeMessage:
        content = "这是系统护航助手的兜底回复。"

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]

    class FakeCompletions:
        def __init__(self) -> None:
            self.calls: list[dict] = []

        def create(self, **kwargs):
            self.calls.append(kwargs)
            return FakeResponse()

    class FakeChat:
        def __init__(self, completions: FakeCompletions) -> None:
            self.completions = completions

    class FakeClient:
        def __init__(self) -> None:
            self.completions = FakeCompletions()
            self.chat = FakeChat(self.completions)

    fake_client = FakeClient()
    settings = Settings(
        support_chat_llm_enabled=True,
        llm_provider_order="tencent_tokenhub",
        tencent_tokenhub_api_key="test-key",
        tencent_tokenhub_free_model="deepseek-v4-flash",
        support_chat_llm_timeout_seconds=3,
    )
    assistant = SupportAssistantLLM(settings, client_factory=lambda **_: fake_client)

    answer = assistant.answer("我想了解这个系统怎么判断作文逻辑")

    assert answer == "这是系统护航助手的兜底回复。"
    call = fake_client.completions.calls[0]
    assert call["model"] == "deepseek-v4-flash"
    assert call["timeout"] == 3
    assert "系统护航助手" in call["messages"][0]["content"]
    assert call["messages"][1]["content"] == "我想了解这个系统怎么判断作文逻辑"


def test_support_chat_uses_knowledge_base_rules() -> None:
    pricing_res = client.post("/api/v1/support/chat", json={"message": "99 元和 53 元套餐能用多少次？"})
    assert pricing_res.status_code == 200
    pricing = pricing_res.json()
    assert "20 篇深度精诊额度包" in pricing["message"]
    assert "不是无限次" in pricing["message"]
    assert pricing["escalation_allowed"] is False

    refund_res = client.post("/api/v1/support/chat", json={"message": "扣费后未解锁，能退款吗？"})
    assert refund_res.status_code == 200
    refund = refund_res.json()
    assert "智能申诉与重试" in refund["message"]
    assert "原路退款或补发权益" in refund["message"]
    assert "trigger_smart_appeal" in refund["suggested_actions"]

    unlocked_res = client.post("/api/v1/support/chat", json={"message": "支付成功了但是没有解锁报告"})
    assert unlocked_res.status_code == 200
    assert "trigger_smart_appeal" in unlocked_res.json()["suggested_actions"]

    upload_res = client.post("/api/v1/support/chat", json={"message": "拍照作文怎么识别？"})
    assert upload_res.status_code == 200
    upload = upload_res.json()
    assert "提取文字" in upload["message"]
    assert "微信" in upload["message"]
