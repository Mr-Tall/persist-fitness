import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findWorkouts: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    workout: { findMany: mocks.findWorkouts },
  },
}));

import { getProgressData } from "@/lib/progress-data";

describe("getProgressData", () => {
  beforeEach(() => {
    mocks.findWorkouts.mockReset();
    mocks.findWorkouts.mockResolvedValue([]);
  });

  it("loads history and exercise metadata with one user-scoped query", async () => {
    const result = await getProgressData("user-1");

    expect(mocks.findWorkouts).toHaveBeenCalledTimes(1);
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
            exercise: {
              select: { primaryMuscles: true, trackingType: true },
            },
            sets: { select: { weight: true, reps: true } },
          },
        },
      },
    });
    expect(result).toMatchObject({
      analytics: { workoutCount: 0 },
      personalRecords: [],
      insights: {
        biggestImprovements: [],
        muscleDistribution: [],
        personalRecordCount: 0,
        recentPersonalRecords: [],
      },
    });
  });
});
