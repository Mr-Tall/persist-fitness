import { db } from "@/lib/db";

type SetPrStatusInput = {
  userId: string;
  currentWorkoutId: string;
  exerciseId: string | null;
  exerciseName: string;
};

export type SetPrStatus = {
  setId: string;
  estimatedOneRepMax: number | null;
  isPersonalRecord: boolean;
};

function estimateOneRepMax(weight: number, reps: number) {
  if (reps <= 1) {
    return weight;
  }

  return weight * (1 + reps / 30);
}

export async function getSetPrStatuses({
  userId,
  currentWorkoutId,
  exerciseId,
  exerciseName,
}: SetPrStatusInput): Promise<Map<string, SetPrStatus>> {
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

  const previousBestEstimatedOneRepMax = previousExercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => set.weight !== null && set.reps !== null && set.reps > 0)
    .map((set) => estimateOneRepMax(set.weight as number, set.reps as number))
    .sort((a, b) => b - a)[0];

  const statuses = new Map<string, SetPrStatus>();

  for (const set of currentExercise.sets) {
    if (set.weight === null || set.reps === null || set.reps <= 0) {
      statuses.set(set.id, {
        setId: set.id,
        estimatedOneRepMax: null,
        isPersonalRecord: false,
      });
      continue;
    }

    const estimatedOneRepMax = estimateOneRepMax(set.weight, set.reps);

    statuses.set(set.id, {
      setId: set.id,
      estimatedOneRepMax,
      isPersonalRecord:
        previousBestEstimatedOneRepMax === undefined ||
        estimatedOneRepMax > previousBestEstimatedOneRepMax,
    });
  }

  return statuses;
}