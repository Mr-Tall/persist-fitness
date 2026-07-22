"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, toActionErrorState } from "@/lib/actions/action-error";
import { createActionSuccessState, type ActionFormState } from "@/lib/actions/action-result";
import { requireUserId, requireUserSession } from "@/lib/auth/require-user";
import { findCurrentSessionId } from "@/lib/auth/session-management";
import { db } from "@/lib/db";
import { deleteFeedbackScreenshot } from "@/lib/feedback/storage";
import { ACCOUNT_CLEANUP_COOKIE } from "@/lib/account/constants";

const sessionSchema = z.object({ sessionId: z.string().min(1).max(64) });
const deletionSchema = z.object({
  confirmation: z.literal("DELETE", {
    error: "Type DELETE to confirm account deletion.",
  }),
});

export type AccountActionState = ActionFormState;

export async function revokeSessionWithState(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const session = await requireUserSession();
    const { sessionId } = sessionSchema.parse({ sessionId: formData.get("sessionId") });
    const currentId = await findCurrentSessionId(session.user.id, session.expires);
    if (!currentId) {
      throw new ActionError({
        code: "CONFLICT",
        message: "Your current session could not be verified. Sign in again before managing devices.",
      });
    }
    if (sessionId === currentId) {
      throw new ActionError({
        code: "CONFLICT",
        message: "Use the main sign-out action to end this device's session.",
      });
    }
    const result = await db.session.deleteMany({
      where: { id: sessionId, userId: session.user.id },
    });
    if (result.count === 0) {
      throw new ActionError({
        code: "NOT_FOUND",
        message: "That session is no longer active.",
      });
    }
    revalidatePath("/settings");
    return createActionSuccessState("Device signed out.");
  } catch (error) {
    return toActionErrorState(error, { actionName: "revokeSessionWithState" });
  }
}

export async function signOutOtherSessionsWithState(
  previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void previous;
  void formData;
  try {
    const session = await requireUserSession();
    const currentId = await findCurrentSessionId(session.user.id, session.expires);
    if (!currentId) {
      throw new ActionError({
        code: "CONFLICT",
        message: "Your current session could not be verified. Sign in again before managing devices.",
      });
    }
    const result = await db.session.deleteMany({
      where: { userId: session.user.id, id: { not: currentId } },
    });
    revalidatePath("/settings");
    return createActionSuccessState(
      result.count === 0 ? "No other active sessions found." : "Other devices signed out.",
    );
  } catch (error) {
    return toActionErrorState(error, { actionName: "signOutOtherSessionsWithState" });
  }
}

export async function deleteAccountWithState(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const userId = await requireUserId();
    deletionSchema.parse({ confirmation: formData.get("confirmation") });

    const externalProgramEnrollments = await db.programEnrollment.count({
      where: { userId: { not: userId }, program: { ownerId: userId } },
    });
    if (externalProgramEnrollments > 0) {
      throw new ActionError({
        code: "CONFLICT",
        message: "This account owns a shared program. Contact support to transfer it before deletion.",
      });
    }

    const screenshots = await db.feedback.findMany({
      where: { userId, screenshotPath: { not: null } },
      select: { screenshotPath: true },
    });
    await Promise.all(
      screenshots.flatMap((item) =>
        item.screenshotPath ? [deleteFeedbackScreenshot(item.screenshotPath)] : [],
      ),
    );

    await db.user.delete({ where: { id: userId } });

    try {
      const cookieStore = await cookies();
      cookieStore.set(ACCOUNT_CLEANUP_COOKIE, "1", {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    } catch {
      // The client also performs cleanup immediately after confirmed deletion.
    }

    return createActionSuccessState("Account deleted.");
  } catch (error) {
    return toActionErrorState(error, {
      actionName: "deleteAccountWithState",
      validationMessage: "Type DELETE to confirm account deletion.",
    });
  }
}
