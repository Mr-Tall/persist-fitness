import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addExerciseToRoutine,
  addExerciseToRoutineWithState,
  createRoutine,
  createRoutineWithState,
  startRoutine,
  updateExerciseInRoutineWithState,
  updateRoutineWithState,
} from "@/app/actions/routines";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("redirect control flow");

  return {
    redirectError,
    requireUserId: vi.fn(),
    create: vi.fn(),
    updateRoutineRecord: vi.fn(),
    findRoutine: vi.fn(),
    findExercise: vi.fn(),
    transaction: vi.fn(),
    aggregateTemplateExercises: vi.fn(),
    createTemplateExercise: vi.fn(),
    updateTemplateExercise: vi.fn(),
    coordinateActiveWorkout: vi.fn(),
    createWorkoutInTransaction: vi.fn(),
    redirect: vi.fn(),
    revalidatePath: vi.fn(),
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
    templateExercise: {
      updateMany: mocks.updateTemplateExercise,
    },
    workoutTemplate: {
      create: mocks.create,
      findFirst: mocks.findRoutine,
      update: mocks.updateRoutineRecord,
    },
  },
}));

vi.mock("@/lib/workouts/active-workout-coordinator", () => ({
  coordinateActiveWorkout: mocks.coordinateActiveWorkout,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
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

  it("returns recoverable validation state without changing the public action", async () => {
    const formData = new FormData();
    formData.set("title", "");

    const result = await createRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      formData,
    );

    expect(result).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Please check the routine details and try again.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("sanitizes recoverable routine creation failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.create.mockRejectedValue(new Error("private routine database failure"));
    const formData = new FormData();
    formData.set("title", "Upper body");

    const result = await createRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      formData,
    );

    expect(result).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(JSON.stringify(result)).not.toContain("private routine database failure");
    consoleError.mockRestore();
  });

  it("preserves create redirect control flow through the state wrapper", async () => {
    mocks.create.mockResolvedValue({ id: "routine_1" });
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });
    const formData = new FormData();
    formData.set("title", "Upper body");

    await expect(
      createRoutineWithState(
        { status: "idle", message: "", submittedAt: null },
        formData,
      ),
    ).rejects.toBe(mocks.redirectError);
  });
});

describe("routine update form state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.findRoutine.mockResolvedValue({ id: "routine_1" });
    mocks.updateRoutineRecord.mockResolvedValue({ id: "routine_1" });
  });

  function updateRoutineFormData(title = "Upper body") {
    const formData = new FormData();
    formData.set("routineId", "routine_1");
    formData.set("title", title);
    formData.set("goal", "Strength");
    formData.set("description", "Focus on controlled compound lifts.");
    return formData;
  }

  it("returns success while preserving the existing update and revalidation", async () => {
    const result = await updateRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      updateRoutineFormData(),
    );

    expect(result).toMatchObject({
      status: "success",
      message: "Routine updated.",
    });
    expect(mocks.findRoutine).toHaveBeenCalledWith({
      where: { id: "routine_1", userId: "user_1" },
      select: { id: true },
    });
    expect(mocks.updateRoutineRecord).toHaveBeenCalledWith({
      where: { id: "routine_1" },
      data: {
        title: "Upper body",
        goal: "Strength",
        description: "Focus on controlled compound lifts.",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/routines/routine_1");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/routines");
  });

  it("returns a safe validation state without mutating the routine", async () => {
    const result = await updateRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      updateRoutineFormData(""),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Please check the routine details and try again.",
    });
    expect(mocks.updateRoutineRecord).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("planned exercise update form state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.findRoutine.mockResolvedValue({ id: "routine_1" });
    mocks.updateTemplateExercise.mockResolvedValue({ count: 1 });
  });

  function updateExerciseFormData(routineId = "routine_1") {
    const formData = new FormData();
    formData.set("routineId", routineId);
    formData.set("templateExerciseId", "template_exercise_1");
    formData.set("sets", "4");
    formData.set("reps", "8-10");
    formData.set("notes", "Controlled tempo");
    return formData;
  }

  it("preserves ownership-scoped update and detail revalidation", async () => {
    const result = await updateExerciseInRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      updateExerciseFormData(),
    );

    expect(result).toMatchObject({
      status: "success",
      message: "Exercise plan updated.",
    });
    expect(mocks.findRoutine).toHaveBeenCalledWith({
      where: { id: "routine_1", userId: "user_1" },
      select: { id: true },
    });
    expect(mocks.updateTemplateExercise).toHaveBeenCalledWith({
      where: {
        id: "template_exercise_1",
        templateId: "routine_1",
        template: { userId: "user_1" },
      },
      data: {
        sets: 4,
        reps: "8-10",
        notes: "Controlled tempo",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/routines/routine_1");
  });

  it("returns safe NOT_FOUND without updating a forged routine", async () => {
    mocks.findRoutine.mockResolvedValue(null);

    const result = await updateExerciseInRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      updateExerciseFormData("forged_routine"),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });
    expect(mocks.updateTemplateExercise).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
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

  it("returns a compatible success state for the mobile routine sheet", async () => {
    mocks.aggregateTemplateExercises.mockResolvedValue({
      _max: { order: null },
    });

    const result = await addExerciseToRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      addExerciseFormData(),
    );

    expect(result).toMatchObject({
      status: "success",
      message: "Exercise added to routine.",
    });
    expect(result.submittedAt).toEqual(expect.any(Number));
  });

  it("returns a safe state for a missing routine in the mobile sheet", async () => {
    mocks.findRoutine.mockResolvedValue(null);

    const result = await addExerciseToRoutineWithState(
      { status: "idle", message: "", submittedAt: null },
      addExerciseFormData("forged_routine"),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "NOT_FOUND",
      message: "The requested routine item could not be found.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
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
