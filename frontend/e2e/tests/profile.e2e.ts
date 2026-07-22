import { test, expect } from "../fixtures/authenticated-test";

test("persists profile changes after navigation and refresh", async ({
  authenticatedPage: page,
}) => {
  await page.goto("/settings");

  await page.getByLabel("Primary goal").selectOption("Get stronger");
  await page.getByLabel("Experience level").selectOption("Intermediate");
  await page.getByLabel("Training age").fill("3 years");
  await page.getByLabel("Available training days per week").fill("4");
  await page.getByLabel("Preferred split").selectOption("Upper Lower");
  await page.getByLabel("Barbell").check();
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/settings");
  await expect(page.getByLabel("Primary goal")).toHaveValue("Get stronger");
  await expect(page.getByLabel("Experience level")).toHaveValue("Intermediate");
  await expect(page.getByLabel("Training age")).toHaveValue("3 years");
  await expect(page.getByLabel("Available training days per week")).toHaveValue(
    "4",
  );
  await expect(page.getByLabel("Preferred split")).toHaveValue("Upper Lower");
  await expect(page.getByLabel("Barbell")).toBeChecked();

  await page.reload();
  await expect(page.getByLabel("Training age")).toHaveValue("3 years");
});
