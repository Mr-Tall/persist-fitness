import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addExerciseToWorkoutWithState,
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
  deleteSet: vi.fn(),
  updateSets: vi.fn(),
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
  mocks.updateSets.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: {
        workoutExerciseId: string;
        setNumber: { gt: number };
      };
      data: { setNumber: { decrement: number } };
    }) => {
      let count = 0;

      for (const set of sets) {
        if (
          set.workoutExerciseId === where.workoutExerciseId &&
          set.setNumber > where.setNumber.gt
        ) {
          set.setNumber -= data.setNumber.decrement;
          count += 1;
        }
      }

      return { count };
    }
  );
}

describe("workout exercise ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.verifyWorkoutOwner.mockResolvedValue({ id: "workout_1" });
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          workoutExercise: {
            aggregate: mocks.aggregate,
            create: mocks.create,
          },
          workoutSet: {
            findFirst: mocks.findSet,
            delete: mocks.deleteSet,
            updateMany: mocks.updateSets,
          },
        })
    );
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

describe("workout set deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.verifyWorkoutOwner.mockResolvedValue({ id: "workout_1" });
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          workoutExercise: {
            aggregate: mocks.aggregate,
            create: mocks.create,
          },
          workoutSet: {
            findFirst: mocks.findSet,
            delete: mocks.deleteSet,
            updateMany: mocks.updateSets,
          },
        })
    );
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

  it("rolls deletion back when renumbering fails", async () => {
    const sets: StoredSet[] = [
      { id: "set_1", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 1 },
      { id: "set_2", workoutId: "workout_1", workoutExerciseId: "exercise_1", setNumber: 2 },
    ];
    useStoredSets(sets);
    mocks.updateSets.mockRejectedValueOnce(new Error("simulated failure"));
    mocks.transaction.mockImplementationOnce(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        const snapshot = sets.map((set) => ({ ...set }));

        try {
          return await callback({
            workoutSet: {
              findFirst: mocks.findSet,
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
    ).rejects.toThrow("simulated failure");
    expect(sets.map((set) => set.setNumber)).toEqual([1, 2]);
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
    expect(mocks.updateSets).toHaveBeenCalledWith({
      where: {
        workoutExerciseId: "exercise_1",
        setNumber: {
          gt: 1,
        },
      },
      data: {
        setNumber: {
          decrement: 1,
        },
      },
    });
  });
});
