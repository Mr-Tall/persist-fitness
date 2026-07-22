import {
  listWorkoutMutations,
  removeWorkoutMutation,
  reconcileQueuedMutationTargets,
  replaceWorkoutMutation,
  saveWorkoutSnapshot,
} from "./storage";
import { reconcileTemporarySetId, resolveMutationTarget } from "./optimistic";
import type {
  OfflineSyncResult,
  OfflineWorkoutMutation,
  OfflineWorkoutSnapshot,
} from "./types";

export async function synchronizeWorkoutQueue(options: {
  snapshot: OfflineWorkoutSnapshot;
  send: (mutation: OfflineWorkoutMutation) => Promise<OfflineSyncResult>;
  onSnapshot?: (snapshot: OfflineWorkoutSnapshot) => void;
}) {
  let snapshot = options.snapshot;
  const reconciledIds = new Map<string, string>();
  const queue = await listWorkoutMutations(snapshot.userId, snapshot.workoutId);

  for (const queuedMutation of queue) {
    const mutation = resolveMutationTarget(queuedMutation, reconciledIds);
    if (
      mutation.operation !== "add" &&
      mutation.targetSetId?.startsWith("offline-set:")
    ) {
      break;
    }

    let result: OfflineSyncResult;
    try {
      result = await options.send(mutation);
    } catch {
      await replaceWorkoutMutation({ ...mutation, attempts: mutation.attempts + 1 });
      break;
    }

    if (result.status === "conflict") {
      await replaceWorkoutMutation({
        ...mutation,
        conflict: { code: result.code, message: result.message },
        attempts: mutation.attempts + 1,
      });
      break;
    }

    if (
      mutation.operation === "add" &&
      mutation.temporarySetId &&
      result.serverSetId
    ) {
      reconciledIds.set(mutation.temporarySetId, result.serverSetId);
      snapshot = reconcileTemporarySetId(
        snapshot,
        mutation.temporarySetId,
        result.serverSetId,
      );
      options.onSnapshot?.(snapshot);
      await saveWorkoutSnapshot(snapshot);
      await reconcileQueuedMutationTargets(
        snapshot.userId,
        snapshot.workoutId,
        mutation.temporarySetId,
        result.serverSetId,
      );
    }
    await removeWorkoutMutation(mutation.clientMutationId);
  }

  return { snapshot, remaining: await listWorkoutMutations(snapshot.userId, snapshot.workoutId) };
}
