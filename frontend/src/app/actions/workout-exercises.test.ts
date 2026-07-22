import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addExerciseToWorkoutWithState,
  addSetToExerciseWithState,
  deleteSetFromExercise,
} from "@/app/actions/workout-exercises";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  verifyWorkoutOwner: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  findUnique: vi.fn(),
  findSet: vi.fn(),
  findLaterSets: vi.fn(),
  deleteSet: vi.fn(),
  updateSets: vi.fn(),
  findWorkoutExercise: vi.fn(),
  aggregateSets: vi.fn(),
  createSet: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/auth/workout-access", () => ({
  verifyWorkoutOwner: mocks.verifyWorkoutOwner,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
    exercise: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  unstable_rethrow: vi.fn(),
}));

const initialState = {
  status: "idle" as const,
  message: "",
  submittedAt: null,
};

function exerciseFormData(name = "Bench Press") {
  const formData = new FormData();
  formData.set("workoutId", "workout_1");
  formData.set("name", name);
  return formData;
}

function useExistingOrders(orders: number[]) {
  mocks.aggregate.mockImplementation(async () => ({
    _max: {
      order: orders.length === 0 ? null : Math.max(...orders),
    },
  }));
  mocks.create.mockImplementation(
    async ({ data }: { data: { order: number } }) => {
      orders.push(data.order);
      return { id: `exercise_${orders.length}`, ...data };
    }
  );
}

type StoredSet = {
  id: string;
  workoutId: string;
  workoutExerciseId: string;
  setNumber: number;
};

function setFormData(workoutSetId: string, workoutId = "workout_1") {
  const formData = new FormData();
  formData.set("workoutId", workoutId);
  formData.set("workoutSetId", workoutSetId);
  return formData;
}

function addSetFormData(
  workoutExerciseId = "exercise_1",
  workoutId = "workout_1"
) {
  const formData = new FormData();
  formData.set("workoutId", workoutId);
  formData.set("workoutExerciseId", workoutExerciseId);
  formData.set("reps", "8");
  return formData;
}

function transactionClient() {
  return {
    workoutExercise: {
      aggregate: mocks.aggregate,
      create: mocks.create,
      findFirst: mocks.findWorkoutExercise,
    },
    workoutSet: {
      findFirst: mocks.findSet,
      aggregate: mocks.aggregateSets,
      create: mocks.createSet,
      delete: mocks.deleteSet,
      findMany: mocks.findLaterSets,
      updateMany: mocks.updateSets,
    },
  };
}

function useDefaultTransaction() {
  mocks.transaction.mockImplementation(
    async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback(transactionClient())
  );
}

function useStoredSets(sets: StoredSet[]) {
  mocks.findSet.mockImplementation(
    async ({ where }: { where: { id: string; workoutExercise: { workoutId: string } } }) =>
      sets.find(
        (set) =>
          set.id === where.id &&
          set.workoutId === where.workoutExercise.workoutId
      ) ?? null
  );
  mocks.deleteSet.mockImplementation(
    async ({ where }: { where: { id: string } }) => {
      const index = sets.findIndex((set) => set.id === where.id);
      const [deletedSet] = sets.splice(index, 1);
      return deletedSet;
    }
  );
  mocks.findLaterSets.mockImplementation(
    async ({
      where,
    }: {
      where: {
        workoutExerciseId: string;
        setNumber: { gt: number };
      };
    }) =>
      sets
        .filter(
          (set) =>
            set.workoutExerciseId === where.workoutExerciseId &&
            set.setNumber > where.setNumber.gt
        )
        .sort((left, right) => left.setNumber - right.setNumber)
        .map(({ id, setNumber }) => ({ id, setNumber }))
  );
  mocks.updateSets.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: {
        id: string;
        workoutExerciseId: string;
        setNumber: number;
      };
      data: { setNumber: number };
    }) => {
      const set = sets.find(
        (candidate) =>
          candidate.id === where.id &&
          candidate.workoutExerciseId === where.workoutExerciseId &&
          candidate.setNumber === where.setNumber
      );

      if (!set) {
        return { count: 0 };
      }

      const conflictsWithSibling = sets.some(
        (candidate) =>
          candidate.id !== set.id &&
          candidate.workoutExerciseId === set.workoutExerciseId &&
          candidate.setNumber === data.setNumber
      );

      if (conflictsWithSibling) {
        throw Object.assign(new Error("unique constraint violation"), {
          code: "P2002",
        });
      }

      set.setNumber = data.setNumber;
      return { count: 1 };
    }
  );
}

