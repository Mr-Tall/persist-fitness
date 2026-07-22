import { describe, expect, it, vi } from "vitest";
import { createCorrelationReference, normalizeErrorReference } from "./reference";

describe("support references", () => {
  it("normalizes framework digests without exposing arbitrary text", () => {
    expect(normalizeErrorReference("abc-123<script>")).toBe("ABC-123SCRIPT");
  });
  it("creates short correlation references", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "12345678-aaaa-bbbb-cccc-123456789012" });
    expect(createCorrelationReference()).toBe("12345678AAAA");
  });
});
