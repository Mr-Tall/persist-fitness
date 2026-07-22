export function normalizeErrorReference(value?: string | null) {
  const normalized = value?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16);
  return normalized ? normalized.toUpperCase() : null;
}

export function createCorrelationReference() {
  const value = globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return value.replace(/-/g, "").slice(0, 12).toUpperCase();
}
