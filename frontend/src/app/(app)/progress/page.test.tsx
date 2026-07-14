import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAnalytics: vi.fn(),
  getPersonalRecords: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/lib/dashboard-analytics", () => ({
  getDashboardAnalytics: mocks.getAnalytics,
}));

vi.mock("@/lib/personal-records", () => ({
  getTopExercisePersonalRecords: mocks.getPersonalRecords,
}));

import ProgressPage from "./page";

const longExerciseName =
  "Single-arm cable-supported rear-delt row with an intentionally long movement name";
const longWorkoutTitle =
  "Upper-body strength and controlled hypertrophy with a deliberately long workout title";

const topRecord = {
  exerciseName: longExerciseName,
  workoutId: "source-workout",
  workoutTitle: longWorkoutTitle,
  workoutDate: new Date("2026-07-12T12:00:00.000Z"),
  weight: 12345,
  reps: 8,
  estimatedOneRepMax: 123456789,
};

const populatedAnalytics = {
  workoutCount: 123456,
  workoutsThisWeek: 4,
  totalSets: 9876543,
  totalVolume: 9876543210,
  currentStreak: 6,
  recentWorkouts: [
    {
      id: "recent-workout",
      title: longWorkoutTitle,
      goal: "Strength",
      date: new Date("2026-07-12T12:00:00.000Z"),
      exercises: [],
    },
  ],
};

beforeEach(() => {
  mocks.getAnalytics.mockResolvedValue(populatedAnalytics);
  mocks.getPersonalRecords.mockResolvedValue([topRecord]);
});

describe("ProgressPage", () => {
  it("renders the mobile-first Progress hierarchy in order", async () => {
    render(await ProgressPage());

    const weekly = screen
      .getByRole("heading", { name: "Weekly momentum" })
      .closest("section")!;
    const lifetime = screen
      .getByRole("heading", { name: "Lifetime summary" })
      .closest("section")!;
    const topLift = screen
      .getByRole("heading", { name: "Top lift" })
      .closest("section")!;
    const personalRecords = screen
      .getByRole("heading", { name: "Personal records" })
      .closest("div")!;
    const recentTraining = screen
      .getByRole("heading", { name: "Recent training" })
      .closest("div")!;

    expect(
      weekly.compareDocumentPosition(lifetime) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      lifetime.compareDocumentPosition(topLift) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      topLift.compareDocumentPosition(personalRecords) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      personalRecords.compareDocumentPosition(recentTraining) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    expect(within(weekly).getByText("4")).toBeVisible();
    expect(within(weekly).getByText("Workouts this week")).toBeVisible();
    expect(within(weekly).getByText("6")).toBeVisible();
    expect(within(weekly).getByText("Training streak")).toBeVisible();
  });

  it("keeps large lifetime values and the complete top-lift achievement accessible", async () => {
    render(await ProgressPage());

    const lifetime = screen
      .getByRole("heading", { name: "Lifetime summary" })
      .closest("section")!;
    expect(within(lifetime).getByText("123456")).toBeVisible();
    expect(within(lifetime).getByText("9,876,543")).toBeVisible();
    expect(within(lifetime).getByText("9,876,543,210 lb")).toHaveClass(
      "[overflow-wrap:anywhere]"
    );

    const topLift = screen
      .getByRole("heading", { name: "Top lift" })
      .closest("section")!;
    expect(
      within(topLift).getByRole("heading", { level: 3, name: longExerciseName })
    ).toHaveClass("line-clamp-2");
    expect(within(topLift).getByText("12,345 lb × 8 reps")).toBeVisible();
    expect(
      within(topLift).getByText("Estimated 1RM 123,456,789 lb")
    ).toBeVisible();
    expect(within(topLift).getByRole("link")).toHaveAttribute(
      "href",
      "/workouts/source-workout"
    );

    expect(screen.getByText(longWorkoutTitle)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View full history" })
    ).toHaveAttribute("href", "/workouts");
    expect(
      screen.getByRole("link", { name: new RegExp(longWorkoutTitle) })
    ).toHaveAttribute("href", "/workouts/recent-workout");
  });

  it("shows one coherent empty state when no workouts exist", async () => {
    mocks.getAnalytics.mockResolvedValue({
      workoutCount: 0,
      workoutsThisWeek: 0,
      totalSets: 0,
      totalVolume: 0,
      currentStreak: 0,
      recentWorkouts: [],
    });
    mocks.getPersonalRecords.mockResolvedValue([]);

    render(await ProgressPage());

    expect(
      screen.getByRole("heading", { name: "No training history yet" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Log first workout" })
    ).toHaveAttribute("href", "/workouts/new");
    expect(
      screen.queryByRole("heading", { name: "Personal records" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Recent training" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No workouts yet")).not.toBeInTheDocument();
  });

  it("keeps no-PR guidance distinct when workout history exists", async () => {
    mocks.getPersonalRecords.mockResolvedValue([]);

    render(await ProgressPage());

    expect(
      screen.queryByRole("heading", { name: "Top lift" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("No personal records yet")).toBeVisible();
    expect(screen.getByText(longWorkoutTitle)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Log a workout" })
    ).toHaveAttribute("href", "/workouts/new");
  });
});
