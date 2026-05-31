import { db } from "@/lib/db";

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  const diff = result.getUTCDate() - day;
  result.setUTCDate(diff);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

export async function getDashboardAnalytics(userId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now);

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

  const workoutsThisWeek = workouts.filter(
    (workout) => workout.date >= weekStart
  ).length;

  let totalSets = 0;
  let totalVolume = 0;

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        totalSets += 1;

        if (set.weight !== null && set.reps !== null) {
          totalVolume += set.weight * set.reps;
        }
      }
    }
  }

  const workoutDays = Array.from(
    new Set(
      workouts.map((workout) => {
        const date = startOfDay(workout.date);
        return date.toISOString().split("T")[0];
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  const cursor = startOfDay(now);

  for (const workoutDay of workoutDays) {
    const cursorString = cursor.toISOString().split("T")[0];

    if (workoutDay === cursorString) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (currentStreak === 0) {
      const yesterday = startOfDay(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      if (workoutDay === yesterday.toISOString().split("T")[0]) {
        currentStreak += 1;
        cursor.setUTCDate(yesterday.getUTCDate() - 1);
      }
    }
  }

  return {
    workoutCount: workouts.length,
    workoutsThisWeek,
    totalSets,
    totalVolume,
    currentStreak,
    recentWorkouts: workouts.slice(0, 3),
  };
}