function useSetAllocation(
  sets: StoredSet[],
  exercises: Array<{
    id: string;
    workoutId: string;
    exercise?: { trackingType: string | null } | null;
  }> = [{ id: "exercise_1", workoutId: "workout_1" }]
) {
  mocks.findWorkoutExercise.mockImplementation(
    async ({ where }: { where: { id: string; workoutId: string } }) =>
      exercises.find(
        (exercise) =>
          exercise.id === where.id && exercise.workoutId === where.workoutId
      ) ?? null
  );
  mocks.aggregateSets.mockImplementation(
    async ({ where }: { where: { workoutExerciseId: string } }) => {
      const matchingSets = sets.filter(
        (set) => set.workoutExerciseId === where.workoutExerciseId
      );

      return {
        _max: {
          setNumber:
            matchingSets.length === 0
              ? null
              : Math.max(...matchingSets.map((set) => set.setNumber)),
        },
      };
    }
  );
  mocks.createSet.mockImplementation(
    async ({
      data,
    }: {
      data: {
        workoutExerciseId: string;
        setNumber: number;
      };
    }) => {
      const exercise = exercises.find(
        (candidate) => candidate.id === data.workoutExerciseId
      );
      const set = {
        id: `set_${sets.length + 1}`,
        workoutId: exercise?.workoutId ?? "unknown_workout",
        workoutExerciseId: data.workoutExerciseId,
        setNumber: data.setNumber,
      };
      sets.push(set);
      return set;
    }
  );
}

