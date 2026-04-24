export function normalizeLocale(value) {
  const locale = String(value || "zh").trim().toLowerCase();
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("en")) return "en";
  if (locale.startsWith("ja")) return "ja";
  return "zh";
}
