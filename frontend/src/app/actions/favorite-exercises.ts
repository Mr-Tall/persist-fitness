"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ActionError,
  runActionWithSafeErrors,
} from "@/lib/actions/action-error";

const favoriteExerciseSchema = z.object({
  exerciseId: z.string().min(1),
});

function mapFavoriteMutationError(error: unknown) {
  const prismaCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;

  if (prismaCode === "P2002") {
    return new ActionError({
      code: "CONFLICT",
      message: "The favorite changed at the same time. Please try again.",
    });
  }

  if (prismaCode === "P2003") {
    return new ActionError({
      code: "NOT_FOUND",
      message: "The selected exercise could not be found.",
    });
  }

  return error;
}

async function toggleFavoriteExerciseUnsafe(formData: FormData) {
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

export async function toggleFavoriteExercise(formData: FormData) {
  return runActionWithSafeErrors(
    {
      actionName: "toggleFavoriteExercise",
      mapError: mapFavoriteMutationError,
    },
    () => toggleFavoriteExerciseUnsafe(formData)
  );
}
