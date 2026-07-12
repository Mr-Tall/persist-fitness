import { beforeEach, describe, expect, it, vi } from "vitest";
import { addExerciseToWorkoutWithState } from "@/app/actions/workout-exercises";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  verifyWorkoutOwner: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  findUnique: vi.fn(),
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
