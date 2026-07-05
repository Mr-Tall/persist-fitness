import { describe, expect, it } from "vitest";
import {
  calculateWorkoutProgress,
  calculateWorkoutVolume,
  formatWorkoutDuration,
} from "./workout-math";

describe("workout math", () => {
  it("calculates total workout volume from weight and reps", () => {
    const volume = calculateWorkoutVolume([
      {
        sets: [
          { weight: 225, reps: 8 },
          { weight: 185, reps: 10 },
        ],
      },
    ]);

    expect(volume).toBe(3650);
  });

  it("ignores sets with missing weight or reps", () => {
    const volume = calculateWorkoutVolume([
      {
        sets: [
          { weight: 225, reps: 8 },
          { weight: null, reps: 10 },
          { weight: 135, reps: null },
        ],
      },
    ]);

    expect(volume).toBe(1800);
  });

  it("caps workout progress at 100 percent", () => {
    expect(calculateWorkoutProgress(15, 12)).toBe(100);
  });

  it("formats workout duration under one hour", () => {
    const startedAt = new Date("2026-06-29T18:00:00.000Z");
    const finishedAt = new Date("2026-06-29T18:48:00.000Z");

    expect(formatWorkoutDuration(startedAt, finishedAt)).toBe("48m");
  });

  it("formats workout duration over one hour", () => {
    const startedAt = new Date("2026-06-29T18:00:00.000Z");
    const finishedAt = new Date("2026-06-29T19:15:00.000Z");

    expect(formatWorkoutDuration(startedAt, finishedAt)).toBe("1h 15m");
  });

  it("returns in-progress text when duration is incomplete", () => {
    expect(formatWorkoutDuration(new Date(), null)).toBe("In progress");
  });
});