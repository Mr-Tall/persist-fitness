"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const favoriteExerciseSchema = z.object({
  exerciseId: z.string().min(1),
});

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

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