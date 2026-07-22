type WorkoutExperienceSet = {
  reps: number | null;
  weight: number | null;
};

type WorkoutExperienceExercise = {
  exercise?: { trackingType?: string | null } | null;
  sets: readonly WorkoutExperienceSet[];
};

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function deriveWorkoutExperience(
  exercises: readonly WorkoutExperienceExercise[],
  {
    finishedAt,
    now = new Date(),
    personalRecordCount,
    startedAt,
  }: {
    finishedAt: Date | null;
    now?: Date;
    personalRecordCount: number;
    startedAt: Date | null;
  },
) {
  let completedExercises = 0;
  let totalSets = 0;
  let totalVolume = 0;

  for (const exercise of exercises) {
    const isWeighted =
      normalizeTrackingType(exercise.exercise?.trackingType) === "weight_reps";
    if (exercise.sets.length > 0) {
      completedExercises += 1;
    }

    for (const set of exercise.sets) {
      totalSets += 1;
      if (isWeighted && set.weight !== null && set.reps !== null) {
        totalVolume += set.weight * set.reps;
      }
    }
  }

  const durationEnd = finishedAt ?? now;
  const durationMinutes = startedAt
    ? Math.max(1, Math.round((durationEnd.getTime() - startedAt.getTime()) / 60_000))
    : 0;
  const duration = durationMinutes > 0 ? formatMinutes(durationMinutes) : "Not available";

  return {
    completedExercises,
    estimatedDuration:
      duration === "Not available" ? duration : finishedAt ? duration : `~${duration}`,
    personalRecordCount,
    progressPercent:
      exercises.length > 0
        ? Math.round((completedExercises / exercises.length) * 100)
        : 0,
    totalExercises: exercises.length,
    totalSets,
    totalVolume,
  };
}
import { normalizeTrackingType } from "@/lib/exercise-tracking";
