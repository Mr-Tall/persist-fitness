import { db } from "@/lib/db";
import { ActionError } from "@/lib/actions/action-error";

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
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  }

  return workout;
}
