"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toActionErrorState } from "@/lib/actions/action-error";
import {
  createActionSuccessState,
  type ActionFormState,
} from "@/lib/actions/action-result";
import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";

const onboardingGoalSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["Build muscle", "Get stronger", "General fitness"]).optional(),
);

const onboardingSchema = z.object({
  goal: onboardingGoalSchema,
});

export type OnboardingFormState = ActionFormState;

export async function completeOnboarding(
  _previousState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  try {
    const userId = await requireUserId();
    const parsed = onboardingSchema.parse({
      goal: formData.get("goal"),
    });

    await db.$transaction(async (transaction) => {
      if (parsed.goal) {
        await transaction.profile.upsert({
          where: { userId },
          update: { primaryGoal: parsed.goal },
          create: {
            userId,
            primaryGoal: parsed.goal,
            equipment: [],
          },
        });
      }

      await transaction.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: new Date() },
      });
    });

    revalidatePath("/dashboard");
    return createActionSuccessState("Welcome to Persist Fitness.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "completeOnboarding",
      validationMessage: "Choose a listed goal or skip this step.",
    });
  }
}
