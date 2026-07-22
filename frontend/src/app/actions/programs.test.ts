import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("redirect control flow");
  return {
    redirectError,
    requireUserId: vi.fn(),
    transaction: vi.fn(),
    findProgram: vi.fn(),
    findActiveEnrollmentInTransaction: vi.fn(),
    createEnrollment: vi.fn(),
    findEnrollment: vi.fn(),
    coordinateActiveWorkout: vi.fn(),
    createWorkout: vi.fn(),
    revalidatePath: vi.fn(),
    redirect: vi.fn(),
    unstableRethrow: vi.fn((error: unknown) => {
      if (error === redirectError) throw error;
    }),
  };
});

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
    programEnrollment: { findFirst: mocks.findEnrollment },
  },
}));

vi.mock("@/lib/workouts/active-workout-coordinator", () => ({
  coordinateActiveWorkout: mocks.coordinateActiveWorkout,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

import { enrollInProgram, startProgramWorkout } from "@/app/actions/programs";

const transactionClient = {
  program: { findFirst: mocks.findProgram },
  programEnrollment: {
    findFirst: mocks.findActiveEnrollmentInTransaction,
    create: mocks.createEnrollment,
  },
  workout: { create: mocks.createWorkout },
};

function programFormData(programId = "program-1") {
  const formData = new FormData();
  formData.set("programId", programId);
  return formData;
}

const visibleProgram = {
  id: "program-1",
  weeks: [
    {
      weekNumber: 2,
      days: [{ id: "day-1", dayNumber: 3 }],
    },
  ],
};

describe("program actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user-1");
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });
    mocks.transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
    mocks.findProgram.mockResolvedValue(visibleProgram);
    mocks.findActiveEnrollmentInTransaction.mockResolvedValue(null);
    mocks.createEnrollment.mockResolvedValue({ id: "enrollment-1" });
  });

  it("enrolls at the first scheduled routine inside a Serializable transaction", async () => {
    await expect(enrollInProgram(programFormData())).rejects.toBe(mocks.redirectError);

    expect(mocks.findProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "program-1",
          OR: [{ isPublished: true }, { ownerId: "user-1" }],
        },
      }),
    );
    expect(mocks.createEnrollment).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        programId: "program-1",
        startDate: expect.any(Date),
        currentWeek: 2,
        currentDay: 3,
        status: "active",
      },
    });
    expect(mocks.transaction.mock.calls[0]?.[1]).toEqual({
      isolationLevel: "Serializable",
    });
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/dashboard"],
      ["/programs"],
      ["/programs/program-1"],
    ]);
    expect(mocks.redirect).toHaveBeenCalledWith("/programs/program-1");
  });

  it("keeps enrollment in the same active program idempotent", async () => {
    mocks.findActiveEnrollmentInTransaction.mockResolvedValue({
      id: "enrollment-1",
      programId: "program-1",
    });

    await expect(enrollInProgram(programFormData())).rejects.toBe(mocks.redirectError);
    expect(mocks.createEnrollment).not.toHaveBeenCalled();
  });

  it("rejects a second active program", async () => {
    mocks.findActiveEnrollmentInTransaction.mockResolvedValue({
      id: "enrollment-1",
      programId: "program-other",
    });

    await expect(enrollInProgram(programFormData())).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Finish your current training program before enrolling in another.",
    });
    expect(mocks.createEnrollment).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("maps only the active-program unique constraint to a safe conflict", async () => {
    mocks.transaction.mockRejectedValue({
      code: "P2002",
      meta: { target: "ProgramEnrollment_one_active_per_user_key" },
    });

    await expect(enrollInProgram(programFormData())).rejects.toMatchObject({
      code: "CONFLICT",
      message: "You already have an active training program.",
    });
  });

  it("retries a bounded Serializable write conflict", async () => {
    mocks.transaction
      .mockRejectedValueOnce({ code: "P2034" })
      .mockImplementationOnce(
        (callback: (client: typeof transactionClient) => unknown) =>
          callback(transactionClient),
      );

    await expect(enrollInProgram(programFormData())).rejects.toBe(mocks.redirectError);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.createEnrollment).toHaveBeenCalledOnce();
  });

  it("creates the current scheduled routine as an ordinary coordinated workout", async () => {
    mocks.findEnrollment.mockResolvedValue({
      id: "enrollment-1",
      currentWeek: 1,
      currentDay: 2,
      program: {
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                id: "day-2",
                dayNumber: 2,
                routine: {
                  title: "Lower Strength",
                  goal: "Strength",
                  exercises: [
                    { exerciseId: "exercise-1", name: "Squat", order: 0 },
                  ],
                },
              },
            ],
          },
        ],
      },
    });
    mocks.createWorkout.mockResolvedValue({ id: "workout-1" });
    mocks.coordinateActiveWorkout.mockImplementation(
      async ({
        createWorkout,
      }: {
        createWorkout: (
          client: typeof transactionClient,
        ) => Promise<{ id: string }>;
      }) => {
        const workout = await createWorkout(transactionClient);
        return { workoutId: workout.id, created: true };
      },
    );

    await expect(startProgramWorkout(programFormData())).rejects.toBe(
      mocks.redirectError,
    );

    expect(mocks.createWorkout).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        title: "Lower Strength",
        goal: "Strength",
        status: "active",
        exercises: {
          create: [{ exerciseId: "exercise-1", name: "Squat", order: 0 }],
        },
        programWorkout: {
          create: { enrollmentId: "enrollment-1", programDayId: "day-2" },
        },
      }),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/workouts/workout-1");
  });

  it("does not start a routine without an owned active enrollment", async () => {
    mocks.findEnrollment.mockResolvedValue(null);

    await expect(startProgramWorkout(programFormData("forged"))).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "The active training program could not be found.",
    });
    expect(mocks.findEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", programId: "forged", status: "active" },
      }),
    );
    expect(mocks.coordinateActiveWorkout).not.toHaveBeenCalled();
  });
});
