import {
  createOfflineId,
  isTemporarySetId,
  type OfflineSetValues,
  type OfflineWorkoutMutation,
  type OfflineWorkoutSnapshot,
} from "./types";

export function createOptimisticAdd(
  snapshot: OfflineWorkoutSnapshot,
  workoutExerciseId: string,
  values: OfflineSetValues,
  now = Date.now(),
) {
  const exercise = snapshot.exercises.find((item) => item.id === workoutExerciseId);
  if (!exercise) throw new Error("Workout exercise is unavailable offline.");
  const temporarySetId = createOfflineId("set");
  const setNumber = Math.max(0, ...exercise.sets.map((set) => set.setNumber)) + 1;
  const mutation: OfflineWorkoutMutation = {
    clientMutationId: createOfflineId("mutation"),
    userId: snapshot.userId,
    workoutId: snapshot.workoutId,
    workoutExerciseId,
    trackingType: exercise.trackingType,
    operation: "add",
    targetSetId: null,
    temporarySetId,
    values,
    clientTimestamp: now,
    baseUpdatedAt: snapshot.serverUpdatedAt,
    conflict: null,
    attempts: 0,
  };
  return {
    mutation,
    snapshot: {
      ...snapshot,
      savedAt: now,
      exercises: snapshot.exercises.map((item) =>
        item.id === workoutExerciseId
          ? {
              ...item,
              sets: [
                ...item.sets,
                { id: temporarySetId, setNumber, pending: true, ...values },
              ],
            }
          : item,
      ),
    },
  };
}

export function applyOptimisticEdit(
  snapshot: OfflineWorkoutSnapshot,
  workoutExerciseId: string,
  targetSetId: string,
  values: OfflineSetValues,
) {
  return {
    ...snapshot,
    exercises: snapshot.exercises.map((exercise) =>
      exercise.id === workoutExerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === targetSetId ? { ...set, ...values, pending: true } : set,
            ),
          }
        : exercise,
    ),
  };
}

export function applyOptimisticDelete(
  snapshot: OfflineWorkoutSnapshot,
  workoutExerciseId: string,
  targetSetId: string,
) {
  return {
    ...snapshot,
    exercises: snapshot.exercises.map((exercise) => {
      if (exercise.id !== workoutExerciseId) return exercise;
      return {
        ...exercise,
        sets: exercise.sets
          .filter((set) => set.id !== targetSetId)
          .map((set, index) => ({ ...set, setNumber: index + 1 })),
      };
    }),
  };
}

export function reconcileTemporarySetId(
  snapshot: OfflineWorkoutSnapshot,
  temporarySetId: string,
  serverSetId: string,
) {
  return {
    ...snapshot,
    exercises: snapshot.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === temporarySetId
          ? { ...set, id: serverSetId, pending: false }
          : set,
      ),
    })),
  };
}

export function resolveMutationTarget(
  mutation: OfflineWorkoutMutation,
  reconciledIds: Map<string, string>,
) {
  if (!mutation.targetSetId || !isTemporarySetId(mutation.targetSetId)) {
    return mutation;
  }
  const serverId = reconciledIds.get(mutation.targetSetId);
  return serverId ? { ...mutation, targetSetId: serverId } : mutation;
}
