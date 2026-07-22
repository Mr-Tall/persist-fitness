import type { TrackingType } from "@/lib/exercise-tracking";

export const OFFLINE_WORKOUT_SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const OFFLINE_SET_ID_PREFIX = "offline-set:";

export type OfflineSetValues = {
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distance: number | null;
  distanceUnit: string | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
};

export type OfflineWorkoutSet = OfflineSetValues & {
  id: string;
  setNumber: number;
  pending: boolean;
};

export type OfflineWorkoutExercise = {
  id: string;
  exerciseId: string | null;
  name: string;
  order: number;
  trackingType: TrackingType;
  sets: OfflineWorkoutSet[];
};

export type OfflineWorkoutSnapshot = {
  key: string;
  userId: string;
  workoutId: string;
  title: string;
  startedAt: string;
  serverUpdatedAt: string;
  status: "active";
  exercises: OfflineWorkoutExercise[];
  savedAt: number;
  expiresAt: number;
};

export type OfflineMutationOperation = "add" | "edit" | "delete";
export type OfflineConflictCode =
  | "WORKOUT_FINISHED"
  | "SET_DELETED"
  | "EXERCISE_DELETED"
  | "INVALID_TRACKING"
  | "UNKNOWN";

export type OfflineWorkoutMutation = {
  clientMutationId: string;
  userId: string;
  workoutId: string;
  workoutExerciseId: string;
  trackingType: TrackingType;
  operation: OfflineMutationOperation;
  targetSetId: string | null;
  temporarySetId: string | null;
  values: OfflineSetValues | null;
  clientTimestamp: number;
  baseUpdatedAt: string | null;
  conflict: { code: OfflineConflictCode; message: string } | null;
  attempts: number;
};

export type OfflineSyncResult =
  | { status: "applied" | "already_applied"; serverSetId: string | null }
  | { status: "conflict"; code: OfflineConflictCode; message: string };

export type WorkoutSyncStatus =
  | "saved"
  | "saving"
  | "offline"
  | "pending"
  | "syncing"
  | "issue";

export function createOfflineId(prefix: "mutation" | "set") {
  const id = globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return prefix === "set" ? `${OFFLINE_SET_ID_PREFIX}${id}` : `offline-mutation:${id}`;
}

export function isTemporarySetId(id: string) {
  return id.startsWith(OFFLINE_SET_ID_PREFIX);
}

export function snapshotKey(userId: string, workoutId: string) {
  return `${userId}:${workoutId}`;
}
