import { describe, expect, it, vi } from "vitest";

const findUser = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: findUser } } }));

import { createPersonalDataExport } from "./data-export";

describe("personal data export", () => {
  it("includes owned product data while excluding private screenshot paths", async () => {
    findUser.mockResolvedValue({
      id: "user-1",
      name: "User",
      email: "user@example.com",
      profile: { primaryGoal: "Strength" },
      workouts: [{
        id: "workout-1",
        date: new Date("2026-01-01T00:00:00.000Z"),
        exercises: [{
          exerciseId: "exercise-1",
          name: "Bench Press",
          exercise: { trackingType: "weight_reps" },
          sets: [{ id: "set-1", setNumber: 1, weight: 100, reps: 5 }],
        }],
      }],
      templates: [],
      programEnrollments: [],
      programsOwned: [],
      favoriteExercises: [],
      feedback: [{ id: "feedback-1", message: "Example", screenshotPath: "private/path.png" }],
    });

    const result = await createPersonalDataExport("user-1");
    expect(findUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "user-1" } }));
    const query = findUser.mock.calls[0][0];
    expect(query.select.accounts.select).toEqual({
      type: true,
      provider: true,
      providerAccountId: true,
    });
    expect(query.select.sessions.select).not.toHaveProperty("sessionToken");
    expect(result?.account.workouts).toHaveLength(1);
    expect(result?.exerciseHistory).toEqual([
      expect.objectContaining({
        exerciseId: "exercise-1",
        name: "Bench Press",
        performances: [expect.objectContaining({ workoutId: "workout-1" })],
      }),
    ]);
    expect(result?.feedback).toEqual([
      expect.objectContaining({ id: "feedback-1", screenshotAttached: true }),
    ]);
    expect(JSON.stringify(result)).not.toContain("private/path.png");
    expect(JSON.stringify(result)).not.toContain("sessionToken");
  });

  it("returns null for a missing account", async () => {
    findUser.mockResolvedValue(null);
    await expect(createPersonalDataExport("missing")).resolves.toBeNull();
  });
});
