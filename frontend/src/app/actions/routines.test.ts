import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addExerciseToRoutine,
  createRoutine,
  startRoutine,
} from "@/app/actions/routines";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("redirect control flow");

  return {
    redirectError,
    requireUserId: vi.fn(),
    create: vi.fn(),
    findRoutine: vi.fn(),
    findExercise: vi.fn(),
    transaction: vi.fn(),
    aggregateTemplateExercises: vi.fn(),
    createTemplateExercise: vi.fn(),
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
    $transaction: mocks.transaction,
    exercise: {
      findUnique: mocks.findExercise,
    },
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

const routineExerciseTransaction = {
  templateExercise: {
    aggregate: mocks.aggregateTemplateExercises,
    create: mocks.createTemplateExercise,
  },
};

function addExerciseFormData(routineId = "routine_1") {
  const formData = new FormData();
  formData.set("routineId", routineId);
  formData.set("name", "Bench Press");
  formData.set("sets", "3");
  formData.set("reps", "8-10");
  formData.set("notes", "Controlled tempo");
  return formData;
}

describe("routine exercise ordering allocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.findRoutine.mockResolvedValue({ id: "routine_1" });
    mocks.createTemplateExercise.mockResolvedValue({ id: "template_exercise_1" });
    mocks.transaction.mockImplementation(
      async (
        callback: (
          transaction: typeof routineExerciseTransaction,
        ) => Promise<unknown>,
      ) => callback(routineExerciseTransaction),
    );
  });

  async function addWithHighestOrder(highestOrder: number | null) {
    mocks.aggregateTemplateExercises.mockResolvedValue({
      _max: {
        order: highestOrder,
      },
    });

    await addExerciseToRoutine(addExerciseFormData());
  }

  it("starts an empty routine at order zero", async () => {
    await addWithHighestOrder(null);

    expect(mocks.createTemplateExercise).toHaveBeenCalledWith({
      data: {
        templateId: "routine_1",
        exerciseId: null,
        name: "Bench Press",
        sets: 3,
        reps: "8-10",
        notes: "Controlled tempo",
        order: 0,
      },
    });
  });

  it("allocates one position after the current maximum", async () => {
    await addWithHighestOrder(4);

    expect(mocks.createTemplateExercise).toHaveBeenCalledWith({
      data: expect.objectContaining({
        templateId: "routine_1",
        order: 5,
      }),
    });
  });

  it("does not reuse an occupied order after a middle exercise is deleted", async () => {
    await addWithHighestOrder(2);

    expect(mocks.createTemplateExercise).toHaveBeenCalledWith({
      data: expect.objectContaining({
        order: 3,
      }),
    });
  });

  it("uses max plus one after the last exercise is deleted", async () => {
    await addWithHighestOrder(1);

    expect(mocks.createTemplateExercise).toHaveBeenCalledWith({
      data: expect.objectContaining({
        order: 2,
      }),
    });
  });

  it("preserves existing gaps instead of renumbering", async () => {
    await addWithHighestOrder(8);

    expect(mocks.createTemplateExercise).toHaveBeenCalledWith({
      data: expect.objectContaining({
        order: 9,
      }),
    });
  });

  it("keeps multiple sequential additions ordered", async () => {
    mocks.aggregateTemplateExercises
      .mockResolvedValueOnce({ _max: { order: null } })
      .mockResolvedValueOnce({ _max: { order: 0 } })
      .mockResolvedValueOnce({ _max: { order: 1 } });

    await addExerciseToRoutine(addExerciseFormData());
    await addExerciseToRoutine(addExerciseFormData());
    await addExerciseToRoutine(addExerciseFormData());

    expect(mocks.createTemplateExercise.mock.calls).toHaveLength(3);
    expect(
      mocks.createTemplateExercise.mock.calls.map(
        ([call]) => call.data.order,
      ),
    ).toEqual([0, 1, 2]);
  });

  it("keeps allocation and creation inside one transaction", async () => {
    await addWithHighestOrder(3);

    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(mocks.aggregateTemplateExercises).toHaveBeenCalledWith({
      where: {
        templateId: "routine_1",
      },
      _max: {
        order: true,
      },
    });
    expect(mocks.aggregateTemplateExercises.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createTemplateExercise.mock.invocationCallOrder[0],
    );
  });

  it("rejects a forged routine before querying or modifying exercise order", async () => {
    mocks.findRoutine.mockResolvedValue(null);

    await expect(
      addExerciseToRoutine(addExerciseFormData("forged_routine")),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.aggregateTemplateExercises).not.toHaveBeenCalled();
    expect(mocks.createTemplateExercise).not.toHaveBeenCalled();
  });

  it("scopes allocation and creation to only the owned routine", async () => {
    await addWithHighestOrder(2);

    expect(mocks.findRoutine).toHaveBeenCalledWith({
      where: {
        id: "routine_1",
        userId: "user_1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.aggregateTemplateExercises).toHaveBeenCalledWith({
      where: {
        templateId: "routine_1",
      },
      _max: {
        order: true,
      },
    });
    expect(mocks.createTemplateExercise).toHaveBeenCalledWith({
      data: expect.objectContaining({
        templateId: "routine_1",
      }),
    });
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
