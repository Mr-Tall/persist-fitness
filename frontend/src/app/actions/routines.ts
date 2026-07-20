"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ActionError,
  runActionWithSafeErrors,
  toActionErrorState,
} from "@/lib/actions/action-error";
import {
  createActionSuccessState,
  type ActionFormState,
} from "@/lib/actions/action-result";
import { coordinateActiveWorkout } from "@/lib/workouts/active-workout-coordinator";

const createRoutineSchema = z.object({
  title: z.string().min(1, "Routine title is required"),
  goal: z.string().optional(),
  description: z.string().optional(),
});

const updateRoutineSchema = z.object({
  routineId: z.string().min(1),
  title: z.string().min(1, "Routine title is required"),
  goal: z.string().optional(),
  description: z.string().optional(),
});

const deleteRoutineSchema = z.object({
  routineId: z.string().min(1),
});

const addTemplateExerciseSchema = z.object({
  routineId: z.string().min(1),
  exerciseId: z.string().optional(),
  name: z.string().optional(),
  sets: z.coerce.number().int().min(1).max(20).optional(),
  reps: z.string().optional(),
  notes: z.string().optional(),
});

const updateTemplateExerciseSchema = z.object({
  routineId: z.string().min(1),
  templateExerciseId: z.string().min(1),
  sets: z.coerce.number().int().min(1).max(20).optional(),
  reps: z.string().optional(),
  notes: z.string().optional(),
});

const deleteTemplateExerciseSchema = z.object({
  routineId: z.string().min(1),
  templateExerciseId: z.string().min(1),
});

const startRoutineSchema = z.object({
  routineId: z.string().min(1),
});

async function verifyRoutineOwner(routineId: string, userId: string) {
  const routine = await db.workoutTemplate.findFirst({
    where: {
      id: routineId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!routine) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });
  }

  return routine;
}

function todayAtUtcNoon() {
  const today = new Date().toISOString().split("T")[0];
  return new Date(`${today}T12:00:00.000Z`);
}

async function createRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = createRoutineSchema.parse({
    title: formData.get("title"),
    goal: formData.get("goal") || undefined,
    description: formData.get("description") || undefined,
  });

  const routine = await db.workoutTemplate.create({
    data: {
      userId,
      title: parsed.title.trim(),
      goal: parsed.goal?.trim() || undefined,
      description: parsed.description?.trim() || undefined,
      source: "manual",
    },
  });

  redirect(`/routines/${routine.id}`);
}

async function updateRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = updateRoutineSchema.parse({
    routineId: formData.get("routineId"),
    title: formData.get("title"),
    goal: formData.get("goal") || undefined,
    description: formData.get("description") || undefined,
  });

  await verifyRoutineOwner(parsed.routineId, userId);

  await db.workoutTemplate.update({
    where: {
      id: parsed.routineId,
    },
    data: {
      title: parsed.title.trim(),
      goal: parsed.goal?.trim() || null,
      description: parsed.description?.trim() || null,
    },
  });

  revalidatePath(`/routines/${parsed.routineId}`);
  revalidatePath("/routines");
}

async function deleteRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = deleteRoutineSchema.parse({
    routineId: formData.get("routineId"),
  });

  await verifyRoutineOwner(parsed.routineId, userId);

  await db.workoutTemplate.delete({
    where: {
      id: parsed.routineId,
    },
  });

  redirect("/routines");
}

async function addExerciseToRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = addTemplateExerciseSchema.parse({
    routineId: formData.get("routineId"),
    exerciseId: formData.get("exerciseId") || undefined,
    name: formData.get("name") || undefined,
    sets: formData.get("sets") || undefined,
    reps: formData.get("reps") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await verifyRoutineOwner(parsed.routineId, userId);

  let exerciseName = parsed.name?.trim() || "";
  let exerciseId = parsed.exerciseId || null;

  if (exerciseId) {
    const libraryExercise = await db.exercise.findUnique({
      where: {
        id: exerciseId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!libraryExercise) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: "The selected exercise could not be found.",
      });
    }

    exerciseName = libraryExercise.name;
    exerciseId = libraryExercise.id;
  }

  if (!exerciseName) {
    throw new ActionError({
      code: "VALIDATION_ERROR",
      message: "Exercise name is required.",
    });
  }

  await db.$transaction(async (transaction) => {
    const highestOrder = await transaction.templateExercise.aggregate({
      where: {
        templateId: parsed.routineId,
      },
      _max: {
        order: true,
      },
    });

    await transaction.templateExercise.create({
      data: {
        templateId: parsed.routineId,
        exerciseId,
        name: exerciseName,
        sets: parsed.sets,
        reps: parsed.reps?.trim() || undefined,
        notes: parsed.notes?.trim() || undefined,
        order: (highestOrder._max.order ?? -1) + 1,
      },
    });
  });

  revalidatePath(`/routines/${parsed.routineId}`);
}

