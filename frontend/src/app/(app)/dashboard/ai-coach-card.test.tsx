import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CoachReport } from "@/lib/ai-coach";
import { AiCoachCard } from "./ai-coach-card";

const report: CoachReport = {
  generatedAt: new Date("2026-07-22T12:00:00.000Z"),
  insights: [],
  recommendations: [],
  topInsight: {
    id: "plateau-bench",
    type: "plateau",
    category: "strength",
    priority: "medium",
    direction: "neutral",
    confidence: 0.82,
    metrics: [{ key: "observations", value: 6, unit: "count" }],
    subject: { id: "bench", name: "Bench Press" },
  },
  topRecommendation: {
    id: "recommendation-plateau-bench",
    title: "Review the stalled lift",
    priority: "medium",
    category: "strength",
    supportingMetrics: [{ key: "observations", value: 6, unit: "count" }],
    confidence: 0.82,
    suggestedAction: { type: "review_training_load", target: "Bench Press" },
    sourceInsightType: "plateau",
  },
};

describe("AiCoachCard", () => {
  it("renders the top structured insight, recommendation, confidence, and destination", () => {
    render(<AiCoachCard headingId="coach-title" report={report} />);
    const region = screen.getByRole("region", { name: "Training intelligence" });

    expect(within(region).getByText("A lift may be plateauing")).toBeVisible();
    expect(within(region).getByText("Bench Press")).toBeVisible();
    expect(within(region).getByText("Review the stalled lift")).toBeVisible();
    expect(within(region).getByText("82% confidence")).toBeVisible();
    expect(
      within(region).getByRole("link", { name: "View more coaching insights" }),
    ).toHaveAttribute("href", "/progress");
  });
});
