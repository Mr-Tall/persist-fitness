import { describe, expect, it } from "vitest";
import {
  addSetSchema,
  createWorkoutSchema,
  isoCalendarDateSchema,
  MAX_NOTES_LENGTH,
  MAX_REPS,
  MAX_WEIGHT,
  MAX_WORKOUT_TITLE_LENGTH,
  optionalNotesSchema,
  optionalRepsSchema,
  optionalRirSchema,
  optionalTempoSchema,
  optionalWeightSchema,
  optionalWorkoutGoalSchema,
  workoutTitleSchema,
} from "@/lib/validation/workout";

describe("workout validation", () => {
  it("rejects whitespace-only and oversized workout titles", () => {
    expect(workoutTitleSchema.safeParse("   ").success).toBe(false);
    expect(
      workoutTitleSchema.safeParse("a".repeat(MAX_WORKOUT_TITLE_LENGTH + 1))
        .success
    ).toBe(false);
  });

  it("accepts and trims the title boundary", () => {
    const title = "a".repeat(MAX_WORKOUT_TITLE_LENGTH);
    expect(workoutTitleSchema.parse(` ${title} `)).toBe(title);
  });

  it("rejects oversized notes", () => {
    expect(
      optionalNotesSchema.safeParse("a".repeat(MAX_NOTES_LENGTH + 1)).success
    ).toBe(false);
  });

  it("rejects malformed and impossible calendar dates", () => {
    expect(isoCalendarDateSchema.safeParse("07/11/2026").success).toBe(false);
    expect(isoCalendarDateSchema.safeParse("2026-02-30").success).toBe(false);
  });

  it("accepts a valid leap-day calendar date", () => {
    expect(isoCalendarDateSchema.parse("2028-02-29")).toBe("2028-02-29");
  });

  it("rejects negative, NaN, and infinite weight", () => {
    expect(optionalWeightSchema.safeParse("-1").success).toBe(false);
    expect(optionalWeightSchema.safeParse("NaN").success).toBe(false);
    expect(optionalWeightSchema.safeParse("Infinity").success).toBe(false);
  });

  it("rejects fractional and excessive reps", () => {
    expect(optionalRepsSchema.safeParse("1.5").success).toBe(false);
    expect(optionalRepsSchema.safeParse(String(MAX_REPS + 1)).success).toBe(
      false
    );
  });

  it("normalizes empty optional values", () => {
    expect(optionalWorkoutGoalSchema.parse("   ")).toBeUndefined();
    expect(optionalNotesSchema.parse("")).toBeUndefined();
    expect(optionalTempoSchema.parse(null)).toBeUndefined();
    expect(optionalWeightSchema.parse(" ")).toBeUndefined();
  });

  it("accepts valid numeric boundary values", () => {
    expect(optionalWeightSchema.parse(String(MAX_WEIGHT))).toBe(MAX_WEIGHT);
    expect(optionalRepsSchema.parse(String(MAX_REPS))).toBe(MAX_REPS);
    expect(optionalRirSchema.parse("10")).toBe(10);
  });

  it("preserves representative successful action payloads", () => {
    expect(
      createWorkoutSchema.parse({
        title: " Upper Strength ",
        goal: " Strength ",
        notes: " Felt solid ",
        date: "2026-07-11",
      })
    ).toEqual({
      title: "Upper Strength",
      goal: "Strength",
      notes: "Felt solid",
      date: "2026-07-11",
    });

    expect(
      addSetSchema.parse({
        workoutId: " workout-1 ",
        workoutExerciseId: " exercise-1 ",
        reps: "8",
        weight: "225.5",
        rir: "2",
        tempo: " 3-1-1 ",
        notes: " controlled ",
      })
    ).toEqual({
      workoutId: "workout-1",
      workoutExerciseId: "exercise-1",
      reps: 8,
      weight: 225.5,
      rir: 2,
      tempo: "3-1-1",
      notes: "controlled",
    });
  });
});
