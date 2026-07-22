import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findExercises: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { exercise: { findMany: mocks.findExercises } },
}));

import {
  getExerciseLibraryData,
  prepareExerciseLibrary,
  type ExerciseLibrarySource,
} from "./exercise-library-data";

function source(
  overrides: Partial<ExerciseLibrarySource> & Pick<ExerciseLibrarySource, "id" | "name">,
): ExerciseLibrarySource {
  const { id, name, ...rest } = overrides;
  return {
    aliases: [],
    category: "strength",
    equipment: "barbell",
    exerciseType: "strength",
    force: "push",
    id,
    images: [],
    instructions: [],
    laterality: "bilateral",
    level: "intermediate",
    mechanic: "compound",
    movementPattern: "push",
    name,
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps"],
    thumbnailUrl: null,
    tips: [],
    trackingType: "weight_reps",
    favoritedBy: [],
    workoutExercises: [],
    ...rest,
  };
}

describe("exercise library data", () => {
  it("derives reps-only records and performance without weighted analytics", () => {
    const [pushup] = prepareExerciseLibrary([
      source({
        id: "pushup",
        name: "Push-ups",
        trackingType: "reps_only",
        workoutExercises: [
          {
            workout: {
              id: "workout-1",
              title: "Bodyweight",
              date: new Date("2026-07-21T12:00:00.000Z"),
            },
            sets: [
              { setNumber: 1, weight: null, reps: 20, rir: 1 },
              { setNumber: 2, weight: null, reps: 15, rir: 2 },
            ],
          },
        ],
      }),
    ]);

    expect(pushup.personalRecord).toMatchObject({ label: "20 reps" });
    expect(pushup.personalRecord).not.toHaveProperty("estimatedOneRepMax");
    expect(pushup.lastPerformance).toBe("15 reps · RIR 2");
  });

  beforeEach(() => {
    mocks.findExercises.mockReset();
    mocks.findExercises.mockResolvedValue([]);
  });

  it("loads metadata, favorites, and owned history with one Prisma request", async () => {
    await getExerciseLibraryData("user-1");

    expect(mocks.findExercises).toHaveBeenCalledTimes(1);
    expect(mocks.findExercises).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        select: expect.objectContaining({
          favoritedBy: {
            where: { userId: "user-1" },
            select: { id: true },
          },
          workoutExercises: expect.objectContaining({
            where: { workout: { userId: "user-1" } },
          }),
        }),
      }),
    );
  });

  it("derives recency, last performance, weighted PRs, and related exercises", () => {
    const data = prepareExerciseLibrary([
      source({
        id: "bench",
        name: "Bench Press",
        favoritedBy: [{ id: "favorite-1" }],
        workoutExercises: [
          {
            workout: {
              id: "workout-old",
              title: "Old push day",
              date: new Date("2026-07-01T12:00:00.000Z"),
            },
            sets: [{ setNumber: 1, weight: 225, reps: 5, rir: 2 }],
          },
          {
            workout: {
              id: "workout-new",
              title: "Recent push day",
              date: new Date("2026-07-20T12:00:00.000Z"),
            },
            sets: [
              { setNumber: 1, weight: 0, reps: 10, rir: 3 },
              { setNumber: 2, weight: 205, reps: 8, rir: 1 },
            ],
          },
        ],
      }),
      source({ id: "incline", name: "Incline Bench Press" }),
      source({
        id: "squat",
        name: "Back Squat",
        primaryMuscles: ["quadriceps"],
        movementPattern: "squat",
      }),
    ]);

    const bench = data.find((exercise) => exercise.id === "bench")!;
    const incline = data.find((exercise) => exercise.id === "incline")!;
    expect(bench.isFavorite).toBe(true);
    expect(bench.isRecentlyUsed).toBe(true);
    expect(bench.lastPerformed).toMatchObject({
      workoutHref: "/workouts/workout-new",
      workoutTitle: "Recent push day",
    });
    expect(bench.lastPerformance).toBe("205 lb · 8 reps · RIR 1");
    expect(bench.personalRecord).toMatchObject({
      label: "225 lb × 5",
      workoutHref: "/workouts/workout-old",
    });
    expect(bench.relatedExercises[0]).toEqual({
      id: "incline",
      name: "Incline Bench Press",
    });
    expect(incline.isRecommended).toBe(true);
  });
});
