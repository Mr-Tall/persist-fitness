"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  runActionWithSafeErrors,
  toActionErrorState,
} from "@/lib/actions/action-error";
import {
  createActionSuccessState,
  type ActionFormState,
} from "@/lib/actions/action-result";

const profileSchema = z.object({
  primaryGoal: z.string().min(1, "Primary goal is required"),
  experience: z.string().min(1, "Experience level is required"),
  trainingAge: z.string().optional(),
  availableDays: z.coerce.number().min(1).max(7),
  preferredSplit: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

async function persistProfile(formData: FormData) {
  const userId = await requireUserId();

  const equipment = formData.getAll("equipment").map(String);

  const parsed = profileSchema.parse({
    primaryGoal: formData.get("primaryGoal"),
    experience: formData.get("experience"),
    trainingAge: formData.get("trainingAge"),
    availableDays: formData.get("availableDays"),
    preferredSplit: formData.get("preferredSplit"),
    equipment,
  });

  await db.profile.upsert({
    where: {
      userId,
    },
    update: parsed,
    create: {
      ...parsed,
      userId,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

async function saveProfileUnsafe(formData: FormData) {
  await persistProfile(formData);

  redirect("/dashboard");
}

export async function saveProfile(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "saveProfile" }, () =>
    saveProfileUnsafe(formData)
  );
}

export type SaveProfileFormState = ActionFormState;

export async function saveProfileWithState(
  _previousState: SaveProfileFormState,
  formData: FormData,
): Promise<SaveProfileFormState> {
  try {
    await persistProfile(formData);
    return createActionSuccessState("Profile saved.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "saveProfileWithState",
      validationMessage: "Please check your profile details and try again.",
    });
  }
}
