"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AddExerciseFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number | null;
};

export type AddSetFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number | null;
};

export type UpdateSetFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number | null;
};

const addExerciseSchema = z.object({
  workoutId: z.string().min(1),
  exerciseId: z.string().optional(),
  name: z.string().optional(),
});

const addSetSchema = z.object({
  workoutId: z.string().min(1),
  workoutExerciseId: z.string().min(1),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  rir: z.coerce.number().int().min(0).max(10).optional(),
  tempo: z.string().optional(),
  notes: z.string().optional(),
});

const deleteExerciseSchema = z.object({
  workoutId: z.string().min(1),
  workoutExerciseId: z.string().min(1),
});

const deleteSetSchema = z.object({
  workoutId: z.string().min(1),
  workoutSetId: z.string().min(1),
});

const updateSetSchema = z.object({
  workoutId: z.string().min(1),
  workoutSetId: z.string().min(1),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  rir: z.coerce.number().int().min(0).max(10).optional(),
  tempo: z.string().optional(),
  notes: z.string().optional(),
});

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

async function verifyWorkoutOwner(workoutId: string, userId: string) {
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

function getSafeActionMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return "Please check the form and try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function createWorkoutExerciseFromFormData(
  userId: string,
  formData: FormData
) {
  const parsed = addExerciseSchema.parse({
    workoutId: formData.get("workoutId"),
    exerciseId: formData.get("exerciseId") || undefined,
    name: formData.get("name") || undefined,
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

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
      throw new Error("Selected exercise not found");
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

  const exerciseCount = await db.workoutExercise.count({
    where: {
      workoutId: parsed.workoutId,
    },
  });

  await db.workoutExercise.create({
    data: {
      workoutId: parsed.workoutId,
      exerciseId,
      name: exerciseName,
      order: exerciseCount,
    },
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
    reps: formData.get("reps") || undefined,
    weight: formData.get("weight") || undefined,
    rir: formData.get("rir") || undefined,
    tempo: formData.get("tempo") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  const hasSetData =
    parsed.reps !== undefined ||
    parsed.weight !== undefined ||
    parsed.rir !== undefined ||
    Boolean(parsed.tempo?.trim()) ||
    Boolean(parsed.notes?.trim());

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
    throw new Error("Exercise not found in workout");
  }

  const setNumber = workoutExercise.sets.length + 1;

  await db.workoutSet.create({
    data: {
      workoutExerciseId: parsed.workoutExerciseId,
      setNumber,
      reps: parsed.reps,
      weight: parsed.weight,
      rir: parsed.rir,
      tempo: parsed.tempo?.trim() || undefined,
      notes: parsed.notes?.trim() || undefined,
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
    reps: formData.get("reps") || undefined,
    weight: formData.get("weight") || undefined,
    rir: formData.get("rir") || undefined,
    tempo: formData.get("tempo") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  const hasSetData =
    parsed.reps !== undefined ||
    parsed.weight !== undefined ||
    parsed.rir !== undefined ||
    Boolean(parsed.tempo?.trim()) ||
    Boolean(parsed.notes?.trim());

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
    throw new Error("Set not found");
  }

  await db.workoutSet.update({
    where: {
      id: parsed.workoutSetId,
    },
    data: {
      reps: parsed.reps,
      weight: parsed.weight,
      rir: parsed.rir,
      tempo: parsed.tempo?.trim() || null,
      notes: parsed.notes?.trim() || null,
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

    return {
      status: result.status,
      message: result.message,
      submittedAt: Date.now(),
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeActionMessage(error),
      submittedAt: Date.now(),
    };
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

    return {
      status: result.status,
      message: result.message,
      submittedAt: Date.now(),
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeActionMessage(error),
      submittedAt: Date.now(),
    };
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

  const set = await db.workoutSet.findFirst({
    where: {
      id: parsed.workoutSetId,
      workoutExercise: {
        workoutId: parsed.workoutId,
      },
    },
    select: {
      id: true,
      workoutExerciseId: true,
    },
  });

  if (!set) {
    throw new Error("Set not found");
  }

  await db.workoutSet.delete({
    where: {
      id: set.id,
    },
  });

  const remainingSets = await db.workoutSet.findMany({
    where: {
      workoutExerciseId: set.workoutExerciseId,
    },
    orderBy: {
      setNumber: "asc",
    },
  });

  await Promise.all(
    remainingSets.map((remainingSet, index) =>
      db.workoutSet.update({
        where: {
          id: remainingSet.id,
        },
        data: {
          setNumber: index + 1,
        },
      })
    )
  );

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

    return {
      status: result.status,
      message: result.message,
      submittedAt: Date.now(),
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeActionMessage(error),
      submittedAt: Date.now(),
    };
  }
}