import { describe, expect, it } from "vitest";
import { feedbackCategories, feedbackStatuses, normalizeFeedbackRoute, normalizePlatform, normalizeUserAgentSummary } from "./metadata";

describe("safe feedback metadata", () => {
  it("keeps category and status values bounded", () => {
    expect(feedbackCategories).toEqual(["bug", "feature_request", "general"]);
    expect(feedbackStatuses).toEqual(["new", "reviewing", "planned", "resolved", "dismissed"]);
  });
  it("normalizes user agents without storing the raw string", () => {
    const userAgent = "Mozilla/5.0 (iPhone) AppleWebKit Safari/605.1";
    expect(normalizePlatform(userAgent)).toBe("ios");
    expect(normalizeUserAgentSummary(userAgent)).toBe("safari-mobile");
    expect(normalizeUserAgentSummary(userAgent)).not.toContain("Mozilla");
  });
  it("removes resource identifiers from feedback routes", () => {
    expect(normalizeFeedbackRoute("/workouts/workout-secret?set=private"))
      .toBe("/workouts/:id");
    expect(normalizeFeedbackRoute("/routines/new")).toBe("/routines/new");
    expect(normalizeFeedbackRoute("/settings")).toBe("/settings");
  });
});
