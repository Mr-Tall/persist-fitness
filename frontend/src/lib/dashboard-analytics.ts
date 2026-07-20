import { db } from "@/lib/db";
import { summarizeWorkoutHistory } from "@/lib/workout-history-summary";

export async function getDashboardAnalytics(userId: string) {
  const workouts = await db.workout.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  });

  return summarizeWorkoutHistory(workouts).analytics;
}
