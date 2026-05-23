"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const addExerciseSchema = z.object({
  workoutId: z.string().min(1),
  name: z.string().min(1, "Exercise name is required"),
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

export async function addExerciseToWorkout(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = addExerciseSchema.parse({
    workoutId: formData.get("workoutId"),
    name: formData.get("name"),
  });

  await verifyWorkoutOwner(parsed.workoutId, session.user.id);

  const exerciseCount = await db.workoutExercise.count({
    where: {
      workoutId: parsed.workoutId,
    },
  });

  await db.workoutExercise.create({
    data: {
      workoutId: parsed.workoutId,
      name: parsed.name,
      order: exerciseCount,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);
}

export async function addSetToExercise(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = addSetSchema.parse({
    workoutId: formData.get("workoutId"),
    workoutExerciseId: formData.get("workoutExerciseId"),
    reps: formData.get("reps") || undefined,
    weight: formData.get("weight") || undefined,
    rir: formData.get("rir") || undefined,
    tempo: formData.get("tempo") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await verifyWorkoutOwner(parsed.workoutId, session.user.id);

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

  await db.workoutSet.create({
    data: {
      workoutExerciseId: parsed.workoutExerciseId,
      setNumber: workoutExercise.sets.length + 1,
      reps: parsed.reps,
      weight: parsed.weight,
      rir: parsed.rir,
      tempo: parsed.tempo,
      notes: parsed.notes,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);
}