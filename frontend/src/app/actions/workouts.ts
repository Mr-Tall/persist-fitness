"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyWorkoutOwner } from "@/lib/auth/workout-access";
import {
  createActionErrorState,
  createActionSuccessState,
  type ActionFormState,
} from "@/lib/actions/action-result";
import { ActionError, toActionErrorState } from "@/lib/actions/action-error";
import { coordinateActiveWorkout } from "@/lib/workouts/active-workout-coordinator";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutIdSchema,
} from "@/lib/validation/workout";

export type UpdateWorkoutFormState = ActionFormState;
export type CreateWorkoutFormState = ActionFormState;

function calendarDateToUtcNoon(dateString: string) {
  return new Date(`${dateString}T12:00:00.000Z`);
}

function todayAtUtcNoon() {
  const today = new Date().toISOString().split("T")[0];
  return new Date(`${today}T12:00:00.000Z`);
}

async function updateWorkoutFromFormData(userId: string, formData: FormData) {
  const parsed = updateWorkoutSchema.parse({
    workoutId: formData.get("workoutId"),
    title: formData.get("title"),
    goal: formData.get("goal"),
    notes: formData.get("notes"),
    date: formData.get("date"),
  });

  const updatedWorkout = await db.workout.updateMany({
    where: {
      id: parsed.workoutId,
      userId,
    },
    data: {
      title: parsed.title,
      goal: parsed.goal ?? null,
      notes: parsed.notes ?? null,
      date: calendarDateToUtcNoon(parsed.date),
    },
  });

  if (updatedWorkout.count === 0) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  }

  revalidatePath(`/workouts/${parsed.workoutId}`);
  revalidatePath("/workouts");
  revalidatePath("/dashboard");

  return {
    status: "success" as const,
    message: "Workout details updated.",
    workoutId: parsed.workoutId,
  };
}

export async function createWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = createWorkoutSchema.parse({
    title: formData.get("title"),
    goal: formData.get("goal"),
    notes: formData.get("notes"),
    date: formData.get("date"),
  });

  const { workoutId } = await coordinateActiveWorkout({
    userId,
    createWorkout: (transaction) =>
      transaction.workout.create({
        data: {
          userId,
          title: parsed.title,
          goal: parsed.goal ?? null,
          notes: parsed.notes ?? null,
          date: calendarDateToUtcNoon(parsed.date),
          status: "active",
          startedAt: new Date(),
          finishedAt: null,
        },
      }),
  });

  redirect(`/workouts/${workoutId}`);
}

export async function createWorkoutWithState(
  _previousState: CreateWorkoutFormState,
  formData: FormData
): Promise<CreateWorkoutFormState> {
  try {
    await createWorkout(formData);
    return createActionSuccessState("Workout created.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "createWorkoutWithState",
      validationMessage: "Please check the workout details and try again.",
    });
  }
}

export async function startTodaysWorkout() {
  const userId = await requireUserId();

  const { workoutId } = await coordinateActiveWorkout({
    userId,
    createWorkout: (transaction) =>
      transaction.workout.create({
        data: {
          userId,
          title: "Today's Workout",
          goal: null,
          notes: null,
          date: todayAtUtcNoon(),
          status: "active",
          startedAt: new Date(),
          finishedAt: null,
        },
      }),
  });

  redirect(`/workouts/${workoutId}`);
}

export async function updateWorkout(formData: FormData) {
  const userId = await requireUserId();
  await updateWorkoutFromFormData(userId, formData);
}

export async function updateWorkoutWithState(
  _previousState: UpdateWorkoutFormState,
  formData: FormData
): Promise<UpdateWorkoutFormState> {
  const userId = await requireUserId();

  try {
    const result = await updateWorkoutFromFormData(userId, formData);

    return result.status === "success"
      ? createActionSuccessState(result.message)
      : createActionErrorState({
          code: "VALIDATION_ERROR",
          message: result.message,
        });
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "updateWorkoutWithState",
    });
  }
}

export async function finishWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = workoutIdSchema.parse({
    workoutId: formData.get("workoutId"),
  });

  const updatedWorkout = await db.workout.updateMany({
    where: {
      id: parsed.workoutId,
      userId,
      status: "active",
    },
    data: {
      status: "completed",
      finishedAt: new Date(),
    },
  });

  if (updatedWorkout.count === 0) {
    const existingWorkout = await db.workout.findFirst({
      where: {
        id: parsed.workoutId,
        userId,
      },
      select: {
        status: true,
        finishedAt: true,
      },
    });

    if (!existingWorkout) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: "The requested workout item could not be found.",
      });
    }

    if (existingWorkout.status !== "completed") {
      throw new ActionError({
        code: "CONFLICT",
        message: "The workout could not be finished from its current state.",
      });
    }
  }

  revalidatePath(`/workouts/${parsed.workoutId}`);
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}

export async function reopenWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = workoutIdSchema.parse({
    workoutId: formData.get("workoutId"),
  });

  const targetWorkout = await db.workout.findFirst({
    where: {
      id: parsed.workoutId,
      userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!targetWorkout) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  }

  if (targetWorkout.status === "active") {
    redirect(`/workouts/${targetWorkout.id}`);
  }

  if (targetWorkout.status !== "completed") {
    throw new ActionError({
      code: "CONFLICT",
      message: "The workout could not be reopened from its current state.",
    });
  }

  const {
    workoutId: activeWorkoutId,
    created: reopenedTarget,
  } = await coordinateActiveWorkout({
    userId,
    createWorkout: async (transaction) => {
      const reopenedWorkout = await transaction.workout.updateMany({
        where: {
          id: targetWorkout.id,
          userId,
          status: "completed",
        },
        data: {
          status: "active",
          finishedAt: null,
        },
      });

      if (reopenedWorkout.count !== 1) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "The requested workout item could not be found.",
        });
      }

      return { id: targetWorkout.id };
    },
  });

  if (!reopenedTarget) {
    redirect(`/workouts/${activeWorkoutId}`);
  }

  revalidatePath(`/workouts/${parsed.workoutId}`);
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}

export async function deleteWorkout(formData: FormData) {
  const userId = await requireUserId();

  const { workoutId } = workoutIdSchema.parse({
    workoutId: formData.get("workoutId"),
  });

  await verifyWorkoutOwner(workoutId, userId);

  await db.workout.delete({
    where: {
      id: workoutId,
    },
  });

  redirect("/workouts");
}

export async function repeatWorkout(formData: FormData) {
  const userId = await requireUserId();

  const { workoutId } = workoutIdSchema.parse({
    workoutId: formData.get("workoutId"),
  });

  const originalWorkout = await db.workout.findFirst({
    where: {
      id: workoutId,
      userId,
    },
    include: {
      exercises: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!originalWorkout) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  }

  const { workoutId: activeWorkoutId } = await coordinateActiveWorkout({
    userId,
    createWorkout: (transaction) =>
      transaction.workout.create({
        data: {
          userId,
          title: originalWorkout.title,
          goal: originalWorkout.goal,
          notes: null,
          date: todayAtUtcNoon(),
          status: "active",
          startedAt: new Date(),
          finishedAt: null,
          exercises: {
            create: originalWorkout.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
              order: exercise.order,
            })),
          },
        },
      }),
  });

  redirect(`/workouts/${activeWorkoutId}`);
}
