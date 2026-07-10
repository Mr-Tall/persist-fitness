import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyWorkoutOwner } from "./workout-access";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    workout: {
      findFirst: mocks.findFirst,
    },
  },
}));

describe("verifyWorkoutOwner", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
  });

  it("fetches a workout by workout id and user id", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "workout_1",
    });

    const workout = await verifyWorkoutOwner("workout_1", "user_1");

    expect(workout).toEqual({
      id: "workout_1",
    });

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "workout_1",
        userId: "user_1",
      },
      select: {
        id: true,
      },
    });
  });

  it("throws when the workout does not belong to the user", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(verifyWorkoutOwner("workout_1", "other_user")).rejects.toThrow(
      "Workout not found"
    );
  });
});