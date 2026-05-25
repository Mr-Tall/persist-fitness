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

const deleteExerciseSchema = z.object({
  workoutId: z.string().min(1),
  workoutExerciseId: z.string().min(1),
});

const deleteSetSchema = z.object({
  workoutId: z.string().min(1),
  workoutSetId: z.string().min(1),
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

export async function addExerciseToWorkout(formData: FormData) {
  const userId = await requireUserId();

  const parsed = addExerciseSchema.parse({
    workoutId: formData.get("workoutId"),
    name: formData.get("name"),
  });

  await verifyWorkoutOwner(parsed.workoutId, userId);

  const exerciseCount = await db.workoutExercise.count({
    where: {
      workoutId: parsed.workoutId,
    },
  });

  await db.workoutExercise.create({
    data: {
      workoutId: parsed.workoutId,
      name: parsed.name.trim(),
      order: exerciseCount,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);
}

export async function addSetToExercise(formData: FormData) {
  const userId = await requireUserId();

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
      tempo: parsed.tempo?.trim() || undefined,
      notes: parsed.notes?.trim() || undefined,
    },
  });

  revalidatePath(`/workouts/${parsed.workoutId}`);
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
      setNumber: true,
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