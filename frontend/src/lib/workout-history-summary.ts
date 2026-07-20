export type WorkoutHistorySet = {
  reps: number | null;
  weight: number | null;
};

export type WorkoutHistoryExercise = {
  exerciseId: string | null;
  name: string;
  sets: WorkoutHistorySet[];
};

export type WorkoutHistoryItem = {
  date: Date;
  exercises: WorkoutHistoryExercise[];
  goal: string | null;
  id: string;
  startedAt?: Date | null;
  status?: string;
  title: string;
};

export type WorkoutHistoryPersonalRecord = {
  estimatedOneRepMax: number;
  exerciseName: string;
  reps: number;
  weight: number;
  workoutDate: Date;
  workoutId: string;
  workoutTitle: string;
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - day);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  return startOfDay(date).toISOString().split("T")[0];
}

function estimateOneRepMax(weight: number, reps: number) {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

function calculateCurrentStreak(workoutDays: Set<string>, now: Date) {
  const sortedDays = Array.from(workoutDays).sort((a, b) => b.localeCompare(a));
  let currentStreak = 0;
  const cursor = startOfDay(now);

  for (const workoutDay of sortedDays) {
    const cursorString = dateKey(cursor);

    if (workoutDay === cursorString) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (currentStreak === 0) {
      const yesterday = startOfDay(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      if (workoutDay === dateKey(yesterday)) {
        currentStreak += 1;
        cursor.setUTCDate(yesterday.getUTCDate() - 1);
      }
    }
  }

  return currentStreak;
}

export function summarizeWorkoutHistory<T extends WorkoutHistoryItem>(
  workouts: readonly T[],
  options: { now?: Date; personalRecordLimit?: number } = {},
) {
  const now = options.now ?? new Date();
  const weekStart = startOfWeek(now);
  const workoutDays = new Set<string>();
  const bestByExercise = new Map<string, WorkoutHistoryPersonalRecord>();
  let activeWorkout: T | null = null;
  let activeWorkoutSetCount = 0;
  let activeWorkoutVolume = 0;
  let workoutsThisWeek = 0;
  let totalSets = 0;
  let totalVolume = 0;

  for (const workout of workouts) {
    let workoutSetCount = 0;
    let workoutVolume = 0;

    if (workout.date >= weekStart) {
      workoutsThisWeek += 1;
    }

    workoutDays.add(dateKey(workout.date));

    const isNewestActiveWorkout =
      workout.status === "active" &&
      (!activeWorkout ||
        (workout.startedAt?.getTime() ?? 0) >
          (activeWorkout.startedAt?.getTime() ?? 0));

    if (isNewestActiveWorkout) {
      activeWorkout = workout;
    }

    for (const exercise of workout.exercises) {
      const exerciseKey = exercise.exerciseId ?? exercise.name.toLowerCase();

      for (const set of exercise.sets) {
        totalSets += 1;
        workoutSetCount += 1;

        if (set.weight !== null && set.reps !== null) {
          const setVolume = set.weight * set.reps;
          totalVolume += setVolume;
          workoutVolume += setVolume;
        }

        if (
          set.weight === null ||
          !Number.isFinite(set.weight) ||
          set.weight <= 0 ||
          set.reps === null ||
          set.reps <= 0
        ) {
          continue;
        }

        const estimatedOneRepMax = estimateOneRepMax(set.weight, set.reps);
        const currentBest = bestByExercise.get(exerciseKey);

        if (!currentBest || estimatedOneRepMax > currentBest.estimatedOneRepMax) {
          bestByExercise.set(exerciseKey, {
            estimatedOneRepMax,
            exerciseName: exercise.name,
            reps: set.reps,
            weight: set.weight,
            workoutDate: workout.date,
            workoutId: workout.id,
            workoutTitle: workout.title,
          });
        }
      }
    }

    if (isNewestActiveWorkout) {
      activeWorkoutSetCount = workoutSetCount;
      activeWorkoutVolume = workoutVolume;
    }
  }

  const personalRecords = Array.from(bestByExercise.values())
    .sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)
    .slice(0, options.personalRecordLimit ?? 5);

  return {
    activeWorkout,
    activeWorkoutSetCount,
    activeWorkoutVolume,
    analytics: {
      currentStreak: calculateCurrentStreak(workoutDays, now),
      recentWorkouts: workouts.slice(0, 3),
      totalSets,
      totalVolume,
      workoutCount: workouts.length,
      workoutsThisWeek,
    },
    personalRecords,
  };
}
