import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { productEventNames } from "./events";

describe("product analytics allowlist", () => {
  it("contains only reviewed product events", () => {
    expect(productEventNames).toContain("workout_completed");
    expect(productEventNames).toContain("offline_sync_conflict");
    expect(productEventNames).toContain("feedback_submitted");
    expect(new Set(productEventNames).size).toBe(productEventNames.length);
  });

  it("centralizes direct PostHog usage", () => {
    const files = [
      "src/app/(app)/dashboard/first-time-onboarding.tsx",
      "src/app/(app)/workouts/[workoutId]/workout-experience-provider.tsx",
      "src/components/feedback/feedback-dialog.tsx",
    ];
    for (const file of files) {
      expect(readFileSync(resolve(process.cwd(), file), "utf8")).not.toMatch(/posthog\./i);
    }
  });

  it("keeps replay conservative and independently configurable", () => {
    const source = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    expect(source).toContain("autocapture: false");
    expect(source).toContain("maskAllInputs: true");
    expect(source).toContain("NEXT_PUBLIC_POSTHOG_REPLAY_ENABLED");
    expect(source).toContain("data-screenshot-preview");
  });
});
