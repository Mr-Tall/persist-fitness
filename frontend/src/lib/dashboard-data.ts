import { db } from "@/lib/db";
import { summarizeWorkoutHistory } from "@/lib/workout-history-summary";
import { calculateProgramProgress } from "@/lib/program-progress";
import { createCoachReport } from "@/lib/ai-coach";

export async function getDashboardData(userId: string) {
  const [user, workouts, activeProgramEnrollment] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompletedAt: true,
        profile: true,
        _count: {
          select: { templates: true },
        },
      },
    }),
    db.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        goal: true,
        date: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        rpe: true,
        exercises: {
          select: {
            exerciseId: true,
            name: true,
            exercise: {
              select: { primaryMuscles: true, trackingType: true },
            },
            sets: {
              select: {
                weight: true,
                reps: true,
              },
            },
          },
        },
      },
    }),
    db.programEnrollment.findFirst({
      where: { userId, status: "active" },
      select: {
        id: true,
        startDate: true,
        currentWeek: true,
        currentDay: true,
        status: true,
        program: {
          select: {
            id: true,
            name: true,
            weeks: {
              orderBy: { weekNumber: "asc" },
              select: {
                weekNumber: true,
                days: {
                  orderBy: { dayNumber: "asc" },
                  select: {
                    id: true,
                    dayNumber: true,
                    routine: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!user) {
    throw new Error("Authenticated dashboard user was not found.");
  }

  const summary = summarizeWorkoutHistory(workouts, {
    personalRecordLimit: 5,
  });
  const programProgress = activeProgramEnrollment
    ? calculateProgramProgress(
        activeProgramEnrollment.program.weeks,
        activeProgramEnrollment,
      )
    : null;
  const nextProgramDay = programProgress?.current
    ? activeProgramEnrollment?.program.weeks
        .find((week) => week.weekNumber === programProgress.current?.weekNumber)
        ?.days.find((day) => day.dayNumber === programProgress.current?.dayNumber)
    : null;
  const coach = createCoachReport({
    workouts,
    program:
      activeProgramEnrollment && programProgress
        ? {
            startDate: activeProgramEnrollment.startDate,
            completedDays: programProgress.completedDays,
            totalDays: programProgress.totalDays,
            plannedDaysByWeek: activeProgramEnrollment.program.weeks.map(
              (week) => week.days.length,
            ),
          }
        : null,
  });

  return {
    activeWorkout: summary.activeWorkout,
    activeWorkoutSetCount: summary.activeWorkoutSetCount,
    activeWorkoutVolume: summary.activeWorkoutVolume,
    analytics: summary.analytics,
    coach,
    currentProgram:
      activeProgramEnrollment && programProgress
        ? {
            enrollmentId: activeProgramEnrollment.id,
            id: activeProgramEnrollment.program.id,
            name: activeProgramEnrollment.program.name,
            currentWeek: activeProgramEnrollment.currentWeek,
            currentDay: activeProgramEnrollment.currentDay,
            completionPercent: programProgress.completionPercent,
            nextWorkout: nextProgramDay?.routine ?? null,
          }
        : null,
    onboardingCompletedAt: user.onboardingCompletedAt,
    personalRecords: summary.personalRecords,
    profile: user.profile,
    routineCount: user._count.templates,
  };
}
