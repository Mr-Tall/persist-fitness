import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProgressData: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/lib/progress-data", () => ({
  getProgressData: mocks.getProgressData,
}));

import ProgressPage from "./page";

const topRecord = {
  exerciseName: "Deadlift",
  workoutId: "workout-2",
  workoutTitle: "Pull strength",
  workoutDate: new Date("2026-07-12T12:00:00.000Z"),
  weight: 405,
  reps: 3,
  estimatedOneRepMax: 445.5,
};

function createProgressData() {
  return {
    analytics: {
      workoutCount: 12,
      workoutsThisWeek: 3,
      totalSets: 96,
      totalVolume: 125_000,
      currentStreak: 4,
      recentWorkouts: [
        {
          id: "workout-2",
          title: "Pull strength",
          goal: "Strength",
          date: new Date("2026-07-12T12:00:00.000Z"),
          exercises: [],
        },
      ],
    },
    personalRecords: [
      topRecord,
      {
        ...topRecord,
        exerciseName: "Bench Press",
        workoutId: "workout-1",
        weight: 225,
        reps: 8,
        estimatedOneRepMax: 285,
      },
    ],
    insights: {
      personalRecordCount: 2,
      weeklyVolume: {
        currentVolume: 24_000,
        previousVolume: 20_000,
        changePercent: 20,
        direction: "positive" as const,
      },
      monthlyVolume: {
        currentVolume: 80_000,
        previousVolume: 100_000,
        changePercent: -20,
        direction: "negative" as const,
      },
      recentPersonalRecords: [
        { ...topRecord, prType: "Estimated 1RM" as const },
      ],
      muscleDistribution: [
        { muscle: "hamstrings", percentage: 60, volume: 30_000 },
        { muscle: "glutes", percentage: 40, volume: 20_000 },
      ],
      biggestImprovements: [
        {
          exerciseName: "Bench Press",
          changePercent: 12.5,
          currentEstimatedOneRepMax: 285,
          previousEstimatedOneRepMax: 253.3,
          workoutId: "workout-1",
        },
      ],
    },
  };
}

beforeEach(() => {
  mocks.getProgressData.mockReset();
  mocks.getProgressData.mockResolvedValue(createProgressData());
});

describe("ProgressPage analytics dashboard", () => {
  it("renders the overview and trend indicators", async () => {
    render(await ProgressPage());

    const overview = screen.getByRole("heading", { name: "Overview" }).closest("section")!;
    expect(within(overview).getByText("Total workouts")).toBeVisible();
    expect(within(overview).getByText("12")).toBeVisible();
    expect(within(overview).getByText("Current streak")).toBeVisible();
    expect(within(overview).getByText("4 days")).toBeVisible();
    expect(within(overview).getByText("125,000 lb")).toBeVisible();
    expect(within(overview).getByText("2", { selector: "p" })).toBeVisible();

    const trends = screen
      .getByRole("heading", { name: "Performance trends" })
      .closest("section")!;
    expect(within(trends).getByText("Up 20%")).toHaveClass("text-success");
    expect(within(trends).getByText("Down 20%")).toHaveClass("text-warning");
  });

  it("renders ranked top lifts and a recent PR timeline", async () => {
    render(await ProgressPage());

    const topLifts = screen.getByRole("region", { name: "Top lifts" });
    const liftItems = within(topLifts).getAllByRole("listitem");
    expect(within(liftItems[0]).getByText("Deadlift")).toBeVisible();
    expect(within(liftItems[1]).getByText("Bench Press")).toBeVisible();

    const timeline = screen.getByRole("region", {
      name: "Recent personal records",
    });
    expect(within(timeline).getByText("Deadlift")).toBeVisible();
    expect(within(timeline).getByText("Estimated 1RM")).toBeVisible();
    expect(within(timeline).getByRole("link", { name: "7/12/2026" })).toHaveAttribute(
      "href",
      "/workouts/workout-2",
    );
  });

  it("renders muscle distribution and biggest improvements", async () => {
    render(await ProgressPage());

    expect(screen.getByRole("progressbar", { name: "hamstrings: 60%" })).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
    const improvements = screen
      .getByRole("heading", { name: "Biggest improvements" })
      .closest("section")!;
    expect(within(improvements).getByText("Bench Press")).toBeVisible();
    expect(within(improvements).getByText("+13%")).toHaveClass("text-success");
  });

  it("shows one informational empty state when no workouts exist", async () => {
    const data = createProgressData();
    mocks.getProgressData.mockResolvedValue({
      ...data,
      analytics: {
        ...data.analytics,
        workoutCount: 0,
        workoutsThisWeek: 0,
        totalSets: 0,
        totalVolume: 0,
        currentStreak: 0,
        recentWorkouts: [],
      },
      personalRecords: [],
      insights: {
        ...data.insights,
        personalRecordCount: 0,
      },
    });

    render(await ProgressPage());

    const emptyTitle = screen.getByRole("heading", {
      name: "Complete a few workouts to unlock your analytics",
    });
    expect(emptyTitle.closest("section")).toHaveClass("bg-info-soft");
    expect(screen.getByRole("link", { name: "Log first workout" })).toHaveAttribute(
      "href",
      "/workouts/new",
    );
    expect(screen.queryByRole("heading", { name: "Performance trends" })).not.toBeInTheDocument();
  });

  it("keeps insufficient-data guidance distinct from the no-workout state", async () => {
    const data = createProgressData();
    mocks.getProgressData.mockResolvedValue({
      ...data,
      personalRecords: [],
      insights: {
        ...data.insights,
        personalRecordCount: 0,
        recentPersonalRecords: [],
        muscleDistribution: [],
        biggestImprovements: [],
      },
    });

    render(await ProgressPage());

    expect(screen.getByText("No weighted lifts yet")).toBeVisible();
    expect(screen.getByText(/unlock your record timeline/i)).toHaveClass("text-info");
    expect(screen.getByText(/reveal your muscle distribution/i)).toHaveClass("text-info");
    expect(screen.getByText(/recent improvements can be compared/i)).toHaveClass("text-info");
  });
});
