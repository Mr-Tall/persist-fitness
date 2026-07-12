"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const favoriteExerciseSchema = z.object({
  exerciseId: z.string().min(1),
});

export async function toggleFavoriteExercise(formData: FormData) {
  const userId = await requireUserId();

  const parsed = favoriteExerciseSchema.parse({
    exerciseId: formData.get("exerciseId"),
  });

  const existing = await db.favoriteExercise.findUnique({
    where: {
      userId_exerciseId: {
        userId,
        exerciseId: parsed.exerciseId,
      },
    },
  });

  if (existing) {
    await db.favoriteExercise.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    await db.favoriteExercise.create({
      data: {
        userId,
        exerciseId: parsed.exerciseId,
      },
    });
  }

  revalidatePath("/exercises");
}
