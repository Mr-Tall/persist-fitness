import { describe, expect, it } from "vitest";
import {
  calculateExerciseRecord,
  formatTrackedSet,
  normalizeTrackingType,
} from "@/lib/exercise-tracking";

describe("universal exercise tracking", () => {
  it("keeps missing and unknown historical metadata weighted by default", () => {
    expect(normalizeTrackingType(null)).toBe("weight_reps");
    expect(normalizeTrackingType("legacy_value")).toBe("weight_reps");
    expect(formatTrackedSet(null, { weight: 225, reps: 5 })).toBe(
      "225 lb × 5 reps",
    );
  });

  it("normalizes legacy bodyweight tracking to reps only", () => {
    expect(normalizeTrackingType("bodyweight_reps")).toBe("reps_only");
    expect(formatTrackedSet("reps_only", { reps: 20 })).toBe("20 reps");
  });

  it("formats time, distance, and distance plus time", () => {
    expect(formatTrackedSet("time", { durationSeconds: 90 })).toBe("90 sec");
    expect(
      formatTrackedSet("distance", { distance: 5, distanceUnit: "km" }),
    ).toBe("5 km");
    expect(
      formatTrackedSet("distance_time", {
        distance: 500,
        distanceUnit: "m",
        durationSeconds: 102,
      }),
    ).toBe("500 m in 1:42");
  });

  it("calculates the correct record for every tracking mode", () => {
    expect(
      calculateExerciseRecord("weight_reps", [
        { weight: 200, reps: 5 },
        { weight: 225, reps: 5 },
      ]),
    ).toMatchObject({ type: "weight", label: "225 lb × 5" });
    expect(
      calculateExerciseRecord("reps_only", [{ reps: 12 }, { reps: 20 }]),
    ).toEqual({ type: "reps", value: 20, label: "20 reps" });
    expect(
      calculateExerciseRecord("time", [
        { durationSeconds: 60 },
        { durationSeconds: 90 },
      ]),
    ).toEqual({ type: "duration", value: 90, label: "90 sec" });
    expect(
      calculateExerciseRecord("distance", [
        { distance: 1, distanceUnit: "mi" },
        { distance: 2, distanceUnit: "km" },
      ]),
    ).toMatchObject({ type: "distance", label: "2 km" });
    expect(
      calculateExerciseRecord("distance_time", [
        { distance: 500, distanceUnit: "m", durationSeconds: 120 },
        { distance: 500, distanceUnit: "m", durationSeconds: 100 },
      ]),
    ).toMatchObject({ type: "pace", label: "500 m in 1:40" });
  });

  it("does not create records from incomplete or invalid values", () => {
    expect(calculateExerciseRecord("weight_reps", [{ weight: 0, reps: 10 }])).toBeNull();
    expect(calculateExerciseRecord("time", [{ durationSeconds: 0 }])).toBeNull();
    expect(
      calculateExerciseRecord("distance_time", [
        { distance: 500, distanceUnit: "m", durationSeconds: null },
      ]),
    ).toBeNull();
  });
});
