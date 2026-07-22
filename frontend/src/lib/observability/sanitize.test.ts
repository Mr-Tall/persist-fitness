import { describe, expect, it } from "vitest";
import { sanitizeObservabilityValue, sanitizeSentryEvent } from "./sanitize";

describe("observability sanitization", () => {
  it("removes fitness values, credentials, emails, and connection strings", () => {
    expect(sanitizeObservabilityValue({
      email: "person@example.com", authorization: "Bearer secret", workoutNotes: "private",
      weight: 225, nested: { url: "postgresql://user:pass@host/db", label: "person@example.com" },
    })).toEqual({
      email: "[Redacted]", authorization: "[Redacted]", workoutNotes: "[Redacted]",
      weight: "[Redacted]", nested: { url: "[Redacted connection]", label: "[Redacted email]" },
    });
  });

  it("drops request headers, cookies, and bodies", () => {
    const event = sanitizeSentryEvent({ request: { headers: { cookie: "secret" }, cookies: "secret", data: { set: 1 }, url: "/workouts" } });
    expect(event.request).toEqual({ url: "/workouts" });
  });

  it("removes query strings and dynamic resource IDs from request URLs", () => {
    const event = sanitizeSentryEvent({ request: { url: "/workouts/private-workout?notes=secret" } });
    expect(event.request).toEqual({ url: "/workouts/:id" });
  });
});
