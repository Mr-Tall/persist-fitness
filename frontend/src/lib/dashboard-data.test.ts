import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveProgram: vi.fn(),
  findUser: vi.fn(),
  findWorkouts: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.findUser },
    workout: { findMany: mocks.findWorkouts },
    programEnrollment: { findFirst: mocks.findActiveProgram },
  },
}));

import { getDashboardData } from "@/lib/dashboard-data";

describe("getDashboardData", () => {
  beforeEach(() => {
    mocks.findUser.mockReset();
    mocks.findWorkouts.mockReset();
    mocks.findActiveProgram.mockReset();
    mocks.findUser.mockResolvedValue({
      onboardingCompletedAt: new Date("2026-07-01T00:00:00.000Z"),
      profile: { primaryGoal: "Strength" },
      _count: { templates: 2 },
    });
    mocks.findWorkouts.mockResolvedValue([]);
    mocks.findActiveProgram.mockResolvedValue(null);
  });

  it("consolidates dashboard persistence into three parallel scoped reads", async () => {
    const result = await getDashboardData("user-1");

    expect(mocks.findUser).toHaveBeenCalledTimes(1);
    expect(mocks.findWorkouts).toHaveBeenCalledTimes(1);
    expect(mocks.findActiveProgram).toHaveBeenCalledTimes(1);
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
        finishedAt: true,
        rpe: true,
        exercises: {
          select: {
            exerciseId: true,
            name: true,
            exercise: {
              select: { primaryMuscles: true, trackingType: true },
            },
            sets: { select: { weight: true, reps: true } },
          },
        },
      },
    });
    expect(mocks.findActiveProgram).toHaveBeenCalledWith({
      where: { userId: "user-1", status: "active" },
      select: {
        id: true,
        startDate: true,
        currentWeek: true,
        currentDay: true,
        status: true,
        program: {
          select: {
            id: true,
            name: true,
            weeks: {
              orderBy: { weekNumber: "asc" },
              select: {
                weekNumber: true,
                days: {
                  orderBy: { dayNumber: "asc" },
                  select: {
                    id: true,
                    dayNumber: true,
                    routine: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(result).toMatchObject({
      activeWorkout: null,
      currentProgram: null,
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
    expect(mocks.findActiveProgram).toHaveBeenCalledTimes(1);
  });

  it("prepares active program progress and the next referenced routine", async () => {
    mocks.findActiveProgram.mockResolvedValue({
      id: "enrollment-1",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      currentWeek: 1,
      currentDay: 2,
      status: "active",
      program: {
        id: "program-1",
        name: "Foundational Strength",
        weeks: [
          {
            weekNumber: 1,
            days: [
              { id: "day-1", dayNumber: 1, routine: { id: "routine-1", title: "A" } },
              { id: "day-2", dayNumber: 2, routine: { id: "routine-2", title: "B" } },
            ],
          },
        ],
      },
    });

    const result = await getDashboardData("user-1");

    expect(result.currentProgram).toEqual({
      enrollmentId: "enrollment-1",
      id: "program-1",
      name: "Foundational Strength",
      currentWeek: 1,
      currentDay: 2,
      completionPercent: 50,
      nextWorkout: { id: "routine-2", title: "B" },
    });
  });
});
