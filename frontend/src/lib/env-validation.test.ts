import { describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "@/lib/env-validation";

const validEnvironment = {
  DATABASE_URL: "postgresql://example.invalid/app",
  AUTH_SECRET: "test-auth-secret",
  AUTH_GOOGLE_ID: "test-google-id",
  AUTH_GOOGLE_SECRET: "test-google-secret",
  AUTH_URL: "https://example.invalid",
};

describe("validateRuntimeEnv", () => {
  it("returns validated runtime configuration", () => {
    expect(validateRuntimeEnv(validEnvironment)).toEqual(validEnvironment);
  });

  it("accepts NEXTAUTH_URL as the application URL fallback", () => {
    expect(
      validateRuntimeEnv({
        ...validEnvironment,
        AUTH_URL: undefined,
        NEXTAUTH_URL: "https://preview.example.invalid",
      }).AUTH_URL
    ).toBe("https://preview.example.invalid");
  });

  it("identifies a missing required variable", () => {
    expect(() =>
      validateRuntimeEnv({
        ...validEnvironment,
        AUTH_GOOGLE_SECRET: undefined,
      })
    ).toThrow("AUTH_GOOGLE_SECRET");
  });

  it("identifies a malformed URL", () => {
    expect(() =>
      validateRuntimeEnv({
        ...validEnvironment,
        DATABASE_URL: "not-a-url",
      })
    ).toThrow("DATABASE_URL");
  });

  it("does not include configured values in validation errors", () => {
    const sensitiveSecret = "never-print-this-secret";
    const malformedUrl = "never-print-this-url";

    expect(() =>
      validateRuntimeEnv({
        ...validEnvironment,
        DATABASE_URL: malformedUrl,
        AUTH_SECRET: sensitiveSecret,
      })
    ).toThrowError(
      expect.objectContaining({
        message: expect.not.stringContaining(sensitiveSecret),
      })
    );

    try {
      validateRuntimeEnv({
        ...validEnvironment,
        DATABASE_URL: malformedUrl,
        AUTH_SECRET: sensitiveSecret,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(malformedUrl);
    }
  });
});
