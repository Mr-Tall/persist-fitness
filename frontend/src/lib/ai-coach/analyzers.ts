import { normalizeTrackingType } from "@/lib/exercise-tracking";
import type {
  CoachProgramContext,
  CoachWorkout,
} from "./types";

const DAY_MS = 86_400_000;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function estimateOneRepMax(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export type ExerciseTrend = {
  exerciseId?: string;
  exerciseName: string;
  observations: number;
  previousBest: number;
  recentBest: number;
  changePercent: number;
  recentPrCount: number;
};

export type TrendAnalysis = {
  currentVolume: number;
  previousVolume: number;
  volumeChangePercent: number;
  exercises: ExerciseTrend[];
  recentPrCount: number;
};

export type ConsistencyAnalysis = {
  completedWorkoutCount: number;
  workoutsLast28Days: number;
  workoutsPerWeek: number;
  activeWeeks: number;
  consistencyPercent: number;
};

export type FatigueAnalysis = {
  averageRecoveryDays: number;
  shortRecoveryCount: number;
  averageRpe: number | null;
  risk: "low" | "moderate" | "high";
};

export type TrainingBalanceAnalysis = {
  muscleShares: { muscle: string; percent: number; volume: number }[];
  skippedMuscles: string[];
  balancePercent: number;
};

export type ProgramAdherenceAnalysis = {
  completedDays: number;
  expectedDays: number;
  missedDays: number;
  adherencePercent: number;
};

export type CoachAnalysis = {
  consistency: ConsistencyAnalysis;
  fatigue: FatigueAnalysis;
  program: ProgramAdherenceAnalysis | null;
  trainingBalance: TrainingBalanceAnalysis;
  trends: TrendAnalysis;
};

export class TrendAnalyzer {
  analyze(workouts: readonly CoachWorkout[], now: Date): TrendAnalysis {
    const recentStart = now.getTime() - 28 * DAY_MS;
    const previousStart = now.getTime() - 56 * DAY_MS;
    let currentVolume = 0;
    let previousVolume = 0;
    const exerciseSessions = new Map<
      string,
      { id?: string; name: string; date: number; best: number }[]
    >();

    for (const workout of workouts) {
      if (workout.status !== "completed") continue;
      const timestamp = workout.date.getTime();
      for (const exercise of workout.exercises) {
        if (normalizeTrackingType(exercise.exercise?.trackingType) !== "weight_reps") {
          continue;
        }
        let sessionBest = 0;
        for (const set of exercise.sets) {
          if (
            set.weight === null ||
            set.reps === null ||
            !Number.isFinite(set.weight) ||
            !Number.isFinite(set.reps) ||
            set.weight <= 0 ||
            set.reps <= 0
          ) {
            continue;
          }
          const volume = set.weight * set.reps;
          if (timestamp >= recentStart) currentVolume += volume;
          else if (timestamp >= previousStart) previousVolume += volume;
          sessionBest = Math.max(sessionBest, estimateOneRepMax(set.weight, set.reps));
        }
        if (sessionBest > 0 && timestamp >= previousStart) {
          const key = exercise.exerciseId ?? exercise.name.toLowerCase();
          const sessions = exerciseSessions.get(key) ?? [];
          sessions.push({
            id: exercise.exerciseId ?? undefined,
            name: exercise.name,
            date: timestamp,
            best: sessionBest,
          });
          exerciseSessions.set(key, sessions);
        }
      }
    }

    let recentPrCount = 0;
    const exercises = [...exerciseSessions.values()].map((sessions) => {
      sessions.sort((left, right) => left.date - right.date);
      const previous = sessions.filter((session) => session.date < recentStart);
      const recent = sessions.filter((session) => session.date >= recentStart);
      const previousBest = Math.max(0, ...previous.map((session) => session.best));
      const recentBest = Math.max(0, ...recent.map((session) => session.best));
      const isPr = previousBest > 0 && recentBest > previousBest;
      if (isPr) recentPrCount += 1;
      return {
        exerciseId: sessions[0]?.id,
        exerciseName: sessions[0]?.name ?? "Exercise",
        observations: sessions.length,
        previousBest,
        recentBest,
        changePercent:
          previousBest > 0
            ? Number(
                (((recentBest - previousBest) / previousBest) * 100).toFixed(1),
              )
            : 0,
        recentPrCount: isPr ? 1 : 0,
      };
    });

    return {
      currentVolume,
      previousVolume,
      volumeChangePercent:
        previousVolume > 0
          ? ((currentVolume - previousVolume) / previousVolume) * 100
          : 0,
      exercises,
      recentPrCount,
    };
  }
}

export class ConsistencyAnalyzer {
  analyze(workouts: readonly CoachWorkout[], now: Date): ConsistencyAnalysis {
    const completed = workouts
      .filter((workout) => workout.status === "completed")
      .map((workout) => workout.date.getTime());
    const start = now.getTime() - 28 * DAY_MS;
    const recent = completed.filter((date) => date >= start);
    const activeWeeks = new Set(
      recent.map((date) => Math.min(3, Math.floor((now.getTime() - date) / (7 * DAY_MS)))),
    ).size;
    return {
      completedWorkoutCount: completed.length,
      workoutsLast28Days: recent.length,
      workoutsPerWeek: Number((recent.length / 4).toFixed(1)),
      activeWeeks,
      consistencyPercent: Math.round((activeWeeks / 4) * 100),
    };
  }
}

export class FatigueAnalyzer {
  analyze(workouts: readonly CoachWorkout[]): FatigueAnalysis {
    const completed = workouts
      .filter((workout) => workout.status === "completed")
      .sort((left, right) => left.date.getTime() - right.date.getTime());
    const gaps: number[] = [];
    for (let index = 1; index < completed.length; index += 1) {
      gaps.push((completed[index].date.getTime() - completed[index - 1].date.getTime()) / DAY_MS);
    }
    const shortRecoveryCount = gaps.filter((gap) => gap < 1).length;
    const rpes = completed
      .map((workout) => workout.rpe)
      .filter((rpe): rpe is number => typeof rpe === "number" && Number.isFinite(rpe));
    const averageRpe = rpes.length
      ? rpes.reduce((total, rpe) => total + rpe, 0) / rpes.length
      : null;
    const risk =
      shortRecoveryCount >= 2 || (averageRpe !== null && averageRpe >= 9)
        ? "high"
        : shortRecoveryCount >= 1 || (averageRpe !== null && averageRpe >= 8)
          ? "moderate"
          : "low";
    return {
      averageRecoveryDays: gaps.length
        ? Number((gaps.reduce((total, gap) => total + gap, 0) / gaps.length).toFixed(1))
        : 0,
      shortRecoveryCount,
      averageRpe,
      risk,
    };
  }
}

const MAJOR_MUSCLES = ["chest", "back", "shoulders", "quadriceps", "hamstrings", "glutes"];

function normalizeMuscle(muscle: string) {
  const normalized = muscle.trim().toLowerCase();
  if (normalized === "quads") return "quadriceps";
  if (normalized === "lats" || normalized === "middle back" || normalized === "lower back") return "back";
  return normalized;
}

export function analyzeTrainingBalance(
  workouts: readonly CoachWorkout[],
  now: Date,
): TrainingBalanceAnalysis {
  const start = now.getTime() - 28 * DAY_MS;
  const volumes = new Map<string, number>();
  for (const workout of workouts) {
    if (workout.status !== "completed" || workout.date.getTime() < start) continue;
    for (const exercise of workout.exercises) {
      const muscles = exercise.exercise?.primaryMuscles ?? [];
      const exerciseVolume = exercise.sets.reduce((total, set) => {
        if (set.weight === null || set.reps === null || set.weight <= 0 || set.reps <= 0) return total;
        return total + set.weight * set.reps;
      }, 0);
      for (const muscle of muscles) {
        const key = normalizeMuscle(muscle);
        volumes.set(key, (volumes.get(key) ?? 0) + Math.max(exerciseVolume, exercise.sets.length));
      }
    }
  }
  const total = [...volumes.values()].reduce((sum, volume) => sum + volume, 0);
  const muscleShares = [...volumes.entries()]
    .map(([muscle, volume]) => ({
      muscle,
      volume,
      percent: total > 0 ? Math.round((volume / total) * 100) : 0,
    }))
    .sort((left, right) => right.volume - left.volume);
  const skippedMuscles = MAJOR_MUSCLES.filter((muscle) => !volumes.has(muscle));
  const represented = MAJOR_MUSCLES.length - skippedMuscles.length;
  return {
    muscleShares,
    skippedMuscles,
    balancePercent: Math.round((represented / MAJOR_MUSCLES.length) * 100),
  };
}

export function analyzeProgramAdherence(
  context: CoachProgramContext | null | undefined,
  now: Date,
): ProgramAdherenceAnalysis | null {
  if (!context || context.totalDays === 0) return null;
  const elapsedWeeks = Math.max(
    0,
    Math.min(
      context.plannedDaysByWeek.length,
      Math.floor((now.getTime() - context.startDate.getTime()) / (7 * DAY_MS)),
    ),
  );
  const expectedDays = context.plannedDaysByWeek
    .slice(0, elapsedWeeks)
    .reduce((sum, count) => sum + count, 0);
  const missedDays = Math.max(0, expectedDays - context.completedDays);
  return {
    completedDays: context.completedDays,
    expectedDays,
    missedDays,
    adherencePercent:
      expectedDays > 0
        ? Math.round(clamp(context.completedDays / expectedDays) * 100)
        : 100,
  };
}

export function analyzeCoachInputs(
  workouts: readonly CoachWorkout[],
  program: CoachProgramContext | null | undefined,
  now: Date,
): CoachAnalysis {
  return {
    trends: new TrendAnalyzer().analyze(workouts, now),
    consistency: new ConsistencyAnalyzer().analyze(workouts, now),
    fatigue: new FatigueAnalyzer().analyze(workouts),
    trainingBalance: analyzeTrainingBalance(workouts, now),
    program: analyzeProgramAdherence(program, now),
  };
}
