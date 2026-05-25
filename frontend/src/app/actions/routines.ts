"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createRoutineSchema = z.object({
  title: z.string().min(1, "Routine title is required"),
  goal: z.string().optional(),
  description: z.string().optional(),
});

const addTemplateExerciseSchema = z.object({
  routineId: z.string().min(1),
  name: z.string().min(1, "Exercise name is required"),
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

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

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
    throw new Error("Routine not found");
  }

  return routine;
}

function todayAtUtcNoon() {
  const today = new Date().toISOString().split("T")[0];
  return new Date(`${today}T12:00:00.000Z`);
}

export async function createRoutine(formData: FormData) {
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

export async function addExerciseToRoutine(formData: FormData) {
  const userId = await requireUserId();

  const parsed = addTemplateExerciseSchema.parse({
    routineId: formData.get("routineId"),
    name: formData.get("name"),
    sets: formData.get("sets") || undefined,
    reps: formData.get("reps") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await verifyRoutineOwner(parsed.routineId, userId);

  const exerciseCount = await db.templateExercise.count({
    where: {
      templateId: parsed.routineId,
    },
  });

  await db.templateExercise.create({
    data: {
      templateId: parsed.routineId,
      name: parsed.name.trim(),
      sets: parsed.sets,
      reps: parsed.reps?.trim() || undefined,
      notes: parsed.notes?.trim() || undefined,
      order: exerciseCount,
    },
  });

  revalidatePath(`/routines/${parsed.routineId}`);
}

export async function deleteExerciseFromRoutine(formData: FormData) {
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

export async function startRoutine(formData: FormData) {
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
    throw new Error("Routine not found");
  }

  const workout = await db.workout.create({
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
  });

  redirect(`/workouts/${workout.id}`);
}