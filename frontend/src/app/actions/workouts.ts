"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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

function calendarDateToUtcNoon(dateString: string) {
  return new Date(`${dateString}T12:00:00.000Z`);
}

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
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
    },
  });

  redirect(`/workouts/${workout.id}`);
}

export async function updateWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = updateWorkoutSchema.parse({
    workoutId: formData.get("workoutId"),
    title: formData.get("title"),
    goal: formData.get("goal") || undefined,
    notes: formData.get("notes") || undefined,
    date: formData.get("date"),
  });

  const updatedWorkout = await db.workout.updateMany({
    where: {
      id: parsed.workoutId,
      userId,
    },
    data: {
      title: parsed.title.trim(),
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
}

export async function deleteWorkout(formData: FormData) {
  const userId = await requireUserId();

  const workoutId = String(formData.get("workoutId") ?? "");

  if (!workoutId) {
    throw new Error("Workout ID is required");
  }

  await db.workout.deleteMany({
    where: {
      id: workoutId,
      userId,
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

  const today = new Date().toISOString().split("T")[0];

  const newWorkout = await db.workout.create({
    data: {
      userId,
      title: originalWorkout.title,
      goal: originalWorkout.goal,
      notes: null,
      date: new Date(`${today}T12:00:00.000Z`),
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