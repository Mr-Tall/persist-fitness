import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findProfile: vi.fn(),
  getAnalytics: vi.fn(),
  getPersonalRecords: vi.fn(),
  countRoutines: vi.fn(),
  findActiveWorkout: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: { findUnique: mocks.findProfile },
    workoutTemplate: { count: mocks.countRoutines },
    workout: { findFirst: mocks.findActiveWorkout },
  },
}));

vi.mock("@/lib/dashboard-analytics", () => ({
  getDashboardAnalytics: mocks.getAnalytics,
}));

vi.mock("@/lib/personal-records", () => ({
  getTopExercisePersonalRecords: mocks.getPersonalRecords,
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", name: "Taylor" },
  }),
}));

vi.mock("@/app/actions/workouts", () => ({
  startTodaysWorkout: vi.fn(),
}));

vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button type="button">Sign out</button>,
}));

import DashboardPage from "./page";

const completeProfile = {
  primaryGoal: "Get stronger",
  experience: "Intermediate",
  availableDays: 4,
  equipment: ["Barbell"],
  preferredSplit: null,
};

beforeEach(() => {
  mocks.findProfile.mockResolvedValue({
    ...completeProfile,
    equipment: [],
  });
  mocks.countRoutines.mockResolvedValue(0);
  mocks.findActiveWorkout.mockResolvedValue({
    id: "active-workout",
    title: "Active strength session",
    startedAt: new Date("2026-07-13T18:00:00.000Z"),
    date: new Date("2026-07-13T18:00:00.000Z"),
    exercises: [],
  });
  mocks.getPersonalRecords.mockResolvedValue([]);
  mocks.getAnalytics.mockResolvedValue({
    workoutCount: 1,
    workoutsThisWeek: 1,
    totalSets: 3,
    totalVolume: 1200,
    currentStreak: 1,
    recentWorkouts: [
      {
        id: "recent-workout",
        title: "Recent session",
        goal: "Strength",
        date: new Date("2026-07-12T18:00:00.000Z"),
        exercises: [],
      },
    ],
  });
});

describe("DashboardPage mobile profile nudge", () => {
  it("keeps the nudge below core Today content during an active workout", async () => {
    render(await DashboardPage());

    const weekly = screen
      .getByRole("heading", { name: "Weekly momentum" })
      .closest("section");
    const latest = screen
      .getByRole("heading", { name: "Latest workout" })
      .closest("section");
    const nudge = screen.getByRole("region", {
      name: "Finish your training setup",
    });

    expect(weekly).not.toBeNull();
    expect(latest).not.toBeNull();
    const viewAll = within(latest!).getByRole("link", { name: "View all" });
    expect(viewAll).toHaveAttribute("href", "/workouts");
    expect(viewAll).toHaveClass("min-h-11", "focus-visible:ring-2");
    expect(
      weekly!.compareDocumentPosition(nudge) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      latest!.compareDocumentPosition(nudge) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: "Resume workout" }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Finish setup" })
    ).toHaveAttribute("href", "/settings");
  });

  it("hides the mobile nudge for a complete profile without changing desktop setup content", async () => {
    mocks.findProfile.mockResolvedValue(completeProfile);

    render(await DashboardPage());

    expect(
      screen.queryByRole("region", { name: "Finish your training setup" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Training setup" })
    ).toBeVisible();
  });
});