async function updateExerciseInRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = updateTemplateExerciseSchema.parse({
    routineId: formData.get("routineId"),
    templateExerciseId: formData.get("templateExerciseId"),
    sets: formData.get("sets") || undefined,
    reps: formData.get("reps") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await verifyRoutineOwner(parsed.routineId, userId);

  const updatedExercise = await db.templateExercise.updateMany({
    where: {
      id: parsed.templateExerciseId,
      templateId: parsed.routineId,
      template: {
        userId,
      },
    },
    data: {
      sets: parsed.sets,
      reps: parsed.reps?.trim() || null,
      notes: parsed.notes?.trim() || null,
    },
  });

  if (updatedExercise.count === 0) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });
  }

  revalidatePath(`/routines/${parsed.routineId}`);
}

async function deleteExerciseFromRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = deleteTemplateExerciseSchema.parse({
    routineId: formData.get("routineId"),
    templateExerciseId: formData.get("templateExerciseId"),
  });

  await verifyRoutineOwner(parsed.routineId, userId);

  await db.templateExercise.deleteMany({
    where: {
      id: parsed.templateExerciseId,
      templateId: parsed.routineId,
    },
  });

  revalidatePath(`/routines/${parsed.routineId}`);
}

async function startRoutineUnsafe(formData: FormData) {
  const userId = await requireUserId();

  const parsed = startRoutineSchema.parse({
    routineId: formData.get("routineId"),
  });

  const routine = await db.workoutTemplate.findFirst({
    where: {
      id: parsed.routineId,
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

  if (!routine) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });
  }

  const { workoutId } = await coordinateActiveWorkout({
    userId,
    createWorkout: (transaction) =>
      transaction.workout.create({
        data: {
          userId,
          title: routine.title,
          goal: routine.goal,
          notes: null,
          date: todayAtUtcNoon(),
          exercises: {
            create: routine.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
              order: exercise.order,
            })),
          },
        },
      }),
  });

  redirect(`/workouts/${workoutId}`);
}

export async function createRoutine(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "createRoutine" }, () =>
    createRoutineUnsafe(formData)
  );
}

export async function updateRoutine(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "updateRoutine" }, () =>
    updateRoutineUnsafe(formData)
  );
}

export type UpdateRoutineFormState = ActionFormState;

export async function updateRoutineWithState(
  _previousState: UpdateRoutineFormState,
  formData: FormData,
): Promise<UpdateRoutineFormState> {
  try {
    await updateRoutineUnsafe(formData);
    return createActionSuccessState("Routine updated.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "updateRoutineWithState",
      validationMessage: "Please check the routine details and try again.",
    });
  }
}

export async function deleteRoutine(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "deleteRoutine" }, () =>
    deleteRoutineUnsafe(formData)
  );
}

export async function addExerciseToRoutine(formData: FormData) {
  return runActionWithSafeErrors(
    { actionName: "addExerciseToRoutine" },
    () => addExerciseToRoutineUnsafe(formData)
  );
}

export type AddRoutineExerciseFormState = ActionFormState;

export async function addExerciseToRoutineWithState(
  _previousState: AddRoutineExerciseFormState,
  formData: FormData,
): Promise<AddRoutineExerciseFormState> {
  try {
    await addExerciseToRoutineUnsafe(formData);
    return createActionSuccessState("Exercise added to routine.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "addExerciseToRoutineWithState",
      validationMessage: "Please check the exercise details and try again.",
    });
  }
}

export async function updateExerciseInRoutine(formData: FormData) {
  return runActionWithSafeErrors(
    { actionName: "updateExerciseInRoutine" },
    () => updateExerciseInRoutineUnsafe(formData)
  );
}

export type UpdateRoutineExerciseFormState = ActionFormState;

export async function updateExerciseInRoutineWithState(
  _previousState: UpdateRoutineExerciseFormState,
  formData: FormData,
): Promise<UpdateRoutineExerciseFormState> {
  try {
    await updateExerciseInRoutineUnsafe(formData);
    return createActionSuccessState("Exercise plan updated.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "updateExerciseInRoutineWithState",
      validationMessage: "Please check the exercise plan and try again.",
    });
  }
}

export async function deleteExerciseFromRoutine(formData: FormData) {
  return runActionWithSafeErrors(
    { actionName: "deleteExerciseFromRoutine" },
    () => deleteExerciseFromRoutineUnsafe(formData)
  );
}

export async function startRoutine(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "startRoutine" }, () =>
    startRoutineUnsafe(formData)
  );
}
