import { db } from "@/lib/db";
import { summarizeWorkoutHistory } from "@/lib/workout-history-summary";

export async function getProgressData(userId: string) {
  const workouts = await db.workout.findMany({
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
          exercise: {
            select: {
              primaryMuscles: true,
              trackingType: true,
            },
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
  });

  const summary = summarizeWorkoutHistory(workouts, {
    includeProgressInsights: true,
    personalRecordLimit: 5,
  });

  if (!summary.progressInsights) {
    throw new Error("Progress insights were not generated.");
  }

  return {
    analytics: summary.analytics,
    insights: summary.progressInsights,
    personalRecords: summary.personalRecords,
  };
}
