export interface EvidenceMatchResult {
  matched: boolean;
  mode: "exact" | "normalized" | "token_overlap" | "none";
  score: number;
}

const punctuationPattern = /[\s.,!?;:'"`“”‘’()[\]{}<>，。！？；：、（）【】《》—–\-_/\\|]+/g;

export function normalizeEvidenceText(value: string) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(punctuationPattern, "");
}

function tokenize(value: string) {
  const normalized = String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\u3400-\u9fff]+/gu, " ")
    .trim();

  const englishTokens = normalized.match(/[a-z0-9][a-z0-9']*/g) || [];
  const chineseRuns = normalized.match(/[\u3400-\u9fff]{2,}/g) || [];
  const chineseTokens = chineseRuns.flatMap((run) => {
    const parts: string[] = [];
    for (let index = 0; index < run.length - 1; index += 1) parts.push(run.slice(index, index + 2));
    return parts;
  });

  return [...englishTokens, ...chineseTokens].filter((token) => token.length > 1);
}

export function matchEvidenceInSource(evidence: string, sourceText: string): EvidenceMatchResult {
  const candidate = String(evidence || "").trim();
  const source = String(sourceText || "");

  if (!candidate || !source) return { matched: false, mode: "none", score: 0 };
  if (source.includes(candidate)) return { matched: true, mode: "exact", score: 1 };

  const normalizedEvidence = normalizeEvidenceText(candidate);
  const normalizedSource = normalizeEvidenceText(source);
  if (normalizedEvidence && normalizedSource.includes(normalizedEvidence)) {
    return { matched: true, mode: "normalized", score: 0.92 };
  }

  const evidenceTokens = Array.from(new Set(tokenize(candidate)));
  if (evidenceTokens.length < 4) return { matched: false, mode: "none", score: 0 };
  const sourceTokens = new Set(tokenize(source));
  const matchedTokens = evidenceTokens.filter((token) => sourceTokens.has(token)).length;
  const score = matchedTokens / evidenceTokens.length;

  return score >= 0.72
    ? { matched: true, mode: "token_overlap", score }
    : { matched: false, mode: "none", score };
}
