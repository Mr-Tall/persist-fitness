export type VolumeSet = {
  weight: number | null;
  reps: number | null;
};

export type VolumeExercise = {
  trackingType?: string | null;
  sets: VolumeSet[];
};

export function calculateWorkoutVolume(exercises: VolumeExercise[]) {
  return exercises.reduce((total, exercise) => {
    if (normalizeTrackingType(exercise.trackingType) !== "weight_reps") {
      return total;
    }
    return (
      total +
      exercise.sets.reduce((setTotal, set) => {
        if (set.weight === null || set.reps === null) {
          return setTotal;
        }

        return setTotal + set.weight * set.reps;
      }, 0)
    );
  }, 0);
}

export function calculateWorkoutProgress(totalSets: number, targetSets = 12) {
  if (targetSets <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((totalSets / targetSets) * 100)));
}

export function formatWorkoutDuration(
  startedAt: Date | null,
  finishedAt: Date | null
) {
  if (!startedAt || !finishedAt) {
    return "In progress";
  }

  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}
import { normalizeTrackingType } from "@/lib/exercise-tracking";
