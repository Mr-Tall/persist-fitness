"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";

const createWorkoutSchema = z.object({
  title: z.string().min(1, "Workout title is required"),
  goal: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

function calendarDateToUtcNoon(dateString: string) {
  return new Date(`${dateString}T12:00:00.000Z`);
}

export async function createWorkout(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = createWorkoutSchema.parse({
    title: formData.get("title"),
    goal: formData.get("goal"),
    notes: formData.get("notes"),
    date: formData.get("date"),
  });

  const workout = await db.workout.create({
    data: {
      userId: session.user.id,
      title: parsed.title,
      goal: parsed.goal,
      notes: parsed.notes,
      date: calendarDateToUtcNoon(parsed.date),
    },
  });

  redirect(`/workouts/${workout.id}`);
}

export async function deleteWorkout(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workoutId = String(formData.get("workoutId") ?? "");

  if (!workoutId) {
    throw new Error("Workout ID is required");
  }

  await db.workout.deleteMany({
    where: {
      id: workoutId,
      userId: session.user.id,
    },
  });

  redirect("/workouts");
}