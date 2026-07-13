import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoutine, startRoutine } from "@/app/actions/routines";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("redirect control flow");

  return {
    redirectError,
    requireUserId: vi.fn(),
    create: vi.fn(),
    findRoutine: vi.fn(),
    coordinateActiveWorkout: vi.fn(),
    createWorkoutInTransaction: vi.fn(),
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

vi.mock("@/lib/db", () => ({
  db: {
    workoutTemplate: {
      create: mocks.create,
      findFirst: mocks.findRoutine,
    },
  },
}));

vi.mock("@/lib/workouts/active-workout-coordinator", () => ({
  coordinateActiveWorkout: mocks.coordinateActiveWorkout,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

describe("routine action error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
  });

  it("maps routine validation failures to a safe validation error", async () => {
    const formData = new FormData();
    formData.set("title", "");

    await expect(createRoutine(formData)).rejects.toMatchObject({
      name: "ActionError",
      code: "VALIDATION_ERROR",
      message: "Routine title is required",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("preserves the successful create redirect", async () => {
    mocks.create.mockResolvedValue({ id: "routine_1" });
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });

    const formData = new FormData();
    formData.set("title", "Upper body");

    await expect(createRoutine(formData)).rejects.toBe(mocks.redirectError);
    expect(mocks.redirect).toHaveBeenCalledWith("/routines/routine_1");
  });
});

const transaction = {
  workout: {
    create: mocks.createWorkoutInTransaction,
  },
};

function routineFormData(routineId = "routine_1") {
  const formData = new FormData();
  formData.set("routineId", routineId);
  return formData;
}

describe("routine workout coordination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });
  });

  it("loads the owned routine before creating inside the coordinator", async () => {
    mocks.findRoutine.mockResolvedValue({
      id: "routine_1",
      title: "Upper Body",
      goal: "Strength",
      exercises: [
        { exerciseId: "exercise_1", name: "Bench Press", order: 0 },
      ],
    });
    mocks.createWorkoutInTransaction.mockResolvedValue({ id: "workout_1" });
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

    await expect(startRoutine(routineFormData())).rejects.toBe(
      mocks.redirectError
    );

    expect(mocks.findRoutine).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "routine_1",
          userId: "user_1",
        },
      })
    );
    expect(mocks.findRoutine.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.coordinateActiveWorkout.mock.invocationCallOrder[0]
    );
    expect(mocks.createWorkoutInTransaction).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        title: "Upper Body",
        goal: "Strength",
        exercises: {
          create: [
            { exerciseId: "exercise_1", name: "Bench Press", order: 0 },
          ],
        },
      }),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_1");
  });

  it("redirects to an active workout without executing routine creation", async () => {
    mocks.findRoutine.mockResolvedValue({
      id: "routine_1",
      title: "Upper Body",
      goal: null,
      exercises: [],
    });
    mocks.coordinateActiveWorkout.mockResolvedValue({
      workoutId: "workout_active",
      created: false,
    });

    await expect(startRoutine(routineFormData())).rejects.toBe(
      mocks.redirectError
    );

    expect(mocks.findRoutine).toHaveBeenCalledOnce();
    expect(mocks.createWorkoutInTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout_active");
  });

  it("rejects a forged routine before coordination", async () => {
    mocks.findRoutine.mockResolvedValue(null);

    await expect(
      startRoutine(routineFormData("forged_routine"))
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });

    expect(mocks.coordinateActiveWorkout).not.toHaveBeenCalled();
    expect(mocks.createWorkoutInTransaction).not.toHaveBeenCalled();
  });
});
