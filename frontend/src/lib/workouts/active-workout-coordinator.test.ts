import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
  },
}));

import { coordinateActiveWorkout } from "@/lib/workouts/active-workout-coordinator";

const transactionClient = {
  workout: {
    findFirst: mocks.findFirst,
  },
};

describe("coordinateActiveWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(
      async (
        callback: (transaction: typeof transactionClient) => Promise<unknown>
      ) => callback(transactionClient)
    );
  });

  it("creates a workout when the user has no active workout", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const createWorkout = vi.fn().mockResolvedValue({ id: "workout_new" });

    const result = await coordinateActiveWorkout({
      userId: "user_1",
      createWorkout,
    });

    expect(result).toEqual({
      workoutId: "workout_new",
      created: true,
    });
    expect(createWorkout).toHaveBeenCalledOnce();
    expect(createWorkout).toHaveBeenCalledWith(transactionClient);
  });

  it("returns the existing active workout without executing the callback", async () => {
    mocks.findFirst.mockResolvedValue({ id: "workout_active" });
    const createWorkout = vi.fn();

    const result = await coordinateActiveWorkout({
      userId: "user_1",
      createWorkout,
    });

    expect(result).toEqual({
      workoutId: "workout_active",
      created: false,
    });
    expect(createWorkout).not.toHaveBeenCalled();
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        status: "active",
      },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
      },
    });
  });

  it("runs the creation callback inside a Serializable transaction", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const createWorkout = vi.fn().mockResolvedValue({ id: "workout_new" });

    await coordinateActiveWorkout({
      userId: "user_1",
      createWorkout,
    });

    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(createWorkout).toHaveBeenCalledWith(transactionClient);
  });

  it("retries a P2034 conflict", async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });
    const createWorkout = vi.fn().mockResolvedValue({ id: "workout_new" });

    const result = await coordinateActiveWorkout({
      userId: "user_1",
      createWorkout,
    });

    expect(result.workoutId).toBe("workout_new");
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("retries the targeted active-workout P2002", async () => {
    mocks.findFirst.mockResolvedValue({ id: "workout_winner" });
    mocks.transaction.mockRejectedValueOnce({
      code: "P2002",
      meta: {
        modelName: "Workout",
        target: ["userId"],
      },
    });
    const createWorkout = vi.fn();

    const result = await coordinateActiveWorkout({
      userId: "user_1",
      createWorkout,
    });

    expect(result).toEqual({
      workoutId: "workout_winner",
      created: false,
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(createWorkout).not.toHaveBeenCalled();
  });

  it("does not retry an unrelated P2002", async () => {
    const unrelatedError = {
      code: "P2002",
      meta: {
        modelName: "User",
        target: ["email"],
      },
    };
    mocks.transaction.mockRejectedValueOnce(unrelatedError);

    await expect(
      coordinateActiveWorkout({
        userId: "user_1",
        createWorkout: vi.fn(),
      })
    ).rejects.toBe(unrelatedError);
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("stops after the bounded retry limit is exhausted", async () => {
    const conflict = { code: "P2034" };
    mocks.transaction.mockRejectedValue(conflict);

    await expect(
      coordinateActiveWorkout({
        userId: "user_1",
        createWorkout: vi.fn(),
      })
    ).rejects.toBe(conflict);
    expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });
});
