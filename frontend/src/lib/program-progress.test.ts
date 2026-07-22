import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findScheduledWorkout: vi.fn(),
  claimScheduledWorkout: vi.fn(),
  findProgramDays: vi.fn(),
  updateEnrollment: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction },
}));

import {
  advanceProgramForCompletedWorkout,
  calculateProgramProgress,
  flattenProgramSchedule,
} from "@/lib/program-progress";

const transactionClient = {
  programWorkout: {
    findFirst: mocks.findScheduledWorkout,
    updateMany: mocks.claimScheduledWorkout,
  },
  programDay: { findMany: mocks.findProgramDays },
  programEnrollment: { updateMany: mocks.updateEnrollment },
};

const schedule = [
  {
    weekNumber: 2,
    days: [{ id: "day-3", dayNumber: 1 }],
  },
  {
    weekNumber: 1,
    days: [
      { id: "day-2", dayNumber: 2 },
      { id: "day-1", dayNumber: 1 },
    ],
  },
];

describe("program progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
  });

  it("orders referenced routine days by week and day", () => {
    expect(flattenProgramSchedule(schedule).map((day) => day.id)).toEqual([
      "day-1",
      "day-2",
      "day-3",
    ]);
  });

  it("calculates progress from the current scheduled day", () => {
    expect(
      calculateProgramProgress(schedule, {
        currentWeek: 1,
        currentDay: 2,
        status: "active",
      }),
    ).toMatchObject({
      completedDays: 1,
      completionPercent: 33,
      current: { id: "day-2", weekNumber: 1, dayNumber: 2 },
      totalDays: 3,
    });
  });

  it("reports completed enrollments at one hundred percent", () => {
    expect(
      calculateProgramProgress(schedule, {
        currentWeek: 2,
        currentDay: 1,
        status: "completed",
      }).completionPercent,
    ).toBe(100);
  });

  it("advances an active enrollment to the next referenced routine", async () => {
    mocks.findScheduledWorkout.mockResolvedValue({
      id: "scheduled-1",
      completedAt: null,
      enrollment: { id: "enrollment-1" },
      programDay: { id: "day-1", week: { programId: "program-1" } },
    });
    mocks.claimScheduledWorkout.mockResolvedValue({ count: 1 });
    mocks.findProgramDays.mockResolvedValue([
      { id: "day-1", dayNumber: 1, week: { weekNumber: 1 } },
      { id: "day-2", dayNumber: 2, week: { weekNumber: 1 } },
    ]);
    mocks.updateEnrollment.mockResolvedValue({ count: 1 });

    await expect(
      advanceProgramForCompletedWorkout("user-1", "workout-1"),
    ).resolves.toEqual({ advanced: true, completed: false });

    expect(mocks.findScheduledWorkout).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workoutId: "workout-1",
          enrollment: { userId: "user-1", status: "active" },
        },
      }),
    );
    expect(mocks.updateEnrollment).toHaveBeenCalledWith({
      where: { id: "enrollment-1", userId: "user-1", status: "active" },
      data: { currentWeek: 1, currentDay: 2 },
    });
  });

  it("completes the enrollment after the final scheduled workout", async () => {
    mocks.findScheduledWorkout.mockResolvedValue({
      id: "scheduled-1",
      completedAt: null,
      enrollment: { id: "enrollment-1" },
      programDay: { id: "day-2", week: { programId: "program-1" } },
    });
    mocks.claimScheduledWorkout.mockResolvedValue({ count: 1 });
    mocks.findProgramDays.mockResolvedValue([
      { id: "day-1", dayNumber: 1, week: { weekNumber: 1 } },
      { id: "day-2", dayNumber: 2, week: { weekNumber: 1 } },
    ]);
    mocks.updateEnrollment.mockResolvedValue({ count: 1 });

    await expect(
      advanceProgramForCompletedWorkout("user-1", "workout-2"),
    ).resolves.toEqual({ advanced: true, completed: true });
    expect(mocks.updateEnrollment).toHaveBeenCalledWith({
      where: { id: "enrollment-1", userId: "user-1", status: "active" },
      data: { status: "completed", completedAt: expect.any(Date) },
    });
  });

  it("does not advance the same completed workout twice", async () => {
    mocks.findScheduledWorkout.mockResolvedValue({
      id: "scheduled-1",
      completedAt: new Date(),
      enrollment: { id: "enrollment-1" },
      programDay: { id: "day-1", week: { programId: "program-1" } },
    });

    await expect(
      advanceProgramForCompletedWorkout("user-1", "workout-1"),
    ).resolves.toEqual({ advanced: false, completed: false });
    expect(mocks.claimScheduledWorkout).not.toHaveBeenCalled();
    expect(mocks.updateEnrollment).not.toHaveBeenCalled();
  });
});
