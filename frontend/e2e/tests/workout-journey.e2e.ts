import { test, expect } from "../fixtures/authenticated-test";
import {
  chooseExercise,
  createWorkout,
  openAddExercise,
  openDialog,
} from "../support/journeys";

test("creates, logs, edits, and completes a workout", async ({
  authenticatedPage: page,
  testUser,
}, testInfo) => {
  const workoutTitle = `E2E Strength ${testUser.id.slice(-8)}`;
  await createWorkout(page, workoutTitle);

  await expect(
    page.getByRole("heading", { name: workoutTitle }),
  ).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await expect(
      page.getByRole("complementary", { name: "Workout controls" }),
    ).toBeVisible();
  }

  await openAddExercise(page);
  await chooseExercise(page, testUser.exerciseName);
  await page.getByRole("button", { name: "Add exercise" }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(testUser.exerciseName, "i") }),
  ).toBeVisible();

  await page.getByLabel("Weight").fill("135");
  await page.getByLabel("Reps").fill("8");
  await page.getByLabel("RIR").fill("2");
  await page.getByRole("button", { name: "Save set" }).click();

  const setRow = page.getByRole("article", { name: "Set 1" });
  await expect(setRow).toBeVisible();
  await expect(setRow).toHaveAccessibleName("Set 1");
  await expect(setRow.getByLabel("135 pounds by 8 reps")).toBeVisible();

  const editTrigger = page.getByRole("button", { name: "Edit set 1" });
  const { dialog } = await openDialog(page, "Edit set 1", "Edit set 1");
  await expect(dialog.getByLabel("Weight")).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(editTrigger).toBeFocused();

  const reopened = await openDialog(page, "Edit set 1", "Edit set 1");
  await reopened.dialog.getByLabel("Weight").fill("140");
  await reopened.dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(reopened.dialog).toBeHidden();
  await expect(setRow.getByLabel("140 pounds by 8 reps")).toBeVisible();

  await page.getByRole("button", { name: "Finish workout" }).first().click();
  await expect(
    page.getByText(
      "Completed workout. Logging controls are unavailable until reopened.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Save set" })).toHaveCount(0);

  await page.reload();
  await expect(setRow.getByLabel("140 pounds by 8 reps")).toBeVisible();
  await expect(page.getByText("Workout complete")).toBeVisible();
});
