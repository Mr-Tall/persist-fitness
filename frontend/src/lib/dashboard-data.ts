import { db } from "@/lib/db";
import { summarizeWorkoutHistory } from "@/lib/workout-history-summary";

export async function getDashboardData(userId: string) {
  const [user, workouts] = await Promise.all([
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
        exercises: {
          select: {
            exerciseId: true,
            name: true,
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
  ]);

  if (!user) {
    throw new Error("Authenticated dashboard user was not found.");
  }

  const summary = summarizeWorkoutHistory(workouts, {
    personalRecordLimit: 5,
  });

  return {
    activeWorkout: summary.activeWorkout,
    activeWorkoutSetCount: summary.activeWorkoutSetCount,
    activeWorkoutVolume: summary.activeWorkoutVolume,
    analytics: summary.analytics,
    onboardingCompletedAt: user.onboardingCompletedAt,
    personalRecords: summary.personalRecords,
    profile: user.profile,
    routineCount: user._count.templates,
  };
}
