import { describe, expect, it } from "vitest";

import {
  summarizeWorkoutHistory,
  type WorkoutHistoryItem,
} from "@/lib/workout-history-summary";

const now = new Date("2026-07-15T12:00:00.000Z");

function workout(
  id: string,
  date: string,
  options: Partial<WorkoutHistoryItem> = {},
): WorkoutHistoryItem {
  return {
    date: new Date(date),
    exercises: [],
    goal: null,
    id,
    startedAt: new Date(date),
    status: "completed",
    title: `Workout ${id}`,
    ...options,
  };
}

describe("summarizeWorkoutHistory", () => {
  it("returns the established empty-account metrics", () => {
    const result = summarizeWorkoutHistory([], { now });

    expect(result.analytics).toEqual({
      currentStreak: 0,
      recentWorkouts: [],
      totalSets: 0,
      totalVolume: 0,
      workoutCount: 0,
      workoutsThisWeek: 0,
    });
    expect(result.personalRecords).toEqual([]);
    expect(result.activeWorkout).toBeNull();
  });

  it("preserves first-workout metrics, streak, volume, and record output", () => {
    const firstWorkout = workout("first", "2026-07-14T18:00:00.000Z", {
      exercises: [
        {
          exerciseId: "bench",
          name: "Bench Press",
          sets: [
            { reps: 5, weight: 200 },
            { reps: null, weight: null },
          ],
        },
      ],
    });

    const result = summarizeWorkoutHistory([firstWorkout], { now });

    expect(result.analytics).toMatchObject({
      currentStreak: 1,
      totalSets: 2,
      totalVolume: 1000,
      workoutCount: 1,
      workoutsThisWeek: 1,
    });
    expect(result.personalRecords).toEqual([
      expect.objectContaining({
        exerciseName: "Bench Press",
        reps: 5,
        weight: 200,
        workoutId: "first",
      }),
    ]);
  });

  it("preserves recent ordering, contiguous streaks, and strongest records", () => {
    const workouts = [
      workout("today", "2026-07-15T08:00:00.000Z", {
        exercises: [
          {
            exerciseId: "bench",
            name: "Bench Press",
            sets: [{ reps: 5, weight: 225 }],
          },
        ],
      }),
      workout("yesterday", "2026-07-14T08:00:00.000Z", {
        exercises: [
          {
            exerciseId: "bench",
            name: "Bench Press",
            sets: [{ reps: 8, weight: 200 }],
          },
          {
            exerciseId: "deadlift",
            name: "Deadlift",
            sets: [{ reps: 3, weight: 405 }],
          },
        ],
      }),
      workout("two-days", "2026-07-13T08:00:00.000Z"),
      workout("older", "2026-07-01T08:00:00.000Z"),
    ];

    const result = summarizeWorkoutHistory(workouts, {
      now,
      personalRecordLimit: 2,
    });

    expect(result.analytics.currentStreak).toBe(3);
    expect(result.analytics.recentWorkouts.map(({ id }) => id)).toEqual([
      "today",
      "yesterday",
      "two-days",
    ]);
    expect(result.personalRecords.map(({ exerciseName }) => exerciseName)).toEqual([
      "Deadlift",
      "Bench Press",
    ]);
  });

  it("selects the newest active workout and derives its metrics in the same pass", () => {
    const olderActive = workout("older-active", "2026-07-14T09:00:00.000Z", {
      status: "active",
      exercises: [
        {
          exerciseId: "squat",
          name: "Squat",
          sets: [{ reps: 5, weight: 300 }],
        },
      ],
    });
    const newerActive = workout("newer-active", "2026-07-13T09:00:00.000Z", {
      status: "active",
      startedAt: new Date("2026-07-15T10:00:00.000Z"),
      exercises: [
        {
          exerciseId: "row",
          name: "Row",
          sets: [
            { reps: 10, weight: 100 },
            { reps: 8, weight: 110 },
          ],
        },
      ],
    });

    const result = summarizeWorkoutHistory([olderActive, newerActive], { now });

    expect(result.activeWorkout?.id).toBe("newer-active");
    expect(result.activeWorkoutSetCount).toBe(2);
    expect(result.activeWorkoutVolume).toBe(1880);
  });

  it("handles a large workout history without changing totals or limits", () => {
    const workouts = Array.from({ length: 1_000 }, (_, index) =>
      workout(
        `workout-${index}`,
        new Date(Date.UTC(2026, 6, 15 - index)).toISOString(),
        {
          exercises: [
            {
              exerciseId: `exercise-${index}`,
              name: `Exercise ${index}`,
              sets: [{ reps: 10, weight: 100 }],
            },
          ],
        },
      ),
    );

    const result = summarizeWorkoutHistory(workouts, {
      now,
      personalRecordLimit: 5,
    });

    expect(result.analytics.workoutCount).toBe(1_000);
    expect(result.analytics.totalSets).toBe(1_000);
    expect(result.analytics.totalVolume).toBe(1_000_000);
    expect(result.analytics.recentWorkouts).toHaveLength(3);
    expect(result.personalRecords).toHaveLength(5);
  });
});
