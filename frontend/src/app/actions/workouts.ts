"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";

const createWorkoutSchema = z.object({
  title: z.string().min(1, "Workout title is required"),
  goal: z.string().optional(),
  notes: z.string().optional(),
  date: z.coerce.date(),
});

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
      date: parsed.date,
    },
  });

  redirect(`/workouts/${workout.id}`);
}