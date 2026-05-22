"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";

const profileSchema = z.object({
  primaryGoal: z.string().min(1, "Primary goal is required"),
  experience: z.string().min(1, "Experience level is required"),
  trainingAge: z.string().optional(),
  availableDays: z.coerce.number().min(1).max(7),
  preferredSplit: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

export async function saveProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

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
      userId: session.user.id,
    },
    update: parsed,
    create: {
      ...parsed,
      userId: session.user.id,
    },
  });

  redirect("/dashboard");
}