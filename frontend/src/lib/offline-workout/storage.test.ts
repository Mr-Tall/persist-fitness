import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearOfflineWorkoutDatabase,
  getWorkoutSnapshot,
  listWorkoutMutations,
  removeOtherUsersWorkoutData,
  saveWorkoutSnapshot,
  enqueueWorkoutMutation,
} from "./storage";
import type { OfflineWorkoutMutation, OfflineWorkoutSnapshot } from "./types";

function snapshot(userId: string, workoutId: string, expiresAt = Date.now() + 1000): OfflineWorkoutSnapshot {
  return {
    key: `${userId}:${workoutId}`, userId, workoutId, title: "Workout",
    startedAt: new Date().toISOString(), serverUpdatedAt: new Date().toISOString(),
    status: "active", savedAt: Date.now(),
    expiresAt, exercises: [],
  };
}

function mutation(userId: string, workoutId: string): OfflineWorkoutMutation {
  return {
    clientMutationId: `${userId}-${workoutId}`, userId, workoutId,
    workoutExerciseId: "exercise", trackingType: "weight_reps", operation: "delete", targetSetId: "set",
    temporarySetId: null, values: null, clientTimestamp: 1, baseUpdatedAt: null,
    conflict: null, attempts: 0,
  };
}

describe("offline workout storage boundaries", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await clearOfflineWorkoutDatabase();
  });

  it("scopes snapshots and queued changes by user and workout", async () => {
    await saveWorkoutSnapshot(snapshot("user-a", "workout-a"));
    await saveWorkoutSnapshot(snapshot("user-b", "workout-b"));
    await enqueueWorkoutMutation(mutation("user-a", "workout-a"));
    await enqueueWorkoutMutation(mutation("user-b", "workout-b"));

    expect(await getWorkoutSnapshot("user-a", "workout-a")).toMatchObject({ userId: "user-a" });
    expect(await getWorkoutSnapshot("user-a", "workout-b")).toBeNull();
    expect(await listWorkoutMutations("user-a", "workout-a")).toHaveLength(1);

    await removeOtherUsersWorkoutData("user-a");
    expect(await getWorkoutSnapshot("user-b", "workout-b")).toBeNull();
  });

  it("expires stale snapshots instead of rendering them offline", async () => {
    await saveWorkoutSnapshot(snapshot("user-a", "workout-a", Date.now() - 1));
    expect(await getWorkoutSnapshot("user-a", "workout-a")).toBeNull();
  });
});
