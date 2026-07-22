import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent } from "@sentry/core";
import { sanitizeSentryEvent } from "./sanitize";

function traceSampleRate() {
  const configured = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05");
  return Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : 0.05;
}

export function sentryOptions(runtime: "client" | "server" | "edge") {
  const dsn = runtime === "client" ? process.env.NEXT_PUBLIC_SENTRY_DSN : process.env.SENTRY_DSN;
  return {
    dsn,
    enabled: Boolean(dsn) && process.env.NODE_ENV !== "test",
    environment:
      process.env.NEXT_PUBLIC_APP_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV,
    release:
      process.env.NEXT_PUBLIC_APP_VERSION ??
      process.env.SENTRY_RELEASE ??
      process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: traceSampleRate(),
    sendDefaultPii: false,
    beforeSend: (event: ErrorEvent) => sanitizeSentryEvent(event),
  };
}

export function captureServerException(
  error: unknown,
  context: { actionName?: string; reference: string },
) {
  if (!process.env.SENTRY_DSN || process.env.NODE_ENV === "test") return null;
  try {
    return Sentry.captureException(error, {
      tags: { action: context.actionName ?? "unknown", support_reference: context.reference },
    });
  } catch {
    return null;
  }
}

export function setObservabilityUser(userId: string | null) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.NODE_ENV === "test") return;
  try {
    Sentry.setUser(userId ? { id: userId } : null);
  } catch {
    // Observability identity must never interrupt authentication or sign-out.
  }
}

export function captureHandledException(error: unknown, reference: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.NODE_ENV === "test") return null;
  try {
    return Sentry.captureException(error, {
      tags: { support_reference: reference, handled: "true" },
    });
  } catch {
    return null;
  }
}
