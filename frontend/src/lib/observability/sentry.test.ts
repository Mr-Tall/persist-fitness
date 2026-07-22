import { afterEach, describe, expect, it, vi } from "vitest";
import { sentryOptions } from "./sentry";

describe("Sentry optional configuration", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps each runtime disabled without its DSN", () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect(sentryOptions("client").enabled).toBe(false);
    expect(sentryOptions("server").enabled).toBe(false);
    expect(sentryOptions("edge").enabled).toBe(false);
  });
  it("never opts into default PII", () => {
    expect(sentryOptions("server").sendDefaultPii).toBe(false);
  });
  it("bounds invalid or excessive trace sampling configuration", () => {
    vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "4");
    expect(sentryOptions("server").tracesSampleRate).toBe(1);
    vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "invalid");
    expect(sentryOptions("server").tracesSampleRate).toBe(0.05);
  });
});
