from __future__ import annotations

from time import time

from app.config import Settings
from app.models.schemas import OcrArtifact, OcrLineItem, OcrResult, OcrUncertainSpan


class OcrAdapter:
    def recognize(self, *, bucket: str, object_key: str) -> OcrResult:
        raise NotImplementedError


class MockOcrAdapter(OcrAdapter):
    def recognize(self, *, bucket: str, object_key: str) -> OcrResult:
        text = (
            "Dear editor,\n"
            "Recently our school has started a campaign about green life. "
            "Students can bring reusable bottles and turn off lights after class. "
            "We can also reuse paper and remind our friends to save water. "
            "Although these actions look small, they will help us build better habits. "
            "If everyone takes one step, our school will become cleaner and more beautiful.\n"
            "Yours,\nLi Hua"
        )
        lines = text.splitlines()
        return OcrResult(
            transcribed_text=text,
            line_items=[OcrLineItem(line_no=index + 1, text=line, confidence=0.92) for index, line in enumerate(lines)],
            uncertain_spans=[
                OcrUncertainSpan(line_no=2, text="our school", possible_values=["our school", "out school"], reason="手写 r/t 形态接近。")
            ],
            quality_warnings=[],
            likely_ocr_artifacts=[OcrArtifact(text=object_key[-8:], reason="mock provider object key trace, not user text.")],
        )


class TencentHandwritingOcrAdapter(OcrAdapter):
    def __init__(self, settings: Settings, read_url_factory) -> None:
        from tencentcloud.common.credential import Credential
        from tencentcloud.ocr.v20181119.ocr_client import OcrClient

        secret_id = settings.tencent_secret_id or settings.cos_secret_id
        secret_key = settings.tencent_secret_key or settings.cos_secret_key
        if not secret_id or not secret_key:
            raise RuntimeError("Tencent OCR credentials are incomplete.")
        self.read_url_factory = read_url_factory
        self.client = OcrClient(Credential(secret_id, secret_key), settings.tencent_ocr_region)

    def recognize(self, *, bucket: str, object_key: str) -> OcrResult:
        from tencentcloud.ocr.v20181119.models import GeneralHandwritingOCRRequest

        image_url = self.read_url_factory(bucket=bucket, object_key=object_key, expires_seconds=300)
        request = GeneralHandwritingOCRRequest()
        request.ImageUrl = image_url
        response = self.client.GeneralHandwritingOCR(request)
        detections = getattr(response, "TextDetections", None) or []
        lines: list[OcrLineItem] = []
        uncertain: list[OcrUncertainSpan] = []
        for index, item in enumerate(detections):
            text = getattr(item, "DetectedText", "") or ""
            confidence = float(getattr(item, "Confidence", 0) or 0) / 100
            lines.append(OcrLineItem(line_no=index + 1, text=text, confidence=confidence))
            if confidence and confidence < 0.85:
                uncertain.append(OcrUncertainSpan(line_no=index + 1, text=text, possible_values=[], reason="OCR 置信度偏低，请用户校对。"))
        transcribed_text = "\n".join(line.text for line in lines if line.text).strip()
        warnings = [] if transcribed_text else ["OCR 未识别出有效文本，请重新拍照或改为手动输入。"]
        return OcrResult(transcribed_text=transcribed_text, line_items=lines, uncertain_spans=uncertain, quality_warnings=warnings, likely_ocr_artifacts=[])


class BaiduHandwritingOcrAdapter(OcrAdapter):
    def __init__(self, settings: Settings, read_url_factory) -> None:
        if not settings.baidu_ocr_api_key or not settings.baidu_ocr_secret_key:
            raise RuntimeError("Baidu OCR credentials are incomplete.")
        self.api_key = settings.baidu_ocr_api_key
        self.secret_key = settings.baidu_ocr_secret_key
        self.endpoint = settings.baidu_ocr_endpoint
        self.token_url = settings.baidu_ocr_token_url
        self.read_url_factory = read_url_factory
        self._access_token: str | None = None
        self._token_expires_at = 0.0

    def _get_access_token(self) -> str:
        if self._access_token and time() < self._token_expires_at - 60:
            return self._access_token

        import requests

        response = requests.post(
            self.token_url,
            params={
                "grant_type": "client_credentials",
                "client_id": self.api_key,
                "client_secret": self.secret_key,
            },
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
        token = payload.get("access_token")
        if not token:
            raise RuntimeError(f"Baidu OCR token response missing access_token: {payload.get('error_description') or payload.get('error')}")
        self._access_token = token
        self._token_expires_at = time() + float(payload.get("expires_in") or 2_592_000)
        return token

    def recognize(self, *, bucket: str, object_key: str) -> OcrResult:
        import requests

        access_token = self._get_access_token()
        image_url = self.read_url_factory(bucket=bucket, object_key=object_key, expires_seconds=300)
        response = requests.post(
            self.endpoint,
            params={"access_token": access_token},
            data={
                "url": image_url,
                "recognize_granularity": "big",
            },
            headers={"content-type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if "error_code" in payload:
            raise RuntimeError(f"Baidu OCR failed: {payload.get('error_code')} {payload.get('error_msg')}")

        words_result = payload.get("words_result") or []
        lines: list[OcrLineItem] = []
        uncertain: list[OcrUncertainSpan] = []
        for index, item in enumerate(words_result):
            text = str(item.get("words") or "").strip()
            probability = item.get("probability") or {}
            confidence = _baidu_probability(probability)
            if not text:
                continue
            lines.append(OcrLineItem(line_no=index + 1, text=text, confidence=confidence))
            if confidence and confidence < 0.85:
                uncertain.append(OcrUncertainSpan(line_no=index + 1, text=text, possible_values=[], reason="百度 OCR 置信度偏低，请用户在校对页确认。"))

        transcribed_text = "\n".join(line.text for line in lines).strip()
        warnings = [] if transcribed_text else ["百度 OCR 未识别出有效文本，请重新拍照或改为手动输入。"]
        return OcrResult(transcribed_text=transcribed_text, line_items=lines, uncertain_spans=uncertain, quality_warnings=warnings, likely_ocr_artifacts=[])


def _baidu_probability(probability: object) -> float:
    if isinstance(probability, dict):
        for key in ("average", "min", "variance"):
            value = probability.get(key)
            if isinstance(value, int | float):
                return float(value)
    return 0.9


def build_ocr_adapter(settings: Settings, storage) -> OcrAdapter:
    if settings.ocr_provider == "baidu_ocr":
        return BaiduHandwritingOcrAdapter(settings, storage.create_presigned_get)
    if settings.ocr_provider == "tencent_ocr":
        return TencentHandwritingOcrAdapter(settings, storage.create_presigned_get)
    return MockOcrAdapter()
