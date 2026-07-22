import { formatWorkoutDate } from "@/lib/format-date";
import { db } from "@/lib/db";
import { estimateOneRepMax } from "@/lib/workout-history-summary";
import {
  calculateExerciseRecord,
  formatTrackedSet,
  normalizeTrackingType,
} from "@/lib/exercise-tracking";

export type ExerciseLibraryHistorySet = {
  reps: number | null;
  weight: number | null;
  rir: number | null;
  setNumber: number;
  durationSeconds?: number | null;
  distance?: number | null;
  distanceUnit?: string | null;
};

export type ExerciseLibrarySource = {
  aliases: string[];
  category: string | null;
  equipment: string | null;
  exerciseType: string | null;
  force: string | null;
  id: string;
  images: string[];
  instructions: string[];
  laterality: string | null;
  level: string | null;
  mechanic: string | null;
  movementPattern: string | null;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  thumbnailUrl: string | null;
  tips: string[];
  trackingType: string | null;
  favoritedBy: { id: string }[];
  workoutExercises: {
    workout: {
      date: Date;
      id: string;
      title: string;
    };
    sets: ExerciseLibraryHistorySet[];
  }[];
};

export type ExerciseLibraryCardData = Omit<
  ExerciseLibrarySource,
  "favoritedBy" | "workoutExercises"
> & {
  isFavorite: boolean;
  isRecentlyUsed: boolean;
  isRecommended: boolean;
  lastPerformed: null | {
    dateLabel: string;
    workoutHref: string;
    workoutTitle: string;
  };
  lastPerformance: string | null;
  personalRecord: null | {
    estimatedOneRepMax?: number;
    label: string;
    workoutHref: string;
  };
  relatedExercises: { id: string; name: string }[];
};

function formatSet(exercise: ExerciseLibrarySource, set: ExerciseLibraryHistorySet) {
  if (normalizeTrackingType(exercise.trackingType) !== "weight_reps") {
    const tracked = formatTrackedSet(exercise.trackingType, set);
    return set.rir === null ? tracked : `${tracked} · RIR ${set.rir}`;
  }
  const result = [
    set.weight === null ? null : `${set.weight} lb`,
    set.reps === null ? null : `${set.reps} reps`,
    set.rir === null ? null : `RIR ${set.rir}`,
  ].filter(Boolean);

  return result.length > 0 ? result.join(" · ") : null;
}

function metadataTokens(exercise: ExerciseLibrarySource) {
  return Array.from(
    new Set([
      ...exercise.primaryMuscles.map((value) => `primary:${value.toLowerCase()}`),
      ...exercise.secondaryMuscles.map((value) => `secondary:${value.toLowerCase()}`),
      exercise.equipment ? `equipment:${exercise.equipment.toLowerCase()}` : null,
      exercise.movementPattern
        ? `movement:${exercise.movementPattern.toLowerCase()}`
        : null,
      exercise.exerciseType ? `type:${exercise.exerciseType.toLowerCase()}` : null,
      exercise.mechanic ? `mechanic:${exercise.mechanic.toLowerCase()}` : null,
    ].filter((token): token is string => token !== null)),
  );
}

function tokenWeight(token: string) {
  if (token.startsWith("primary:")) return 4;
  if (token.startsWith("movement:")) return 3;
  if (token.startsWith("equipment:")) return 2;
  if (token.startsWith("type:") || token.startsWith("mechanic:")) return 2;
  return 1;
}

