import { test, expect } from "../fixtures/authenticated-test";

test.use({ onboardingComplete: false });

test("completes first-time onboarding and persists completion", async ({
  authenticatedPage: page,
}) => {
  await page.goto("/dashboard");

  const welcomeDialog = page.getByRole("dialog", {
    name: "Make every workout count.",
  });
  await expect(welcomeDialog).toBeVisible();
  await expect(
    welcomeDialog.getByRole("list", { name: "What Persist helps you do" }),
  ).toContainText("Track workouts");
  await expect(welcomeDialog).toContainText("Monitor progress");
  await expect(welcomeDialog).toContainText("Build routines");

  await welcomeDialog.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Strength" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create Workout" }).click();

  await expect(page).toHaveURL(/\/workouts\/new$/);
  await page.goto("/dashboard");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start workout" }),
  ).toBeVisible();
});
