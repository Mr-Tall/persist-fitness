import { describe, expect, it, vi } from "vitest";
import { getOfflineSetValues } from "./form-values";
import {
  applyOptimisticDelete,
  applyOptimisticEdit,
  createOptimisticAdd,
  reconcileTemporarySetId,
} from "./optimistic";
import { orderWorkoutMutations } from "./storage";
import type { OfflineWorkoutMutation, OfflineWorkoutSnapshot } from "./types";

vi.stubGlobal("crypto", { randomUUID: () => "stable-id" });

const emptyValues = {
  weight: null, reps: null, durationSeconds: null, distance: null,
  distanceUnit: null, rir: null, tempo: null, notes: null,
};

function snapshot(): OfflineWorkoutSnapshot {
  return {
    key: "user-1:workout-1", userId: "user-1", workoutId: "workout-1",
    title: "Session", startedAt: "2026-07-21T12:00:00.000Z",
    serverUpdatedAt: "2026-07-21T12:00:00.000Z", status: "active",
    savedAt: 1, expiresAt: Number.MAX_SAFE_INTEGER,
    exercises: [{
      id: "exercise-1", exerciseId: "library-1", name: "Bench", order: 0,
      trackingType: "weight_reps",
      sets: [{ id: "server-1", setNumber: 1, pending: false, ...emptyValues, weight: 100, reps: 5 }],
    }],
  };
}

describe("offline workout optimistic records", () => {
  it("creates stable temporary sets with deterministic ordering and reconciles IDs", () => {
    const added = createOptimisticAdd(snapshot(), "exercise-1", { ...emptyValues, weight: 105, reps: 5 }, 10);
    expect(added.mutation.temporarySetId).toBe("offline-set:stable-id");
    expect(added.snapshot.exercises[0].sets.map((set) => set.setNumber)).toEqual([1, 2]);
    const reconciled = reconcileTemporarySetId(added.snapshot, "offline-set:stable-id", "server-2");
    expect(reconciled.exercises[0].sets[1]).toMatchObject({ id: "server-2", pending: false });
  });

  it("applies offline edits and deletes without changing another exercise", () => {
    const edited = applyOptimisticEdit(snapshot(), "exercise-1", "server-1", { ...emptyValues, weight: 110, reps: 4 });
    expect(edited.exercises[0].sets[0]).toMatchObject({ weight: 110, reps: 4, pending: true });
    expect(applyOptimisticDelete(edited, "exercise-1", "server-1").exercises[0].sets).toEqual([]);
  });

  it.each([
    ["weight_reps", { weight: "225", reps: "5" }, { weight: 225, reps: 5 }],
    ["reps_only", { reps: "20" }, { weight: null, reps: 20 }],
    ["time", { minutes: "1", seconds: "30" }, { durationSeconds: 90 }],
    ["distance", { distance: "5", distanceUnit: "km" }, { distance: 5, distanceUnit: "km" }],
    ["distance_time", { distance: "500", distanceUnit: "m", minutes: "1", seconds: "42" }, { distance: 500, durationSeconds: 102 }],
  ])("normalizes %s form values for the queue", (mode, entries, expected) => {
    const formData = new FormData();
    Object.entries(entries).forEach(([name, value]) => formData.set(name, value));
    expect(getOfflineSetValues(formData, mode)).toMatchObject(expected);
  });

  it("orders queued work by timestamp and mutation ID without mutating input", () => {
    const base = {
      userId: "user-1", workoutId: "workout-1", workoutExerciseId: "exercise-1",
      trackingType: "weight_reps" as const,
      operation: "delete" as const, targetSetId: "set-1", temporarySetId: null,
      values: null, baseUpdatedAt: null, conflict: null, attempts: 0,
    };
    const queue = [
      { ...base, clientMutationId: "b", clientTimestamp: 2 },
      { ...base, clientMutationId: "c", clientTimestamp: 1 },
      { ...base, clientMutationId: "a", clientTimestamp: 2 },
    ] satisfies OfflineWorkoutMutation[];
    expect(orderWorkoutMutations(queue).map((item) => item.clientMutationId)).toEqual(["c", "a", "b"]);
    expect(queue[0].clientMutationId).toBe("b");
  });
});
