import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OfflineWorkoutMutation, OfflineWorkoutSnapshot } from "./types";

const storage = vi.hoisted(() => ({
  listWorkoutMutations: vi.fn(), removeWorkoutMutation: vi.fn(),
  replaceWorkoutMutation: vi.fn(), saveWorkoutSnapshot: vi.fn(),
  reconcileQueuedMutationTargets: vi.fn(),
}));
vi.mock("./storage", () => storage);

import { synchronizeWorkoutQueue } from "./sync";

const snapshot: OfflineWorkoutSnapshot = {
  key: "u:w", userId: "u", workoutId: "w", title: "Workout",
  startedAt: "2026-07-21T00:00:00.000Z",
  serverUpdatedAt: "2026-07-21T00:00:00.000Z", status: "active", savedAt: 1,
  expiresAt: 9999999999999,
  exercises: [{ id: "e", exerciseId: null, name: "Push-up", order: 0, trackingType: "reps_only", sets: [{
    id: "offline-set:1", setNumber: 1, pending: true, weight: null, reps: 10,
    durationSeconds: null, distance: null, distanceUnit: null, rir: null, tempo: null, notes: null,
  }] }],
};
const add: OfflineWorkoutMutation = {
  clientMutationId: "m1", userId: "u", workoutId: "w", workoutExerciseId: "e",
  trackingType: "reps_only",
  operation: "add", targetSetId: null, temporarySetId: "offline-set:1",
  values: snapshot.exercises[0].sets[0], clientTimestamp: 1, baseUpdatedAt: null,
  conflict: null, attempts: 0,
};

describe("offline workout synchronization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reconciles temporary IDs and removes only confirmed mutations", async () => {
    storage.listWorkoutMutations.mockResolvedValueOnce([add]).mockResolvedValueOnce([]);
    const result = await synchronizeWorkoutQueue({
      snapshot,
      send: vi.fn().mockResolvedValue({ status: "applied", serverSetId: "server-1" }),
    });
    expect(result.snapshot.exercises[0].sets[0].id).toBe("server-1");
    expect(storage.reconcileQueuedMutationTargets).toHaveBeenCalledWith("u", "w", "offline-set:1", "server-1");
    expect(storage.removeWorkoutMutation).toHaveBeenCalledWith("m1");
  });

  it("treats an already-applied mutation receipt as confirmation without duplicating it", async () => {
    storage.listWorkoutMutations.mockResolvedValueOnce([add]).mockResolvedValueOnce([]);
    const send = vi.fn().mockResolvedValue({
      status: "already_applied",
      serverSetId: "server-1",
    });
    await synchronizeWorkoutQueue({ snapshot, send });
    expect(send).toHaveBeenCalledOnce();
    expect(storage.removeWorkoutMutation).toHaveBeenCalledWith("m1");
  });

  it("keeps a mutation after interruption so retry is safe", async () => {
    storage.listWorkoutMutations.mockResolvedValueOnce([add]).mockResolvedValueOnce([add]);
    await synchronizeWorkoutQueue({ snapshot, send: vi.fn().mockRejectedValue(new Error("offline")) });
    expect(storage.replaceWorkoutMutation).toHaveBeenCalledWith(expect.objectContaining({ attempts: 1 }));
    expect(storage.removeWorkoutMutation).not.toHaveBeenCalled();
  });

  it("preserves user data and stops on a finished-workout conflict", async () => {
    storage.listWorkoutMutations.mockResolvedValueOnce([add]).mockResolvedValueOnce([add]);
    await synchronizeWorkoutQueue({
      snapshot,
      send: vi.fn().mockResolvedValue({ status: "conflict", code: "WORKOUT_FINISHED", message: "Changed elsewhere" }),
    });
    expect(storage.replaceWorkoutMutation).toHaveBeenCalledWith(expect.objectContaining({
      conflict: { code: "WORKOUT_FINISHED", message: "Changed elsewhere" },
    }));
    expect(storage.removeWorkoutMutation).not.toHaveBeenCalled();
  });
});
