import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    workout: {
      findMany: mocks.findMany,
    },
  },
}));

import { getTopExercisePersonalRecords } from "@/lib/personal-records";

type SetInput = {
  weight: number | null;
  reps: number | null;
};

function workoutWithExercises(
  exercises: Array<{
    exerciseId: string | null;
    name: string;
    sets: SetInput[];
  }>,
  options: {
    id?: string;
    title?: string;
    date?: Date;
  } = {},
) {
  return {
    id: options.id ?? "workout-1",
    title: options.title ?? "Strength day",
    date: options.date ?? new Date("2026-07-13T12:00:00.000Z"),
    exercises,
  };
}

describe("getTopExercisePersonalRecords", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
  });

  it.each([
    ["zero weight", 0],
    ["null weight", null],
    ["negative legacy weight", -25],
    ["NaN weight", Number.NaN],
    ["infinite weight", Number.POSITIVE_INFINITY],
  ])("excludes %s from weighted records", async (_label, weight) => {
    mocks.findMany.mockResolvedValue([
      workoutWithExercises([
        {
          exerciseId: "exercise-1",
          name: "Bench Press",
          sets: [{ weight, reps: 8 }],
        },
      ]),
    ]);

    await expect(getTopExercisePersonalRecords("user-1")).resolves.toEqual([]);
  });

  it("keeps positive-weight sets eligible with the existing estimate", async () => {
    mocks.findMany.mockResolvedValue([
      workoutWithExercises([
        {
          exerciseId: "exercise-1",
          name: "Bench Press",
          sets: [{ weight: 225, reps: 8 }],
        },
      ]),
    ]);

    const records = await getTopExercisePersonalRecords("user-1");

    expect(records).toEqual([
      {
        exerciseName: "Bench Press",
        workoutId: "workout-1",
        workoutTitle: "Strength day",
        workoutDate: new Date("2026-07-13T12:00:00.000Z"),
        weight: 225,
        reps: 8,
        estimatedOneRepMax: 285,
      },
    ]);
  });

  it("chooses a valid positive-weight record from mixed valid and invalid sets", async () => {
    mocks.findMany.mockResolvedValue([
      workoutWithExercises([
        {
          exerciseId: "exercise-1",
          name: "Bench Press",
          sets: [
            { weight: 0, reps: 100 },
            { weight: -500, reps: 10 },
            { weight: Number.POSITIVE_INFINITY, reps: 1 },
            { weight: 200, reps: 5 },
          ],
        },
      ]),
    ]);

    const records = await getTopExercisePersonalRecords("user-1");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      exerciseName: "Bench Press",
      weight: 200,
      reps: 5,
    });
    expect(records[0]?.estimatedOneRepMax).toBeCloseTo(233.3333333333);
  });

  it("returns no records when workouts contain only ineligible weighted sets", async () => {
    mocks.findMany.mockResolvedValue([
      workoutWithExercises([
        {
          exerciseId: "exercise-1",
          name: "Pull-up",
          sets: [
            { weight: null, reps: 8 },
            { weight: 0, reps: 10 },
          ],
        },
        {
          exerciseId: "exercise-2",
          name: "Dip",
          sets: [{ weight: -10, reps: 6 }],
        },
      ]),
    ]);

    await expect(getTopExercisePersonalRecords("user-1")).resolves.toEqual([]);
  });

  it("preserves estimated-strength sorting and the requested limit", async () => {
    mocks.findMany.mockResolvedValue([
      workoutWithExercises([
        {
          exerciseId: "exercise-1",
          name: "Bench Press",
          sets: [
            { weight: 200, reps: 5 },
            { weight: 225, reps: 1 },
          ],
        },
        {
          exerciseId: "exercise-2",
          name: "Deadlift",
          sets: [{ weight: 405, reps: 3 }],
        },
        {
          exerciseId: "exercise-3",
          name: "Squat",
          sets: [{ weight: 315, reps: 5 }],
        },
      ]),
    ]);

    const records = await getTopExercisePersonalRecords("user-1", 2);

    expect(records.map((record) => record.exerciseName)).toEqual([
      "Deadlift",
      "Squat",
    ]);
    expect(records).toHaveLength(2);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
      },
      orderBy: {
        date: "desc",
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });
  });
});
