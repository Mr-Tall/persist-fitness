import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const MAX_TRANSACTION_ATTEMPTS = 3;
const ACTIVE_WORKOUT_CONSTRAINT = "Workout_one_active_per_user_key";

type CoordinateActiveWorkoutOptions = {
  userId: string;
  createWorkout: (
    transaction: Prisma.TransactionClient
  ) => Promise<{ id: string }>;
};

export type ActiveWorkoutCoordinationResult = {
  workoutId: string;
  created: boolean;
};

function isActiveWorkoutUniqueConflict(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002" ||
    !("meta" in error) ||
    typeof error.meta !== "object" ||
    error.meta === null
  ) {
    return false;
  }

  const meta = error.meta as {
    modelName?: unknown;
    target?: unknown;
  };

  if (meta.target === ACTIVE_WORKOUT_CONSTRAINT) {
    return true;
  }

  return (
    meta.modelName === "Workout" &&
    Array.isArray(meta.target) &&
    meta.target.length === 1 &&
    meta.target[0] === "userId"
  );
}

function isRetryableCoordinatorError(error: unknown) {
  const isWriteConflict =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034";

  return isWriteConflict || isActiveWorkoutUniqueConflict(error);
}

export async function coordinateActiveWorkout({
  userId,
  createWorkout,
}: CoordinateActiveWorkoutOptions): Promise<ActiveWorkoutCoordinationResult> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(
        async (transaction) => {
          const activeWorkout = await transaction.workout.findFirst({
            where: {
              userId,
              status: "active",
            },
            orderBy: [{ startedAt: "desc" }, { id: "desc" }],
            select: {
              id: true,
            },
          });

          if (activeWorkout) {
            return {
              workoutId: activeWorkout.id,
              created: false,
            };
          }

          const workout = await createWorkout(transaction);

          return {
            workoutId: workout.id,
            created: true,
          };
        },
        {
          isolationLevel: "Serializable",
        }
      );
    } catch (error) {
      if (
        !isRetryableCoordinatorError(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw new Error("Active workout retry loop exited unexpectedly.");
}
