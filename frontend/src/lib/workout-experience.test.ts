import { describe, expect, it } from "vitest";
import { deriveWorkoutExperience } from "./workout-experience";

describe("deriveWorkoutExperience", () => {
  it("derives progress and summary metrics in one history traversal", () => {
    const result = deriveWorkoutExperience(
      [
        { sets: [{ weight: 225, reps: 5 }, { weight: 225, reps: 4 }] },
        { sets: [] },
        { sets: [{ weight: null, reps: 10 }] },
        { sets: [] },
      ],
      {
        startedAt: new Date("2026-07-21T10:00:00.000Z"),
        finishedAt: null,
        now: new Date("2026-07-21T10:42:00.000Z"),
        personalRecordCount: 2,
      },
    );

    expect(result).toEqual({
      completedExercises: 2,
      estimatedDuration: "~42m",
      personalRecordCount: 2,
      progressPercent: 50,
      totalExercises: 4,
      totalSets: 3,
      totalVolume: 2025,
    });
  });

  it("uses the finished timestamp for a stable completed summary", () => {
    const result = deriveWorkoutExperience([], {
      startedAt: new Date("2026-07-21T10:00:00.000Z"),
      finishedAt: new Date("2026-07-21T11:15:00.000Z"),
      now: new Date("2026-07-21T14:00:00.000Z"),
      personalRecordCount: 0,
    });

    expect(result.estimatedDuration).toBe("1h 15m");
    expect(result.progressPercent).toBe(0);
  });

  it("counts every tracked set but excludes non-weight modes from volume", () => {
    const result = deriveWorkoutExperience(
      [
        {
          exercise: { trackingType: "weight_reps" },
          sets: [{ weight: 100, reps: 5 }],
        },
        {
          exercise: { trackingType: "reps_only" },
          sets: [{ weight: 200, reps: 20 }],
        },
        {
          exercise: { trackingType: "time" },
          sets: [{ weight: 300, reps: 10 }],
        },
      ],
      {
        startedAt: null,
        finishedAt: null,
        personalRecordCount: 2,
      },
    );

    expect(result).toMatchObject({
      completedExercises: 3,
      totalSets: 3,
      totalVolume: 500,
    });
  });
});
