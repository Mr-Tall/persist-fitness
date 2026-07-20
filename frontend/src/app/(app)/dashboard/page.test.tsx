import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDashboardData: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("@/lib/dashboard-data", () => ({
  getDashboardData: mocks.getDashboardData,
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", name: "Taylor" },
  }),
}));

vi.mock("@/app/actions/workouts", () => ({
  startTodaysWorkout: vi.fn(),
}));

vi.mock("@/app/actions/onboarding", () => ({
  completeOnboarding: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
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

const defaultDashboardData = {
  activeWorkout: {
    id: "active-workout",
    title: "Active strength session",
    goal: null,
    status: "active",
    startedAt: new Date("2026-07-13T18:00:00.000Z"),
    date: new Date("2026-07-13T18:00:00.000Z"),
    exercises: [],
  },
  activeWorkoutSetCount: 0,
  activeWorkoutVolume: 0,
  analytics: {
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
        status: "completed",
        startedAt: new Date("2026-07-12T18:00:00.000Z"),
        date: new Date("2026-07-12T18:00:00.000Z"),
        exercises: [],
      },
    ],
  },
  onboardingCompletedAt: new Date("2026-07-19T00:00:00.000Z"),
  personalRecords: [],
  profile: {
    ...completeProfile,
    equipment: [],
  },
  routineCount: 0,
};

beforeEach(() => {
  mocks.getDashboardData.mockReset();
  mocks.getDashboardData.mockResolvedValue(defaultDashboardData);
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
    mocks.getDashboardData.mockResolvedValue({
      ...defaultDashboardData,
      profile: completeProfile,
    });

    render(await DashboardPage());

    expect(
      screen.queryByRole("region", { name: "Finish your training setup" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Training setup" })
    ).toBeVisible();
  });
});

describe("DashboardPage first-time onboarding", () => {
  it("shows onboarding when the persisted completion timestamp is null", async () => {
    mocks.getDashboardData.mockResolvedValue({
      ...defaultDashboardData,
      onboardingCompletedAt: null,
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("dialog", { name: "Make every workout count." }),
    ).toBeInTheDocument();
  });

  it("does not show onboarding for a returning user", async () => {
    render(await DashboardPage());

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
