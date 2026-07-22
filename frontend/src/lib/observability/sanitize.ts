const SENSITIVE_KEY = /password|token|cookie|authorization|secret|email|notes?|reps?|weight|distance|duration|tempo|rir|payload|body|database|connection/i;
const CONNECTION_STRING = /(?:postgres(?:ql)?|mysql|mongodb):\/\/[^\s]+/gi;
const EMAIL_ADDRESS = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const DYNAMIC_ROUTE_PARENT = new Set(["exercises", "feedback", "programs", "routines", "workouts"]);

function sanitizeRequestPath(value: string) {
  const segments = value.split(/[?#]/, 1)[0].split("/");
  return segments.map((segment, index) => {
    const parent = segments[index - 1];
    return parent && DYNAMIC_ROUTE_PARENT.has(parent) && segment !== "new"
      ? ":id"
      : segment;
  }).join("/");
}

export function sanitizeObservabilityValue(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 4) return "[Truncated]";
  if (typeof value === "string") {
    return value
      .replace(CONNECTION_STRING, "[Redacted connection]")
      .replace(EMAIL_ADDRESS, "[Redacted email]")
      .slice(0, 500);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeObservabilityValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key)
          ? "[Redacted]"
          : sanitizeObservabilityValue(item, depth + 1),
      ]),
    );
  }
  return value;
}

export function sanitizeSentryEvent<T extends object>(event: T): T {
  const sanitized = sanitizeObservabilityValue(event) as T;
  const eventRecord = sanitized as Record<string, unknown>;
  if (eventRecord.request && typeof eventRecord.request === "object") {
    const request = eventRecord.request as Record<string, unknown>;
    delete request.cookies;
    delete request.data;
    delete request.headers;
    if (typeof request.url === "string") request.url = sanitizeRequestPath(request.url);
  }
  return sanitized;
}

export const sensitiveReplayAttributes = {
  "data-ph-no-capture": "true",
  "data-ph-mask": "true",
  "data-sentry-mask": "true",
} as const;
