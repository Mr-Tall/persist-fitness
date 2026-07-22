import { test, expect } from "../fixtures/authenticated-test";

test("redirects an unauthenticated visitor away from a protected route", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("loads an empty authenticated dashboard and supports primary navigation", async ({
  authenticatedPage: page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("button", { name: "Start workout" }),
  ).toBeVisible();

  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  if (await navigation.isVisible()) {
    await navigation.getByRole("link", { name: "Profile" }).click();
  } else {
    await page.goto("/settings");
  }

  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page.getByRole("heading", { name: "Training profile" }),
  ).toBeVisible();
});
