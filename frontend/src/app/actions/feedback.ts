"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { requireAdminUser } from "@/lib/auth/admin";
import { toActionErrorState } from "@/lib/actions/action-error";
import { createActionErrorState, createActionSuccessState, type ActionFormState } from "@/lib/actions/action-result";
import { feedbackCategories, feedbackStatuses, normalizeFeedbackRoute, normalizePlatform, normalizeUserAgentSummary, releaseEnvironment, releaseVersion } from "@/lib/feedback/metadata";
import { createFeedbackScreenshotUrl, deleteFeedbackScreenshot, uploadFeedbackScreenshot } from "@/lib/feedback/storage";
import { validateScreenshot } from "@/lib/feedback/storage-validation";

const schema = z.object({
  category: z.enum(feedbackCategories),
  message: z.string().trim().min(10, "Tell us a little more so we can investigate.").max(2000),
  route: z.string().trim().startsWith("/").max(300),
  errorReference: z.string().trim().regex(/^[A-Za-z0-9_-]{1,32}$/).optional(),
  conflictCategory: z.enum(["workout_finished", "set_deleted", "exercise_deleted", "tracking_changed", "unknown"]).optional(),
});

export type FeedbackFormState = ActionFormState & { feedbackId?: string; screenshotAttached?: boolean; submittedCategory?: "bug" | "feature_request" | "general" };

export async function submitFeedback(
  _previous: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  let screenshotPath: string | null = null;
  try {
    const userId = await requireUserId();
    const parsed = schema.parse({
      category: formData.get("category"), message: formData.get("message"),
      route: formData.get("route"), errorReference: formData.get("errorReference") || undefined,
      conflictCategory: formData.get("conflictCategory") || undefined,
    });
    const recent = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS "count" FROM "Feedback"
      WHERE "userId" = ${userId} AND "createdAt" > NOW() - INTERVAL '10 minutes'
    `;
    if (Number(recent[0]?.count ?? 0) >= 5) {
      return { status: "error", code: "RATE_LIMITED", message: "Please wait before sending more feedback.", submittedAt: Date.now() };
    }
    const screenshot = formData.get("screenshot");
    if (screenshot instanceof File && screenshot.size > 0) {
      validateScreenshot(screenshot);
      screenshotPath = await uploadFeedbackScreenshot(screenshot, userId);
    }
    const requestHeaders = await headers();
    const userAgent = requestHeaders.get("user-agent") ?? "";
    const id = randomUUID();
    try {
      await db.$executeRaw`
        INSERT INTO "Feedback" ("id", "userId", "category", "message", "status", "route", "appVersion", "environment", "platform", "userAgentSummary", "errorReference", "conflictCategory", "screenshotPath", "createdAt", "updatedAt")
        VALUES (${id}, ${userId}, ${parsed.category}, ${parsed.message}, 'new', ${normalizeFeedbackRoute(parsed.route)}, ${releaseVersion()}, ${releaseEnvironment()}, ${normalizePlatform(userAgent)}, ${normalizeUserAgentSummary(userAgent)}, ${parsed.errorReference ?? null}, ${parsed.conflictCategory ?? null}, ${screenshotPath}, NOW(), NOW())
      `;
    } catch (error) {
      if (screenshotPath) {
        await deleteFeedbackScreenshot(screenshotPath).catch(() => undefined);
        screenshotPath = null;
      }
      throw error;
    }
    return { ...createActionSuccessState("Thanks — your feedback was sent."), feedbackId: id, screenshotAttached: Boolean(screenshotPath), submittedCategory: parsed.category };
  } catch (error) {
    if (screenshotPath) await deleteFeedbackScreenshot(screenshotPath).catch(() => undefined);
    if (
      error instanceof Error &&
      (error.message.startsWith("Screenshot must") ||
        error.message.startsWith("Screenshot file extension") ||
        error.message === "Screenshot uploads are not configured.")
    ) {
      return createActionErrorState({
        code: "VALIDATION_ERROR",
        message: error.message,
        fieldErrors: { screenshot: [error.message] },
      });
    }
    return toActionErrorState(error, { actionName: "submitFeedback" });
  }
}

export async function updateFeedbackStatus(formData: FormData) {
  await requireAdminUser();
  const id = z.string().uuid().parse(formData.get("feedbackId"));
  const status = z.enum(feedbackStatuses).parse(formData.get("status"));
  await db.$executeRaw`UPDATE "Feedback" SET "status" = ${status}, "updatedAt" = NOW() WHERE "id" = ${id}`;
  revalidatePath("/admin/feedback");
}

export async function deleteFeedback(formData: FormData) {
  await requireAdminUser();
  const id = z.string().uuid().parse(formData.get("feedbackId"));
  const rows = await db.$queryRaw<Array<{ screenshotPath: string | null }>>`SELECT "screenshotPath" FROM "Feedback" WHERE "id" = ${id} LIMIT 1`;
  if (rows[0]?.screenshotPath) await deleteFeedbackScreenshot(rows[0].screenshotPath);
  await db.$executeRaw`DELETE FROM "Feedback" WHERE "id" = ${id}`;
  revalidatePath("/admin/feedback");
}

export async function getSignedFeedbackScreenshot(feedbackId: string) {
  await requireAdminUser();
  const id = z.string().uuid().parse(feedbackId);
  const rows = await db.$queryRaw<Array<{ screenshotPath: string | null }>>`SELECT "screenshotPath" FROM "Feedback" WHERE "id" = ${id} LIMIT 1`;
  return rows[0]?.screenshotPath ? createFeedbackScreenshotUrl(rows[0].screenshotPath) : null;
}
