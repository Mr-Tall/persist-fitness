import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWorkout,
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
    findSourceWorkout: vi.fn(),
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
    },
  },
}));

vi.mock("@/lib/auth/workout-access", () => ({
  verifyWorkoutOwner: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

const transaction = {
  workout: {
    create: mocks.createInTransaction,
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
