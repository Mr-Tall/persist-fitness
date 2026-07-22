import { db } from "@/lib/db";
import {
  calculateExerciseRecord,
  normalizeTrackingType,
} from "@/lib/exercise-tracking";

type SetPrStatusInput = {
  userId: string;
  currentWorkoutId: string;
  exerciseId: string | null;
  exerciseName: string;
  trackingType?: string | null;
};

export type SetPrStatus = {
  setId: string;
  estimatedOneRepMax: number | null;
  isPersonalRecord: boolean;
  recordLabel: string | null;
};

export async function getSetPrStatuses({
  userId,
  currentWorkoutId,
  exerciseId,
  exerciseName,
  trackingType,
}: SetPrStatusInput): Promise<Map<string, SetPrStatus>> {
  const mode = normalizeTrackingType(trackingType);
  const currentExercise = await db.workoutExercise.findFirst({
    where: {
      workoutId: currentWorkoutId,
      OR: exerciseId
        ? [
            {
              exerciseId,
            },
            {
              name: {
                equals: exerciseName,
                mode: "insensitive",
              },
            },
          ]
        : [
            {
              name: {
                equals: exerciseName,
                mode: "insensitive",
              },
            },
          ],
    },
    include: {
      sets: true,
    },
  });

  if (!currentExercise) {
    return new Map();
  }

  const previousExercises = await db.workoutExercise.findMany({
    where: {
      workout: {
        userId,
        id: {
          not: currentWorkoutId,
        },
      },
      OR: exerciseId
        ? [
            {
              exerciseId,
            },
            {
              name: {
                equals: exerciseName,
                mode: "insensitive",
              },
            },
          ]
        : [
            {
              name: {
                equals: exerciseName,
                mode: "insensitive",
              },
            },
          ],
    },
    include: {
      sets: true,
    },
  });

  const previousBest = calculateExerciseRecord(
    mode,
    previousExercises.flatMap((exercise) => exercise.sets),
  );

  const statuses = new Map<string, SetPrStatus>();

  for (const set of currentExercise.sets) {
    const record = calculateExerciseRecord(mode, [set]);
    if (!record) {
      statuses.set(set.id, {
        setId: set.id,
        estimatedOneRepMax: null,
        isPersonalRecord: false,
        recordLabel: null,
      });
      continue;
    }

    const beatsPrevious =
      !previousBest ||
      (record.type === "pace"
        ? record.value < previousBest.value
        : record.value > previousBest.value);

    statuses.set(set.id, {
      setId: set.id,
      estimatedOneRepMax:
        record.type === "weight" ? record.estimatedOneRepMax : null,
      isPersonalRecord: beatsPrevious,
      recordLabel: record.type === "weight" ? null : record.label,
    });
  }

  return statuses;
}
