import { db } from "@/lib/db";
import { summarizeWorkoutHistory } from "@/lib/workout-history-summary";

export type ExercisePersonalRecord = {
  exerciseName: string;
  workoutId: string;
  workoutTitle: string;
  workoutDate: Date;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
};

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
          exercise: {
            select: { primaryMuscles: true, trackingType: true },
          },
        },
      },
    },
  });

  return summarizeWorkoutHistory(workouts, {
    personalRecordLimit: limit,
  }).personalRecords;
}
