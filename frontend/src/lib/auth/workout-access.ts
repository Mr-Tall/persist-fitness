import { db } from "@/lib/db";

export async function verifyWorkoutOwner(workoutId: string, userId: string) {
  const workout = await db.workout.findFirst({
    where: {
      id: workoutId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!workout) {
    throw new Error("Workout not found");
  }

  return workout;
}