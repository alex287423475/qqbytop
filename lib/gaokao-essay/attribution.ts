import type { MarketingAttribution } from "./types";

const STORAGE_KEY = "gaokao_essay_attribution_v1";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `attr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value && value.trim() ? value.trim() : null;
}

export function captureMarketingAttribution(searchParams: URLSearchParams) {
  if (typeof window === "undefined") return null;

  const existing = getStoredMarketingAttribution();
  if (existing) return existing;

  const attribution: MarketingAttribution = {
    attribution_id: createId(),
    utm_source: readParam(searchParams, "utm_source"),
    utm_medium: readParam(searchParams, "utm_medium"),
    utm_campaign: readParam(searchParams, "utm_campaign"),
    utm_content: readParam(searchParams, "utm_content"),
    utm_term: readParam(searchParams, "utm_term"),
    referrer: document.referrer || null,
    landing_path: `${window.location.pathname}${window.location.search}`,
    first_seen_at: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
}

export function getStoredMarketingAttribution() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MarketingAttribution;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
