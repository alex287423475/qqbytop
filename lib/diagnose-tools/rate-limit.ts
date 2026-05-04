type Bucket = {
  count: number;
  resetAt: number;
};

const windowBuckets = new Map<string, Bucket>();
const dayBuckets = new Map<string, Bucket>();

function limitNumber(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function checkBucket(map: Map<string, Bucket>, key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || bucket.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }
  if (bucket.count >= max) return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  bucket.count += 1;
  return { allowed: true, remaining: Math.max(0, max - bucket.count), resetAt: bucket.resetAt };
}

export function checkDiagnoseRateLimit(key: string) {
  const windowMs = limitNumber("RATE_LIMIT_WINDOW_MS", 60000);
  const maxPerWindow = limitNumber("RATE_LIMIT_MAX_PER_WINDOW", 10);
  const maxPerDay = limitNumber("RATE_LIMIT_MAX_PER_DAY", 30);
  const minute = checkBucket(windowBuckets, `m:${key}`, maxPerWindow, windowMs);
  if (!minute.allowed) return { ...minute, scope: "window" as const };
  const daily = checkBucket(dayBuckets, `d:${key}`, maxPerDay, 24 * 60 * 60 * 1000);
  if (!daily.allowed) return { ...daily, scope: "day" as const };
  return { allowed: true, remaining: Math.min(minute.remaining, daily.remaining), resetAt: Math.max(minute.resetAt, daily.resetAt), scope: "ok" as const };
}