describe("workout exercise ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.verifyWorkoutOwner.mockResolvedValue({ id: "workout_1" });
    useDefaultTransaction();
  });

  it("starts an empty workout at order zero", async () => {
    const orders: number[] = [];
    useExistingOrders(orders);

    const result = await addExerciseToWorkoutWithState(
      initialState,
      exerciseFormData()
    );

    expect(result).toMatchObject({ status: "success" });
    expect(orders).toEqual([0]);
  });

  it("adds after the maximum order when a middle exercise was deleted", async () => {
    const orders = [0, 2];
    useExistingOrders(orders);

    await addExerciseToWorkoutWithState(initialState, exerciseFormData());

    expect(orders).toEqual([0, 2, 3]);
  });

  it("allocates after the current maximum when the last exercise was deleted", async () => {
    const orders = [0, 1];
    useExistingOrders(orders);

    await addExerciseToWorkoutWithState(initialState, exerciseFormData());

    expect(orders).toEqual([0, 1, 2]);
  });

  it("allocates increasing orders across sequential additions", async () => {
    const orders: number[] = [];
    useExistingOrders(orders);

    await addExerciseToWorkoutWithState(
      initialState,
      exerciseFormData("Bench Press")
    );
    await addExerciseToWorkoutWithState(
      initialState,
      exerciseFormData("Barbell Row")
    );
    await addExerciseToWorkoutWithState(
      initialState,
      exerciseFormData("Deadlift")
    );

    expect(orders).toEqual([0, 1, 2]);
  });

  it("preserves all existing order values", async () => {
    const orders = [0, 4, 7];
    useExistingOrders(orders);

    await addExerciseToWorkoutWithState(initialState, exerciseFormData());

    expect(orders).toEqual([0, 4, 7, 8]);
    expect(mocks.aggregate).toHaveBeenCalledWith({
      where: {
        workoutId: "workout_1",
      },
      _max: {
        order: true,
      },
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});

describe("workout set allocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.verifyWorkoutOwner.mockResolvedValue({ id: "workout_1" });
    useDefaultTransaction();
  });

  it("allocates set one for an empty exercise", async () => {
    const sets: StoredSet[] = [];
    useSetAllocation(sets);

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "success",
      message: "Saved set 1.",
      savedSetNumber: 1,
    });
    expect(sets.map((set) => set.setNumber)).toEqual([1]);
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("allocates after the maximum existing set number", async () => {
    const sets: StoredSet[] = [
      {
        id: "set_1",
        workoutId: "workout_1",
        workoutExerciseId: "exercise_1",
        setNumber: 1,
      },
      {
        id: "set_2",
        workoutId: "workout_1",
        workoutExerciseId: "exercise_1",
        setNumber: 2,
      },
    ];
    useSetAllocation(sets);

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({ message: "Saved set 3." });
    expect(sets.map((set) => set.setNumber)).toEqual([1, 2, 3]);
  });

  it("preserves gaps and allocates from the maximum rather than count", async () => {
    const sets: StoredSet[] = [
      {
        id: "set_1",
        workoutId: "workout_1",
        workoutExerciseId: "exercise_1",
        setNumber: 1,
      },
      {
        id: "set_4",
        workoutId: "workout_1",
        workoutExerciseId: "exercise_1",
        setNumber: 4,
      },
    ];
    useSetAllocation(sets);

    await addSetToExerciseWithState(initialState, addSetFormData());

    expect(sets.map((set) => set.setNumber)).toEqual([1, 4, 5]);
  });

  it("allocates increasing numbers across sequential additions", async () => {
    const sets: StoredSet[] = [];
    useSetAllocation(sets);

    await addSetToExerciseWithState(initialState, addSetFormData());
    await addSetToExerciseWithState(initialState, addSetFormData());
    await addSetToExerciseWithState(initialState, addSetFormData());

    expect(sets.map((set) => set.setNumber)).toEqual([1, 2, 3]);
  });

  it("returns safe not-found for a missing exercise", async () => {
    const sets: StoredSet[] = [];
    useSetAllocation(sets, []);

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData("missing_exercise")
    );

    expect(result).toMatchObject({
      status: "error",
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
    expect(mocks.aggregateSets).not.toHaveBeenCalled();
    expect(mocks.createSet).not.toHaveBeenCalled();
  });

  it("returns safe not-found for an exercise from another workout", async () => {
    const sets: StoredSet[] = [];
    useSetAllocation(sets, [
      { id: "forged_exercise", workoutId: "workout_2" },
    ]);

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData("forged_exercise", "workout_1")
    );

    expect(result).toMatchObject({
      status: "error",
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
    expect(mocks.aggregateSets).not.toHaveBeenCalled();
    expect(mocks.createSet).not.toHaveBeenCalled();
  });

  it("retries the targeted set-number P2002 and then succeeds", async () => {
    const sets: StoredSet[] = [];
    useSetAllocation(sets);
    mocks.transaction.mockRejectedValueOnce({
      code: "P2002",
      meta: {
        modelName: "WorkoutSet",
        target: ["workoutExerciseId", "setNumber"],
      },
    });

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "success",
      message: "Saved set 1.",
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("sanitizes targeted P2002 retry exhaustion", async () => {
    useSetAllocation([]);
    mocks.transaction.mockRejectedValue({
      code: "P2002",
      message: "internal unique constraint details",
      meta: {
        modelName: "WorkoutSet",
        target: "WorkoutSet_workoutExerciseId_setNumber_key",
      },
    });

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(result.message).not.toContain("internal unique constraint details");
    expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });

  it("does not retry an unrelated P2002", async () => {
    useSetAllocation([]);
    mocks.transaction.mockRejectedValueOnce({
      code: "P2002",
      meta: {
        modelName: "User",
        target: ["email"],
      },
    });

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("retries a recognized transaction conflict and then succeeds", async () => {
    const sets: StoredSet[] = [];
    useSetAllocation(sets);
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "success",
      message: "Saved set 1.",
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });

  it("returns a safe error after exhausting transaction retries", async () => {
    useSetAllocation([]);
    mocks.transaction.mockRejectedValue({
      code: "P2034",
      message: "internal transaction details",
    });

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(result.message).not.toContain("internal transaction details");
    expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable errors", async () => {
    useSetAllocation([]);
    mocks.transaction.mockRejectedValueOnce(
      Object.assign(new Error("database unavailable"), { code: "P1001" })
    );

    const result = await addSetToExerciseWithState(
      initialState,
      addSetFormData()
    );

    expect(result).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("queries and modifies only the selected exercise", async () => {
    const sets: StoredSet[] = [
      {
        id: "other_set",
        workoutId: "workout_1",
        workoutExerciseId: "exercise_2",
        setNumber: 6,
      },
    ];
    useSetAllocation(sets, [
      { id: "exercise_1", workoutId: "workout_1" },
      { id: "exercise_2", workoutId: "workout_1" },
    ]);

    await addSetToExerciseWithState(initialState, addSetFormData("exercise_1"));

    expect(mocks.findWorkoutExercise).toHaveBeenCalledWith({
      where: {
        id: "exercise_1",
        workoutId: "workout_1",
      },
      select: {
        id: true,
        exercise: { select: { trackingType: true } },
      },
    });
    expect(mocks.aggregateSets).toHaveBeenCalledWith({
      where: {
        workoutExerciseId: "exercise_1",
      },
      _max: {
        setNumber: true,
      },
    });
    expect(
      sets.find((set) => set.workoutExerciseId === "exercise_2")
    ).toMatchObject({ setNumber: 6 });
  });

  it.each([
    ["weight_reps", { weight: "225", reps: "5" }, { weight: 225, reps: 5 }],
    ["reps_only", { reps: "20" }, { weight: null, reps: 20 }],
    ["time", { minutes: "1", seconds: "30" }, { durationSeconds: 90 }],
    ["distance", { distance: "5", distanceUnit: "km" }, { distance: 5, distanceUnit: "km" }],
    [
      "distance_time",
      { distance: "500", distanceUnit: "m", minutes: "1", seconds: "42" },
      { distance: 500, distanceUnit: "m", durationSeconds: 102 },
    ],
  ])("stores only fields relevant to %s exercises", async (trackingType, values, expected) => {
    useSetAllocation([], [
      {
        id: "exercise_1",
        workoutId: "workout_1",
        exercise: { trackingType },
      },
    ]);
    const formData = new FormData();
    formData.set("workoutId", "workout_1");
    formData.set("workoutExerciseId", "exercise_1");
    Object.entries(values).forEach(([name, value]) => formData.set(name, value));

    await addSetToExerciseWithState(initialState, formData);

    expect(mocks.createSet).toHaveBeenCalledWith({
      data: expect.objectContaining(expected),
    });
  });
});

describe("workout set deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.verifyWorkoutOwner.mockResolvedValue({ id: "workout_1" });
    useDefaultTransaction();
  });

  it("deletes a middle set and decrements only later set numbers", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
      { id: "set_3", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 3 },
    ];
    useStoredSets(sets);

    await deleteSetFromExercise(setFormData("set_2"));

    expect(sets.map(({ id, setNumber }) => ({ id, setNumber }))).toEqual([
      { id: "set_1", setNumber: 1 },
      { id: "set_3", setNumber: 2 },
    ]);
  });

  it("deletes the first set and makes later sets contiguous", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
      { id: "set_3", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 3 },
    ];
    useStoredSets(sets);

    await deleteSetFromExercise(setFormData("set_1"));

    expect(sets.map((set) => set.setNumber)).toEqual([1, 2]);
  });

  it("deletes the last set without changing earlier numbers", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
    ];
    useStoredSets(sets);

    await deleteSetFromExercise(setFormData("set_2"));

    expect(sets.map((set) => set.setNumber)).toEqual([1]);
  });

  it("deletes the only set", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
    ];
    useStoredSets(sets);

    await deleteSetFromExercise(setFormData("set_1"));

    expect(sets).toEqual([]);
  });

  it("returns the generic not-found error when the set is missing", async () => {
    const sets: StoredSet[] = [];
    useStoredSets(sets);

    await expect(
      deleteSetFromExercise(setFormData("missing_set"))
    ).rejects.toMatchObject({
      name: "ActionError",
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
    expect(mocks.deleteSet).not.toHaveBeenCalled();
  });

  it("rejects a set ID belonging to another workout", async () => {
    const sets: StoredSet[] = [
      { id: "forged_set", workoutId: "workout_2", workoutExerciseId: "exercise_2", setNumber: 1 },
    ];
    useStoredSets(sets);

    await expect(
      deleteSetFromExercise(setFormData("forged_set", "workout_1"))
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
    expect(sets).toHaveLength(1);
  });

  it("renumbers ascending without temporary duplicate set numbers", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
      { id: "set_3", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 3 },
      { id: "set_4", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 4 },
    ];
    useStoredSets(sets);

    await deleteSetFromExercise(setFormData("set_1"));

    expect(mocks.updateSets.mock.calls).toEqual([
      [
        {
          where: {
            id: "set_2",
            workoutExerciseId: "exercise_1",
            setNumber: 2,
          },
          data: { setNumber: 1 },
        },
      ],
      [
        {
          where: {
            id: "set_3",
            workoutExerciseId: "exercise_1",
            setNumber: 3,
          },
          data: { setNumber: 2 },
        },
      ],
      [
        {
          where: {
            id: "set_4",
            workoutExerciseId: "exercise_1",
            setNumber: 4,
          },
          data: { setNumber: 3 },
        },
      ],
    ]);
    expect(sets.map((set) => set.setNumber)).toEqual([1, 2, 3]);
  });

  it("retries a P2034 conflict and then deletes successfully", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
    ];
    useStoredSets(sets);
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });

    await deleteSetFromExercise(setFormData("set_1"));

    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(sets.map((set) => set.setNumber)).toEqual([1]);
  });

  it("returns a safe error when P2034 retries are exhausted", async () => {
    useStoredSets([]);
    mocks.transaction.mockRejectedValue({
      code: "P2034",
      message: "internal transaction details",
    });

    await expect(
      deleteSetFromExercise(setFormData("set_1"))
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable deletion errors", async () => {
    useStoredSets([]);
    mocks.transaction.mockRejectedValueOnce(
      Object.assign(new Error("database unavailable"), { code: "P1001" })
    );

    await expect(
      deleteSetFromExercise(setFormData("set_1"))
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("rolls deletion back when renumbering fails", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
      { id: "set_3", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 3 },
    ];
    useStoredSets(sets);
    const updateSet = mocks.updateSets.getMockImplementation();
    mocks.updateSets
      .mockImplementationOnce(updateSet!)
      .mockRejectedValueOnce(new Error("simulated failure"));
    mocks.transaction.mockImplementationOnce(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        const snapshot = sets.map((set) => ({ ...set }));

        try {
          return await callback({
            workoutSet: {
              findFirst: mocks.findSet,
              findMany: mocks.findLaterSets,
              delete: mocks.deleteSet,
              updateMany: mocks.updateSets,
            },
          });
        } catch (error) {
          sets.splice(0, sets.length, ...snapshot);
          throw error;
        }
      }
    );

    await expect(
      deleteSetFromExercise(setFormData("set_1"))
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(sets.map((set) => set.setNumber)).toEqual([1, 2, 3]);
  });

  it("does not renumber sets from another exercise", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
      { id: "other_1", workoutId: "workout_1", workoutExerciseId: "exercise_2", setNumber: 1 },
      { id: "other_2", workoutId: "workout_1", workoutExerciseId: "exercise_2", setNumber: 2 },
    ];
    useStoredSets(sets);

    await deleteSetFromExercise(setFormData("set_1"));

    expect(
      sets
        .filter((set) => set.workoutExerciseId === "exercise_2")
        .map((set) => set.setNumber)
    ).toEqual([1, 2]);
    expect(mocks.findLaterSets).toHaveBeenCalledWith({
      where: {
        workoutExerciseId: "exercise_1",
        setNumber: {
          gt: 1,
        },
      },
      select: {
        id: true,
        setNumber: true,
      },
      orderBy: {
        setNumber: "asc",
      },
    });
  });
});
