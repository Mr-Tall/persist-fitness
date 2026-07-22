import { expect, type Locator, type Page } from "@playwright/test";

export async function submitAndWaitForPath(
  page: Page,
  action: () => Promise<void>,
  pathPattern: RegExp,
) {
  await Promise.all([page.waitForURL(pathPattern), action()]);
}

export async function openDialog(
  page: Page,
  triggerName: string | RegExp,
  dialogName: string | RegExp,
): Promise<{ dialog: Locator; trigger: Locator }> {
  const trigger = page.getByRole("button", { name: triggerName });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: dialogName });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  return { dialog, trigger };
}

export async function openAddExercise(page: Page) {
  const launcher = page.getByRole("button", { name: "Open add exercise" });
  if (await launcher.isVisible()) {
    await launcher.click();
    await expect(page.getByRole("dialog", { name: "Add exercise" })).toBeVisible();
  }
}

export async function chooseExercise(page: Page, exerciseName: string) {
  await page.getByRole("searchbox").fill(exerciseName);
  await page
    .getByRole("button", { name: new RegExp(exerciseName, "i") })
    .click();
}

export async function createWorkout(page: Page, title: string) {
  await page.goto("/workouts/new");
  await page.getByLabel("Workout title").fill(title);
  await submitAndWaitForPath(
    page,
    () =>
      page
        .getByRole("button", { name: "Create workout and add exercises" })
        .click(),
    /\/workouts\/[^/]+$/,
  );
}

export async function createRoutine(page: Page, title: string) {
  await page.goto("/routines/new");
  await page.getByLabel("Routine title").fill(title);
  await submitAndWaitForPath(
    page,
    () => page.getByRole("button", { name: "Create routine" }).click(),
    /\/routines\/[^/]+$/,
  );
}
