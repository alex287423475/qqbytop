export function stripUnsafeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "");
}

export function sanitizePlainText(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return stripUnsafeHtml(String(value))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUserContext(value: unknown, maxLength: number) {
  return sanitizePlainText(value, maxLength).replace(/[<>]/g, "");
}

export function sanitizeAiText(value: unknown, maxLength: number) {
  return sanitizePlainText(value, maxLength).replace(/\s{3,}/g, " ");
}
