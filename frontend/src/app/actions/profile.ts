"use server";

import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { runActionWithSafeErrors } from "@/lib/actions/action-error";

const profileSchema = z.object({
  primaryGoal: z.string().min(1, "Primary goal is required"),
  experience: z.string().min(1, "Experience level is required"),
  trainingAge: z.string().optional(),
  availableDays: z.coerce.number().min(1).max(7),
  preferredSplit: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

async function saveProfileUnsafe(formData: FormData) {
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

  redirect("/dashboard");
}

export async function saveProfile(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "saveProfile" }, () =>
    saveProfileUnsafe(formData)
  );
}
