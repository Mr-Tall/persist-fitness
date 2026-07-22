import { db } from "@/lib/db";
import { ActionError } from "@/lib/actions/action-error";

export type ProgramScheduleWeek = {
  weekNumber: number;
  days: {
    dayNumber: number;
    id: string;
  }[];
};

export function flattenProgramSchedule(weeks: readonly ProgramScheduleWeek[]) {
  return weeks
    .flatMap((week) =>
      week.days.map((day) => ({
        ...day,
        weekNumber: week.weekNumber,
      })),
    )
    .sort(
      (left, right) =>
        left.weekNumber - right.weekNumber || left.dayNumber - right.dayNumber,
    );
}

export function calculateProgramProgress(
  weeks: readonly ProgramScheduleWeek[],
  enrollment: {
    currentDay: number;
    currentWeek: number;
    status: string;
  },
) {
  const schedule = flattenProgramSchedule(weeks);
  const currentIndex = schedule.findIndex(
    (day) =>
      day.weekNumber === enrollment.currentWeek &&
      day.dayNumber === enrollment.currentDay,
  );
  const completedDays =
    enrollment.status === "completed"
      ? schedule.length
      : currentIndex >= 0
        ? currentIndex
        : 0;

  return {
    completedDays,
    completionPercent:
      schedule.length > 0
        ? Math.round((completedDays / schedule.length) * 100)
        : 0,
    current: currentIndex >= 0 ? schedule[currentIndex] : null,
    totalDays: schedule.length,
  };
}

export async function advanceProgramForCompletedWorkout(
  userId: string,
  workoutId: string,
) {
  return db.$transaction(async (transaction) => {
    const scheduledWorkout = await transaction.programWorkout.findFirst({
      where: {
        workoutId,
        enrollment: {
          userId,
          status: "active",
        },
      },
      select: {
        id: true,
        completedAt: true,
        enrollment: {
          select: { id: true },
        },
        programDay: {
          select: {
            id: true,
            week: {
              select: { programId: true },
            },
          },
        },
      },
    });

    if (!scheduledWorkout || scheduledWorkout.completedAt) {
      return { advanced: false, completed: false };
    }

    const claimed = await transaction.programWorkout.updateMany({
      where: {
        id: scheduledWorkout.id,
        completedAt: null,
      },
      data: { completedAt: new Date() },
    });

    if (claimed.count === 0) {
      return { advanced: false, completed: false };
    }

    const schedule = await transaction.programDay.findMany({
      where: {
        week: { programId: scheduledWorkout.programDay.week.programId },
      },
      orderBy: [{ week: { weekNumber: "asc" } }, { dayNumber: "asc" }],
      select: {
        id: true,
        dayNumber: true,
        week: { select: { weekNumber: true } },
      },
    });
    const currentIndex = schedule.findIndex(
      (day) => day.id === scheduledWorkout.programDay.id,
    );
    if (currentIndex < 0) {
      throw new ActionError({
        code: "CONFLICT",
        message: "The scheduled workout is no longer part of this program.",
      });
    }

    const nextDay = schedule[currentIndex + 1];

    if (nextDay) {
      await transaction.programEnrollment.updateMany({
        where: {
          id: scheduledWorkout.enrollment.id,
          userId,
          status: "active",
        },
        data: {
          currentWeek: nextDay.week.weekNumber,
          currentDay: nextDay.dayNumber,
        },
      });
      return { advanced: true, completed: false };
    }

    await transaction.programEnrollment.updateMany({
      where: {
        id: scheduledWorkout.enrollment.id,
        userId,
        status: "active",
      },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });
    return { advanced: true, completed: true };
  });
}
