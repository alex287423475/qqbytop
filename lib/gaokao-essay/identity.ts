"use client";

const CONTACT_KEY = "gaokao_essay_payer_contact";

export function normalizePayerContact(value: string) {
  return value.trim();
}

export function isValidPayerContact(value: string) {
  const contact = normalizePayerContact(value);
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    return Boolean(local && domain?.includes(".") && contact.length <= 120);
  }
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

export function savePayerContact(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTACT_KEY, normalizePayerContact(value));
}

export function loadPayerContact() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CONTACT_KEY) || "";
}
