import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  findWorkouts: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.findUser },
    workout: { findMany: mocks.findWorkouts },
  },
}));

import { getDashboardData } from "@/lib/dashboard-data";

describe("getDashboardData", () => {
  beforeEach(() => {
    mocks.findUser.mockReset();
    mocks.findWorkouts.mockReset();
    mocks.findUser.mockResolvedValue({
      onboardingCompletedAt: new Date("2026-07-01T00:00:00.000Z"),
      profile: { primaryGoal: "Strength" },
      _count: { templates: 2 },
    });
    mocks.findWorkouts.mockResolvedValue([]);
  });

  it("consolidates dashboard persistence into two scoped reads", async () => {
    const result = await getDashboardData("user-1");

    expect(mocks.findUser).toHaveBeenCalledTimes(1);
    expect(mocks.findWorkouts).toHaveBeenCalledTimes(1);
    expect(mocks.findUser).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        onboardingCompletedAt: true,
        profile: true,
        _count: { select: { templates: true } },
      },
    });
    expect(mocks.findWorkouts).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        goal: true,
        date: true,
        status: true,
        startedAt: true,
        exercises: {
          select: {
            exerciseId: true,
            name: true,
            sets: { select: { weight: true, reps: true } },
          },
        },
      },
    });
    expect(result).toMatchObject({
      activeWorkout: null,
      personalRecords: [],
      profile: { primaryGoal: "Strength" },
      routineCount: 2,
    });
  });

  it("does not issue fallback queries for an empty account", async () => {
    const result = await getDashboardData("user-1");

    expect(result.analytics).toMatchObject({
      workoutCount: 0,
      totalSets: 0,
      totalVolume: 0,
      recentWorkouts: [],
    });
    expect(mocks.findUser).toHaveBeenCalledTimes(1);
    expect(mocks.findWorkouts).toHaveBeenCalledTimes(1);
  });
});
