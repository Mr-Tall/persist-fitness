import { db } from "@/lib/db";

export type PreviousPerformance = {
  exerciseName: string;
  workoutTitle: string;
  workoutDate: Date;
  sets: {
    setNumber: number;
    reps: number | null;
    weight: number | null;
    rir: number | null;
  }[];
};

export async function getPreviousPerformanceForExercise({
  userId,
  currentWorkoutId,
  exerciseId,
  exerciseName,
}: {
  userId: string;
  currentWorkoutId: string;
  exerciseId: string | null;
  exerciseName: string;
}): Promise<PreviousPerformance | null> {
  const previousExercise = await db.workoutExercise.findFirst({
    where: {
      workout: {
        userId,
        id: {
          not: currentWorkoutId,
        },
      },
      sets: {
        some: {},
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
    orderBy: {
      workout: {
        date: "desc",
      },
    },
    include: {
      workout: {
        select: {
          title: true,
          date: true,
        },
      },
      sets: {
        orderBy: {
          setNumber: "asc",
        },
        select: {
          setNumber: true,
          reps: true,
          weight: true,
          rir: true,
        },
      },
    },
  });

  if (!previousExercise) {
    return null;
  }

  return {
    exerciseName: previousExercise.name,
    workoutTitle: previousExercise.workout.title,
    workoutDate: previousExercise.workout.date,
    sets: previousExercise.sets,
  };
}