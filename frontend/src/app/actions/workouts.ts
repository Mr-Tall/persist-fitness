"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyWorkoutOwner } from "@/lib/auth/workout-access";

export type UpdateWorkoutFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number | null;
};

const createWorkoutSchema = z.object({
  title: z.string().min(1, "Workout title is required"),
  goal: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

const updateWorkoutSchema = z.object({
  workoutId: z.string().min(1, "Workout ID is required"),
  title: z.string().min(1, "Workout title is required"),
  goal: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

const workoutIdSchema = z.object({
  workoutId: z.string().min(1, "Workout ID is required"),
});

function calendarDateToUtcNoon(dateString: string) {
  return new Date(`${dateString}T12:00:00.000Z`);
}

function todayAtUtcNoon() {
  const today = new Date().toISOString().split("T")[0];
  return new Date(`${today}T12:00:00.000Z`);
}

function getSafeWorkoutActionMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Please check the form and try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function updateWorkoutFromFormData(userId: string, formData: FormData) {
  const parsed = updateWorkoutSchema.parse({
    workoutId: formData.get("workoutId"),
    title: formData.get("title"),
    goal: formData.get("goal") || undefined,
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
  });

  const title = parsed.title.trim();

  if (!title) {
    return {
      status: "error" as const,
      message: "Workout title is required.",
      workoutId: parsed.workoutId,
    };
  }

  const updatedWorkout = await db.workout.updateMany({
    where: {
      id: parsed.workoutId,
      userId,
    },
    data: {
      title,
      goal: parsed.goal?.trim() || null,
      notes: parsed.notes?.trim() || null,
      date: calendarDateToUtcNoon(parsed.date),
    },
  });

  if (updatedWorkout.count === 0) {
    throw new Error("Workout not found");
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
    goal: formData.get("goal") || undefined,
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
  });

  const workout = await db.workout.create({
    data: {
      userId,
      title: parsed.title.trim(),
      goal: parsed.goal?.trim() || null,
      notes: parsed.notes?.trim() || null,
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

    return {
      status: result.status,
      message: result.message,
      submittedAt: Date.now(),
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeWorkoutActionMessage(error),
      submittedAt: Date.now(),
    };
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
    throw new Error("Workout not found");
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
    throw new Error("Workout not found");
  }

  revalidatePath(`/workouts/${parsed.workoutId}`);
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}

export async function deleteWorkout(formData: FormData) {
  const userId = await requireUserId();

  const workoutId = String(formData.get("workoutId") ?? "");

  if (!workoutId) {
    throw new Error("Workout ID is required");
  }

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

  const workoutId = String(formData.get("workoutId") ?? "");

  if (!workoutId) {
    throw new Error("Workout ID is required");
  }

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
    throw new Error("Workout not found");
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