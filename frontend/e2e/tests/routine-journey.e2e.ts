import { test, expect } from "../fixtures/authenticated-test";
import {
  chooseExercise,
  createRoutine,
  openAddExercise,
  openDialog,
} from "../support/journeys";

test("creates, populates, edits, and deletes a routine", async ({
  authenticatedPage: page,
  testUser,
}) => {
  const routineTitle = `E2E Routine ${testUser.id.slice(-8)}`;
  const updatedTitle = `${routineTitle} Updated`;
  await createRoutine(page, routineTitle);

  await expect(
    page.getByRole("heading", { name: routineTitle }),
  ).toBeVisible();

  await openAddExercise(page);
  await chooseExercise(page, testUser.exerciseName);
  await page.getByLabel("Sets").fill("3");
  await page.getByLabel("Reps").fill("8-10");
  await page.getByRole("button", { name: "Add exercise" }).click();
  await expect(
    page.getByRole("list", { name: "Planned exercises" }),
  ).toContainText(testUser.exerciseName);

  const editTrigger = page.getByRole("button", {
    name: `Edit ${routineTitle} routine`,
  });
  const { dialog } = await openDialog(
    page,
    `Edit ${routineTitle} routine`,
    "Edit routine",
  );
  await expect(dialog.getByLabel("Routine name")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(editTrigger).toBeFocused();

  const reopened = await openDialog(
    page,
    `Edit ${routineTitle} routine`,
    "Edit routine",
  );
  await reopened.dialog.getByLabel("Routine name").fill(updatedTitle);
  await reopened.dialog.getByLabel("Description").fill("Updated by Playwright");
  await reopened.dialog.getByRole("button", { name: "Save routine" }).click();
  await expect(reopened.dialog).toBeHidden();
  await expect(
    page.getByRole("heading", { name: updatedTitle }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: updatedTitle }),
  ).toBeVisible();
  await expect(page.getByText("Updated by Playwright")).toBeVisible();

  page.once("dialog", (confirmation) => confirmation.accept());
  await page
    .getByRole("button", { name: `Delete ${updatedTitle} routine` })
    .click();
  await expect(page).toHaveURL(/\/routines$/);
  await expect(page.getByText(updatedTitle)).toHaveCount(0);
});
