import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";

import { e2eDb } from "../support/database";

type TestUser = {
  email: string;
  exerciseName: string;
  id: string;
  sessionToken: string;
};

type TestOptions = {
  onboardingComplete: boolean;
};

type TestFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
};

export const test = base.extend<TestFixtures & TestOptions>({
  onboardingComplete: [true, { option: true }],

  testUser: async ({ onboardingComplete }, provideFixture, testInfo) => {
    const suffix = `${testInfo.workerIndex}-${randomUUID()}`;
    const email = `playwright-${suffix}@example.test`;
    const sessionToken = `playwright-session-${suffix}`;
    const exerciseName = `E2E Barbell Squat ${suffix}`;

    const user = await e2eDb.user.create({
      data: {
        email,
        name: "Playwright Athlete",
        onboardingCompletedAt: onboardingComplete ? new Date() : null,
        sessions: {
          create: {
            sessionToken,
            expires: new Date(Date.now() + 60 * 60 * 1000),
          },
        },
      },
    });

    let exerciseId: string | undefined;

    try {
      const exercise = await e2eDb.exercise.create({
        data: {
          name: exerciseName,
          equipment: "Barbell",
          primaryMuscles: ["Quadriceps"],
          secondaryMuscles: ["Glutes"],
          instructions: ["Use controlled form."],
          images: [],
        },
      });
      exerciseId = exercise.id;

      await provideFixture({
        email,
        exerciseName,
        id: user.id,
        sessionToken,
      });
    } finally {
      try {
        await e2eDb.user.deleteMany({ where: { id: user.id } });
      } finally {
        if (exerciseId) {
          await e2eDb.exercise.deleteMany({ where: { id: exerciseId } });
        }
      }
    }
  },

  authenticatedPage: async (
    { context, page, testUser, baseURL },
    provideFixture,
  ) => {
    if (!baseURL) {
      throw new Error("Playwright baseURL is required for authentication.");
    }

    await context.addCookies([
      {
        name: "authjs.session-token",
        value: testUser.sessionToken,
        url: baseURL,
        httpOnly: true,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 60 * 60,
      },
    ]);

    await provideFixture(page);
  },
});

export { expect };
