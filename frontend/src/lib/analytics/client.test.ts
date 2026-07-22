import { describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({ init: vi.fn(), identify: vi.fn(), capture: vi.fn(), reset: vi.fn() }));
vi.mock("posthog-js", () => ({ default: posthog }));
import { captureProductEvent, initializeProductAnalytics, isProductAnalyticsEnabled, resetAnalyticsIdentity } from "./client";

describe("product analytics disabled behavior", () => {
  it("is a no-op without public configuration and during tests", () => {
    expect(isProductAnalyticsEnabled()).toBe(false);
    expect(initializeProductAnalytics()).toBe(false);
    captureProductEvent("feedback_submitted", { category: "bug", screenshot_attached: false });
    resetAnalyticsIdentity();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(posthog.reset).not.toHaveBeenCalled();
  });
});
