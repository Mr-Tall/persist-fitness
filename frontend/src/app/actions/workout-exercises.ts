"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifyWorkoutOwner } from "@/lib/auth/workout-access";
import {
  createActionErrorState,
  createActionSuccessState,
  type ActionFormState,
} from "@/lib/actions/action-result";
import { ActionError, toActionErrorState } from "@/lib/actions/action-error";
import {
  addExerciseSchema,
  addSetSchema,
  deleteExerciseSchema,
  deleteSetSchema,
  updateSetSchema,
} from "@/lib/validation/workout";

export type AddExerciseFormState = ActionFormState;
export type AddSetFormState = ActionFormState;
export type UpdateSetFormState = ActionFormState;

async function createWorkoutExerciseFromFormData(
  userId: string,
  formData: FormData
) {
  const parsed = addExerciseSchema.parse({
    workoutId: formData.get("workoutId"),
    exerciseId: formData.get("exerciseId"),
    name: formData.get("name"),
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  let exerciseName = parsed.name ?? "";
  let exerciseId = parsed.exerciseId ?? null;

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
    return {
      status: "error" as const,
      message: "Select an exercise or type a custom exercise name.",
      workoutId: parsed.workoutId,
      exerciseName: null,
    };
  }

  await db.$transaction(async (transaction) => {
    const existingOrder = await transaction.workoutExercise.aggregate({
      where: {
        workoutId: parsed.workoutId,
      },
      _max: {
        order: true,
      },
    });

    await transaction.workoutExercise.create({
      data: {
        workoutId: parsed.workoutId,
        exerciseId,
        name: exerciseName,
        order: (existingOrder._max.order ?? -1) + 1,
      },
    });
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);

  return {
    status: "success" as const,
    message: `Added ${exerciseName}.`,
    workoutId: parsed.workoutId,
    exerciseName,
  };
}

async function createWorkoutSetFromFormData(userId: string, formData: FormData) {
  const parsed = addSetSchema.parse({
    workoutId: formData.get("workoutId"),
    workoutExerciseId: formData.get("workoutExerciseId"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    rir: formData.get("rir"),
    tempo: formData.get("tempo"),
    notes: formData.get("notes"),
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  const hasSetData =
    parsed.reps !== undefined ||
    parsed.weight !== undefined ||
    parsed.rir !== undefined ||
    parsed.tempo !== undefined ||
    parsed.notes !== undefined;

  if (!hasSetData) {
    return {
      status: "error" as const,
      message: "Enter reps, weight, effort, tempo, or notes before saving a set.",
      workoutId: parsed.workoutId,
      setNumber: null,
    };
  }

  const workoutExercise = await db.workoutExercise.findFirst({
    where: {
      id: parsed.workoutExerciseId,
      workoutId: parsed.workoutId,
    },
    include: {
      sets: true,
    },
  });

  if (!workoutExercise) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  }

  const setNumber = workoutExercise.sets.length + 1;

  await db.workoutSet.create({
    data: {
      workoutExerciseId: parsed.workoutExerciseId,
      setNumber,
      reps: parsed.reps,
      weight: parsed.weight,
      rir: parsed.rir,
      tempo: parsed.tempo,
      notes: parsed.notes,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);

  return {
    status: "success" as const,
    message: `Saved set ${setNumber}.`,
    workoutId: parsed.workoutId,
    setNumber,
  };
}

async function updateWorkoutSetFromFormData(userId: string, formData: FormData) {
  const parsed = updateSetSchema.parse({
    workoutId: formData.get("workoutId"),
    workoutSetId: formData.get("workoutSetId"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    rir: formData.get("rir"),
    tempo: formData.get("tempo"),
    notes: formData.get("notes"),
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  const hasSetData =
    parsed.reps !== undefined ||
    parsed.weight !== undefined ||
    parsed.rir !== undefined ||
    parsed.tempo !== undefined ||
    parsed.notes !== undefined;

  if (!hasSetData) {
    return {
      status: "error" as const,
      message: "Keep at least one value on the set before saving changes.",
      workoutId: parsed.workoutId,
      setNumber: null,
    };
  }

  const set = await db.workoutSet.findFirst({
    where: {
      id: parsed.workoutSetId,
      workoutExercise: {
        workoutId: parsed.workoutId,
      },
    },
    select: {
      id: true,
      setNumber: true,
    },
  });

  if (!set) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  }

  await db.workoutSet.update({
    where: {
      id: parsed.workoutSetId,
    },
    data: {
      reps: parsed.reps,
      weight: parsed.weight,
      rir: parsed.rir,
      tempo: parsed.tempo ?? null,
      notes: parsed.notes ?? null,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);

  return {
    status: "success" as const,
    message: `Updated set ${set.setNumber}.`,
    workoutId: parsed.workoutId,
    setNumber: set.setNumber,
  };
}

export async function addExerciseToWorkout(formData: FormData) {
  const userId = await requireUserId();
  await createWorkoutExerciseFromFormData(userId, formData);
}

export async function addExerciseToWorkoutWithState(
  _previousState: AddExerciseFormState,
  formData: FormData
): Promise<AddExerciseFormState> {
  const userId = await requireUserId();

  try {
    const result = await createWorkoutExerciseFromFormData(userId, formData);

    return result.status === "success"
      ? createActionSuccessState(result.message)
      : createActionErrorState({
          code: "VALIDATION_ERROR",
          message: result.message,
        });
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "addExerciseToWorkoutWithState",
      validationMessage: "Please check the form and try again.",
    });
  }
}

export async function addSetToExercise(formData: FormData) {
  const userId = await requireUserId();
  await createWorkoutSetFromFormData(userId, formData);
}

export async function addSetToExerciseWithState(
  _previousState: AddSetFormState,
  formData: FormData
): Promise<AddSetFormState> {
  const userId = await requireUserId();

  try {
    const result = await createWorkoutSetFromFormData(userId, formData);

    return result.status === "success"
      ? createActionSuccessState(result.message)
      : createActionErrorState({
          code: "VALIDATION_ERROR",
          message: result.message,
        });
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "addSetToExerciseWithState",
      validationMessage: "Please check the form and try again.",
    });
  }
}

export async function deleteExerciseFromWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = deleteExerciseSchema.parse({
    workoutId: formData.get("workoutId"),
    workoutExerciseId: formData.get("workoutExerciseId"),
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  await db.workoutExercise.deleteMany({
    where: {
      id: parsed.workoutExerciseId,
      workoutId: parsed.workoutId,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);
}

export async function deleteSetFromExercise(formData: FormData) {
  const userId = await requireUserId();

  const parsed = deleteSetSchema.parse({
    workoutId: formData.get("workoutId"),
    workoutSetId: formData.get("workoutSetId"),
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  await db.$transaction(async (transaction) => {
    const set = await transaction.workoutSet.findFirst({
      where: {
        id: parsed.workoutSetId,
        workoutExercise: {
          workoutId: parsed.workoutId,
        },
      },
      select: {
        id: true,
        workoutExerciseId: true,
        setNumber: true,
      },
    });

    if (!set) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: "The requested workout item could not be found.",
      });
    }

    await transaction.workoutSet.delete({
      where: {
        id: set.id,
      },
    });

    await transaction.workoutSet.updateMany({
      where: {
        workoutExerciseId: set.workoutExerciseId,
        setNumber: {
          gt: set.setNumber,
        },
      },
      data: {
        setNumber: {
          decrement: 1,
        },
      },
    });
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);
}

export async function updateSetInExercise(formData: FormData) {
  const userId = await requireUserId();
  await updateWorkoutSetFromFormData(userId, formData);
}

export async function updateSetInExerciseWithState(
  _previousState: UpdateSetFormState,
  formData: FormData
): Promise<UpdateSetFormState> {
  const userId = await requireUserId();

  try {
    const result = await updateWorkoutSetFromFormData(userId, formData);

    return result.status === "success"
      ? createActionSuccessState(result.message)
      : createActionErrorState({
          code: "VALIDATION_ERROR",
          message: result.message,
        });
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "updateSetInExerciseWithState",
      validationMessage: "Please check the form and try again.",
    });
  }
}
