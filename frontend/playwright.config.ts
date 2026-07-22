import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

import { getE2EEnvironment } from "./e2e/support/environment";

dotenv.config({ path: ".env.e2e", quiet: true });

const environment = getE2EEnvironment();

export default defineConfig({
  testDir: "./e2e/tests",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: "test-results/playwright",
  use: {
    baseURL: environment.baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["iPhone 14"],
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: environment.baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: environment.databaseURL,
      DIRECT_URL: environment.databaseURL,
      AUTH_SECRET: "playwright-local-auth-secret-not-for-production",
      AUTH_GOOGLE_ID: "playwright-google-client-id",
      AUTH_GOOGLE_SECRET: "playwright-google-client-secret",
      AUTH_URL: environment.baseURL,
      NEXTAUTH_URL: environment.baseURL,
    },
  },
});
