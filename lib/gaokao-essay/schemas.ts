import { GAOKAO_ESSAY_WORD_LIMITS } from "./constants";

export function normalizeEssayText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

export function countEnglishWords(value: string) {
  const matches = normalizeEssayText(value).match(/[A-Za-z]+(?:[-'][A-Za-z]+)?/g);
  return matches?.length ?? 0;
}

export function validateEssayText(value: string) {
  const normalized = normalizeEssayText(value);
  const wordCount = countEnglishWords(normalized);
  const errors: string[] = [];

  if (!normalized) errors.push("请先粘贴高考英语作文正文。");
  if (wordCount > 0 && wordCount < GAOKAO_ESSAY_WORD_LIMITS.min) {
    errors.push(`正文至少需要 ${GAOKAO_ESSAY_WORD_LIMITS.min} 个英文词。`);
  }
  if (wordCount > GAOKAO_ESSAY_WORD_LIMITS.max) {
    errors.push(`正文不能超过 ${GAOKAO_ESSAY_WORD_LIMITS.max} 个英文词。`);
  }

  return { normalized, wordCount, errors, valid: errors.length === 0 };
}

export function createConfirmedTextHash(value: string) {
  const normalized = normalizeEssayText(value).toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
