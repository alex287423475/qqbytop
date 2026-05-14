from __future__ import annotations

import hashlib
import re

WORD_RE = re.compile(r"[A-Za-z]+(?:[-'][A-Za-z]+)?")


def normalize_essay_text(value: str) -> str:
    return re.sub(r"[ \t]+", " ", value.replace("\r\n", "\n")).strip()


def count_english_words(value: str) -> int:
    return len(WORD_RE.findall(normalize_essay_text(value)))


def confirmed_text_hash(value: str) -> str:
    normalized = normalize_essay_text(value).lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def validate_essay_text(value: str) -> tuple[str, int]:
    normalized = normalize_essay_text(value)
    word_count = count_english_words(normalized)
    if not normalized:
        raise ValueError("请先提交作文正文。")
    if word_count < 41:
        raise ValueError("作文正文至少需要 41 个英文词。")
    if word_count > 350:
        raise ValueError("作文正文不能超过 350 个英文词。")
    return normalized, word_count
