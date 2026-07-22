import { normalizeTrackingType } from "@/lib/exercise-tracking";

export type WorkoutHistorySet = {
  reps: number | null;
  weight: number | null;
};

export type WorkoutHistoryExercise = {
  exercise?: {
    primaryMuscles: readonly string[];
    trackingType?: string | null;
  } | null;
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

export type ProgressTrend = {
  changePercent: number | null;
  currentVolume: number;
  direction: "negative" | "neutral" | "positive";
  previousVolume: number;
};

export type RecentPersonalRecord = WorkoutHistoryPersonalRecord & {
  prType: "Estimated 1RM";
};

export type MuscleDistributionItem = {
  muscle: string;
  percentage: number;
  volume: number;
};

export type ExerciseImprovement = {
  changePercent: number;
  currentEstimatedOneRepMax: number;
  exerciseName: string;
  previousEstimatedOneRepMax: number;
  workoutId: string;
};

export type ProgressInsights = {
  biggestImprovements: ExerciseImprovement[];
  monthlyVolume: ProgressTrend;
  muscleDistribution: MuscleDistributionItem[];
  personalRecordCount: number;
  recentPersonalRecords: RecentPersonalRecord[];
  weeklyVolume: ProgressTrend;
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

export function estimateOneRepMax(weight: number, reps: number) {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

function daysBefore(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

function buildTrend(currentVolume: number, previousVolume: number): ProgressTrend {
  const changePercent =
    previousVolume > 0
      ? ((currentVolume - previousVolume) / previousVolume) * 100
      : currentVolume > 0
        ? null
        : 0;

  return {
    changePercent,
    currentVolume,
    direction:
      currentVolume > previousVolume
        ? "positive"
        : currentVolume < previousVolume
          ? "negative"
          : "neutral",
    previousVolume,
  };
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
  options: {
    includeProgressInsights?: boolean;
    now?: Date;
    personalRecordLimit?: number;
  } = {},
) {
  const now = options.now ?? new Date();
  const weekStart = startOfWeek(now);
  const sevenDaysAgo = daysBefore(now, 7);
  const fourteenDaysAgo = daysBefore(now, 14);
  const thirtyDaysAgo = daysBefore(now, 30);
  const sixtyDaysAgo = daysBefore(now, 60);
  const workoutDays = new Set<string>();
  const bestByExercise = new Map<string, WorkoutHistoryPersonalRecord>();
  const recentPersonalRecords: RecentPersonalRecord[] = [];
  const muscleVolume = new Map<string, number>();
  const currentExerciseBests = new Map<
    string,
    { exerciseName: string; value: number; workoutId: string }
  >();
  const previousExerciseBests = new Map<string, number>();
  let activeWorkout: T | null = null;
  let activeWorkoutSetCount = 0;
  let activeWorkoutVolume = 0;
  let workoutsThisWeek = 0;
  let totalSets = 0;
  let totalVolume = 0;
  let currentWeeklyVolume = 0;
  let previousWeeklyVolume = 0;
  let currentMonthlyVolume = 0;
  let previousMonthlyVolume = 0;

  for (let workoutIndex = workouts.length - 1; workoutIndex >= 0; workoutIndex -= 1) {
    const workout = workouts[workoutIndex];
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
      const isWeighted =
        normalizeTrackingType(exercise.exercise?.trackingType) === "weight_reps";

      for (const set of exercise.sets) {
        totalSets += 1;
        workoutSetCount += 1;

        if (isWeighted && set.weight !== null && set.reps !== null) {
          const setVolume = set.weight * set.reps;
          totalVolume += setVolume;
          workoutVolume += setVolume;

          if (options.includeProgressInsights && setVolume > 0) {
            if (workout.date >= sevenDaysAgo && workout.date <= now) {
              currentWeeklyVolume += setVolume;
            } else if (workout.date >= fourteenDaysAgo && workout.date < sevenDaysAgo) {
              previousWeeklyVolume += setVolume;
            }

            if (workout.date >= thirtyDaysAgo && workout.date <= now) {
              currentMonthlyVolume += setVolume;
              const muscles = exercise.exercise?.primaryMuscles ?? [];
              const volumePerMuscle = muscles.length
                ? setVolume / muscles.length
                : 0;

              for (const muscle of muscles) {
                muscleVolume.set(
                  muscle,
                  (muscleVolume.get(muscle) ?? 0) + volumePerMuscle,
                );
              }
            } else if (
              workout.date >= sixtyDaysAgo &&
              workout.date < thirtyDaysAgo
            ) {
              previousMonthlyVolume += setVolume;
            }
          }
        }

        if (
          !isWeighted ||
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
        const isNewRecord =
          !currentBest || estimatedOneRepMax > currentBest.estimatedOneRepMax;
        const shouldReplaceBest =
          isNewRecord ||
          (currentBest !== undefined &&
            estimatedOneRepMax === currentBest.estimatedOneRepMax &&
            workout.date > currentBest.workoutDate);

        if (shouldReplaceBest) {
          const record = {
            estimatedOneRepMax,
            exerciseName: exercise.name,
            reps: set.reps,
            weight: set.weight,
            workoutDate: workout.date,
            workoutId: workout.id,
            workoutTitle: workout.title,
          };
          bestByExercise.set(exerciseKey, record);

          if (options.includeProgressInsights && isNewRecord) {
            recentPersonalRecords.push({
              ...record,
              prType: "Estimated 1RM",
            });
          }
        }

        if (options.includeProgressInsights) {
          if (workout.date >= thirtyDaysAgo && workout.date <= now) {
            const currentPeriodBest = currentExerciseBests.get(exerciseKey);
            if (!currentPeriodBest || estimatedOneRepMax > currentPeriodBest.value) {
              currentExerciseBests.set(exerciseKey, {
                exerciseName: exercise.name,
                value: estimatedOneRepMax,
                workoutId: workout.id,
              });
            }
          } else if (
            workout.date >= sixtyDaysAgo &&
            workout.date < thirtyDaysAgo
          ) {
            previousExerciseBests.set(
              exerciseKey,
              Math.max(
                previousExerciseBests.get(exerciseKey) ?? 0,
                estimatedOneRepMax,
              ),
            );
          }
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

  let progressInsights: ProgressInsights | null = null;

  if (options.includeProgressInsights) {
    const classifiedVolume = Array.from(muscleVolume.values()).reduce(
      (total, volume) => total + volume,
      0,
    );
    const muscleDistribution = Array.from(muscleVolume.entries())
      .map(([muscle, volume]) => ({
        muscle,
        percentage:
          classifiedVolume > 0 ? (volume / classifiedVolume) * 100 : 0,
        volume,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6);
    const biggestImprovements = Array.from(currentExerciseBests.entries())
      .flatMap(([exerciseKey, current]) => {
        const previous = previousExerciseBests.get(exerciseKey);
        if (!previous || current.value <= previous) {
          return [];
        }

        return [
          {
            changePercent: ((current.value - previous) / previous) * 100,
            currentEstimatedOneRepMax: current.value,
            exerciseName: current.exerciseName,
            previousEstimatedOneRepMax: previous,
            workoutId: current.workoutId,
          },
        ];
      })
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 3);

    progressInsights = {
      biggestImprovements,
      monthlyVolume: buildTrend(currentMonthlyVolume, previousMonthlyVolume),
      muscleDistribution,
      personalRecordCount: bestByExercise.size,
      recentPersonalRecords: recentPersonalRecords
        .sort((a, b) => b.workoutDate.getTime() - a.workoutDate.getTime())
        .slice(0, 5),
      weeklyVolume: buildTrend(currentWeeklyVolume, previousWeeklyVolume),
    };
  }

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
    progressInsights,
  };
}
