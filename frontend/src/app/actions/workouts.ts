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
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutIdSchema,
} from "@/lib/validation/workout";

export type UpdateWorkoutFormState = ActionFormState;

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

  const workout = await db.workout.create({
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
  });

  redirect(`/workouts/${workout.id}`);
}

export async function startTodaysWorkout() {
  const userId = await requireUserId();

  const workout = await db.workout.create({
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
  });

  redirect(`/workouts/${workout.id}`);
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
    },
    data: {
      status: "completed",
      finishedAt: new Date(),
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
}

export async function reopenWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = workoutIdSchema.parse({
    workoutId: formData.get("workoutId"),
  });

  const updatedWorkout = await db.workout.updateMany({
    where: {
      id: parsed.workoutId,
      userId,
    },
    data: {
      status: "active",
      finishedAt: null,
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

  const newWorkout = await db.workout.create({
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
  });

  redirect(`/workouts/${newWorkout.id}`);
}