export function prepareExerciseLibrary(exercises: ExerciseLibrarySource[]) {
  const recentDates = new Map<string, number>();
  const cards = exercises.map<ExerciseLibraryCardData>((exercise) => {
    let latestUsage: ExerciseLibrarySource["workoutExercises"][number] | null = null;
    let personalRecord: ExerciseLibraryCardData["personalRecord"] = null;
    let personalRecordDate: Date | null = null;
    let personalRecordValue: number | null = null;

    for (const usage of exercise.workoutExercises) {
      if (!latestUsage || usage.workout.date > latestUsage.workout.date) {
        latestUsage = usage;
      }

      for (const set of usage.sets) {
        if (normalizeTrackingType(exercise.trackingType) !== "weight_reps") {
          const record = calculateExerciseRecord(exercise.trackingType, [set]);
          if (!record) continue;
          const isBetter =
            personalRecordValue === null ||
            (record.type === "pace"
              ? record.value < personalRecordValue
              : record.value > personalRecordValue);
          if (
            isBetter ||
            (record.value === personalRecordValue &&
              (!personalRecordDate || usage.workout.date > personalRecordDate))
          ) {
            personalRecord = {
              label: record.label,
              workoutHref: `/workouts/${usage.workout.id}`,
            };
            personalRecordValue = record.value;
            personalRecordDate = usage.workout.date;
          }
          continue;
        }

        if (
          set.weight === null ||
          !Number.isFinite(set.weight) ||
          set.weight <= 0 ||
          set.reps === null ||
          !Number.isInteger(set.reps) ||
          set.reps <= 0
        ) {
          continue;
        }

        const estimatedOneRepMax = estimateOneRepMax(set.weight, set.reps);
        if (
          !personalRecord ||
          estimatedOneRepMax > (personalRecord.estimatedOneRepMax ?? 0) ||
          (estimatedOneRepMax === personalRecord.estimatedOneRepMax &&
            (!personalRecordDate || usage.workout.date > personalRecordDate))
        ) {
          personalRecord = {
            estimatedOneRepMax,
            label: `${set.weight} lb × ${set.reps}`,
            workoutHref: `/workouts/${usage.workout.id}`,
          };
          personalRecordDate = usage.workout.date;
        }
      }
    }

    if (latestUsage) {
      recentDates.set(exercise.id, latestUsage.workout.date.getTime());
    }

    const latestSet = latestUsage?.sets.reduce<ExerciseLibraryHistorySet | null>(
      (latest, set) =>
        latest === null || set.setNumber > latest.setNumber ? set : latest,
      null,
    );

    const { favoritedBy, workoutExercises: _workoutExercises, ...metadata } = exercise;
    void _workoutExercises;

    return {
      ...metadata,
      isFavorite: favoritedBy.length > 0,
      isRecentlyUsed: false,
      isRecommended: false,
      lastPerformed: latestUsage
        ? {
            dateLabel: formatWorkoutDate(latestUsage.workout.date),
            workoutHref: `/workouts/${latestUsage.workout.id}`,
            workoutTitle: latestUsage.workout.title,
          }
        : null,
      lastPerformance: latestSet ? formatSet(exercise, latestSet) : null,
      personalRecord,
      relatedExercises: [],
    };
  });

  const recentIds = new Set(
    Array.from(recentDates.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([exerciseId]) => exerciseId),
  );
  const byId = new Map(cards.map((exercise) => [exercise.id, exercise]));
  const tokenIndex = new Map<string, string[]>();

  for (const exercise of exercises) {
    for (const token of metadataTokens(exercise)) {
      tokenIndex.set(token, [...(tokenIndex.get(token) ?? []), exercise.id]);
    }
  }

  for (const source of exercises) {
    const scores = new Map<string, number>();
    for (const token of metadataTokens(source)) {
      for (const candidateId of tokenIndex.get(token) ?? []) {
        if (candidateId !== source.id) {
          scores.set(candidateId, (scores.get(candidateId) ?? 0) + tokenWeight(token));
        }
      }
    }

    const card = byId.get(source.id);
    if (card) {
      card.relatedExercises = Array.from(scores.entries())
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 3)
        .flatMap(([id]) => {
          const related = byId.get(id);
          return related ? [{ id, name: related.name }] : [];
        });
    }
  }

  const recommendationIds = new Set<string>();
  for (const card of cards) {
    card.isRecentlyUsed = recentIds.has(card.id);
    if (card.isFavorite || card.isRecentlyUsed) {
      for (const related of card.relatedExercises) {
        recommendationIds.add(related.id);
      }
    }
  }

  for (const card of cards) {
    card.isRecommended =
      recommendationIds.has(card.id) && !card.isFavorite && !card.isRecentlyUsed;
  }

  return cards.sort(
    (left, right) =>
      (recentDates.get(right.id) ?? 0) - (recentDates.get(left.id) ?? 0) ||
      left.name.localeCompare(right.name),
  );
}

export async function getExerciseLibraryData(userId: string) {
  const exercises = await db.exercise.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      force: true,
      level: true,
      mechanic: true,
      equipment: true,
      primaryMuscles: true,
      secondaryMuscles: true,
      instructions: true,
      category: true,
      images: true,
      movementPattern: true,
      exerciseType: true,
      laterality: true,
      tips: true,
      aliases: true,
      thumbnailUrl: true,
      trackingType: true,
      favoritedBy: {
        where: { userId },
        select: { id: true },
      },
      workoutExercises: {
        where: { workout: { userId } },
        select: {
          workout: {
            select: { id: true, title: true, date: true },
          },
          sets: {
            orderBy: { setNumber: "asc" },
            select: {
              setNumber: true,
              reps: true,
              weight: true,
              rir: true,
              durationSeconds: true,
              distance: true,
              distanceUnit: true,
            },
          },
        },
      },
    },
  });

  return prepareExerciseLibrary(exercises);
}
