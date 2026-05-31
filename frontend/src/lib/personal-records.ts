import { db } from "@/lib/db";

export type ExercisePersonalRecord = {
  exerciseName: string;
  workoutId: string;
  workoutTitle: string;
  workoutDate: Date;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
};

function estimateOneRepMax(weight: number, reps: number) {
  if (reps <= 1) {
    return weight;
  }

  return weight * (1 + reps / 30);
}

export async function getTopExercisePersonalRecords(
  userId: string,
  limit = 5
): Promise<ExercisePersonalRecord[]> {
  const workouts = await db.workout.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  });

  const bestByExercise = new Map<string, ExercisePersonalRecord>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const exerciseKey = exercise.exerciseId ?? exercise.name.toLowerCase();

      for (const set of exercise.sets) {
        if (set.weight === null || set.reps === null || set.reps <= 0) {
          continue;
        }

        const estimatedOneRepMax = estimateOneRepMax(set.weight, set.reps);

        const currentBest = bestByExercise.get(exerciseKey);

        if (
          !currentBest ||
          estimatedOneRepMax > currentBest.estimatedOneRepMax
        ) {
          bestByExercise.set(exerciseKey, {
            exerciseName: exercise.name,
            workoutId: workout.id,
            workoutTitle: workout.title,
            workoutDate: workout.date,
            weight: set.weight,
            reps: set.reps,
            estimatedOneRepMax,
          });
        }
      }
    }
  }

  return Array.from(bestByExercise.values())
    .sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)
    .slice(0, limit);
}