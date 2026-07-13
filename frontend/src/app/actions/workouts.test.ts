import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWorkout,
  finishWorkout,
  reopenWorkout,
  repeatWorkout,
  startTodaysWorkout,
} from "@/app/actions/workouts";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("redirect control flow");

  return {
    redirectError,
    requireUserId: vi.fn(),
    coordinateActiveWorkout: vi.fn(),
    createInTransaction: vi.fn(),
    updateWorkout: vi.fn(),
    updateWorkoutInTransaction: vi.fn(),
    findSourceWorkout: vi.fn(),
    revalidatePath: vi.fn(),
    redirect: vi.fn(),
    unstableRethrow: vi.fn((error: unknown) => {
      if (error === redirectError) {
        throw error;
      }
    }),
  };
});

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/workouts/active-workout-coordinator", () => ({
  coordinateActiveWorkout: mocks.coordinateActiveWorkout,
}));

vi.mock("@/lib/db", () => ({
  db: {
    workout: {
      findFirst: mocks.findSourceWorkout,
      updateMany: mocks.updateWorkout,
    },
  },
}));

vi.mock("@/lib/auth/workout-access", () => ({
  verifyWorkoutOwner: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

const transaction = {
  workout: {
    create: mocks.createInTransaction,
    updateMany: mocks.updateWorkoutInTransaction,
  },
};

function validWorkoutFormData() {
  const formData = new FormData();
  formData.set("title", "Upper Strength");
  formData.set("goal", "Strength");
  formData.set("notes", "Heavy compounds");
  formData.set("date", "2026-07-12");
  return formData;
}

function workoutIdFormData(workoutId = "workout_source") {
  const formData = new FormData();
  formData.set("workoutId", workoutId);
  return formData;
}

function createThroughCoordinator(workoutId: string) {
  mocks.createInTransaction.mockResolvedValue({ id: workoutId });
  mocks.coordinateActiveWorkout.mockImplementation(
    async ({
      createWorkout: create,
    }: {
      createWorkout: (client: typeof transaction) => Promise<{ id: string }>;
    }) => {
      const workout = await create(transaction);
      return { workoutId: workout.id, created: true };
    }
  );
}

describe("workout creation coordination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });
  });

  it("creates a validated manual workout through the coordinator", async () => {
    createThroughCoordinator("workout_manual");

    await expect(createWorkout(validWorkoutFormData())).rejects.toBe(
      mocks.redirectError
    );

    expect(mocks.createInTransaction).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        title: "Upper Strength",
        goal: "Strength",
        notes: "Heavy compounds",
        status: "active",
      }),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_manual");
  });

  it("redirects manual creation to an existing active workout", async () => {
    mocks.coordinateActiveWorkout.mockResolvedValue({
      workoutId: "workout_active",
      created: false,
    });

    await expect(createWorkout(validWorkoutFormData())).rejects.toBe(
      mocks.redirectError
    );

    expect(mocks.createInTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_active");
  });

  it("creates today's workout through the coordinator", async () => {
    createThroughCoordinator("workout_today");

    await expect(startTodaysWorkout()).rejects.toBe(mocks.redirectError);

    expect(mocks.createInTransaction).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        title: "Today's Workout",
        status: "active",
      }),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_today");
  });

  it("resumes an active workout instead of starting today's workout", async () => {
    mocks.coordinateActiveWorkout.mockResolvedValue({
      workoutId: "workout_active",
      created: false,
    });

    await expect(startTodaysWorkout()).rejects.toBe(mocks.redirectError);

    expect(mocks.createInTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_active");
  });

  it("loads the owned repeat source before coordinated creation", async () => {
    mocks.findSourceWorkout.mockResolvedValue({
      id: "workout_source",
      title: "Push Day",
      goal: "Hypertrophy",
      exercises: [
        { exerciseId: "exercise_1", name: "Bench Press", order: 0 },
      ],
    });
    createThroughCoordinator("workout_repeat");

    await expect(
      repeatWorkout(workoutIdFormData())
    ).rejects.toBe(mocks.redirectError);

    expect(mocks.findSourceWorkout).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "workout_source",
          userId: "user_1",
        },
      })
    );
    expect(
      mocks.findSourceWorkout.mock.invocationCallOrder[0]
    ).toBeLessThan(mocks.coordinateActiveWorkout.mock.invocationCallOrder[0]);
    expect(mocks.createInTransaction).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Push Day",
        goal: "Hypertrophy",
        exercises: {
          create: [
            { exerciseId: "exercise_1", name: "Bench Press", order: 0 },
          ],
        },
      }),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_repeat");
  });

  it("loads the repeat source but skips creation when an active workout exists", async () => {
    mocks.findSourceWorkout.mockResolvedValue({
      id: "workout_source",
      title: "Push Day",
      goal: null,
      exercises: [],
    });
    mocks.coordinateActiveWorkout.mockResolvedValue({
      workoutId: "workout_active",
      created: false,
    });

    await expect(
      repeatWorkout(workoutIdFormData())
    ).rejects.toBe(mocks.redirectError);

    expect(mocks.findSourceWorkout).toHaveBeenCalledOnce();
    expect(mocks.createInTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_active");
  });

  it("rejects a forged repeat source before coordination", async () => {
    mocks.findSourceWorkout.mockResolvedValue(null);

    await expect(
      repeatWorkout(workoutIdFormData("forged_workout"))
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });

    expect(mocks.coordinateActiveWorkout).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("workout lifecycle transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });
  });

  it("finishes an owned active workout with a completion timestamp", async () => {
    mocks.updateWorkout.mockResolvedValue({ count: 1 });

    await finishWorkout(workoutIdFormData("workout_1"));

    expect(mocks.updateWorkout).toHaveBeenCalledWith({
      where: {
        id: "workout_1",
        userId: "user_1",
        status: "active",
      },
      data: {
        status: "completed",
        finishedAt: expect.any(Date),
      },
    });
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/workouts/workout_1"],
      ["/workouts"],
      ["/dashboard"],
    ]);
  });

  it("treats a completed workout as an idempotent finish retry", async () => {
    const originalFinishedAt = new Date("2026-07-12T20:00:00.000Z");
    mocks.updateWorkout.mockResolvedValue({ count: 0 });
    mocks.findSourceWorkout.mockResolvedValue({
      status: "completed",
      finishedAt: originalFinishedAt,
    });

    await finishWorkout(workoutIdFormData("workout_1"));

    expect(mocks.updateWorkout).toHaveBeenCalledOnce();
    expect(mocks.findSourceWorkout).toHaveBeenCalledWith({
      where: {
        id: "workout_1",
        userId: "user_1",
      },
      select: {
        status: true,
        finishedAt: true,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(3);
  });

  it("returns not-found when finishing a missing or cross-user workout", async () => {
    mocks.updateWorkout.mockResolvedValue({ count: 0 });
    mocks.findSourceWorkout.mockResolvedValue(null);

    await expect(
      finishWorkout(workoutIdFormData("forged_workout"))
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("reopens an owned completed workout inside coordination", async () => {
    mocks.findSourceWorkout.mockResolvedValue({
      id: "workout_1",
      status: "completed",
    });
    mocks.updateWorkoutInTransaction.mockResolvedValue({ count: 1 });
    mocks.coordinateActiveWorkout.mockImplementation(
      async ({
        createWorkout,
      }: {
        createWorkout: (
          client: typeof transaction
        ) => Promise<{ id: string }>;
      }) => {
        const workout = await createWorkout(transaction);
        return { workoutId: workout.id, created: true };
      }
    );

    await reopenWorkout(workoutIdFormData("workout_1"));

    expect(mocks.updateWorkoutInTransaction).toHaveBeenCalledWith({
      where: {
        id: "workout_1",
        userId: "user_1",
        status: "completed",
      },
      data: {
        status: "active",
        finishedAt: null,
      },
    });
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/workouts/workout_1"],
      ["/workouts"],
      ["/dashboard"],
    ]);
  });

  it("redirects an already-active reopen target without coordination", async () => {
    mocks.findSourceWorkout.mockResolvedValue({
      id: "workout_1",
      status: "active",
    });

    await expect(
      reopenWorkout(workoutIdFormData("workout_1"))
    ).rejects.toBe(mocks.redirectError);

    expect(mocks.coordinateActiveWorkout).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_1");
  });

  it("redirects to another active workout without reopening the target", async () => {
    mocks.findSourceWorkout.mockResolvedValue({
      id: "workout_completed",
      status: "completed",
    });
    mocks.coordinateActiveWorkout.mockResolvedValue({
      workoutId: "workout_active",
      created: false,
    });

    await expect(
      reopenWorkout(workoutIdFormData("workout_completed"))
    ).rejects.toBe(mocks.redirectError);

    expect(mocks.updateWorkoutInTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_active");
  });

  it("returns not-found for a missing or cross-user reopen target", async () => {
    mocks.findSourceWorkout.mockResolvedValue(null);

    await expect(
      reopenWorkout(workoutIdFormData("forged_workout"))
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });

    expect(mocks.coordinateActiveWorkout).not.toHaveBeenCalled();
    expect(mocks.updateWorkoutInTransaction).not.toHaveBeenCalled();
  });
});
