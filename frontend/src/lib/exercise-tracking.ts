export const trackingTypes = [
  "weight_reps",
  "reps_only",
  "time",
  "distance",
  "distance_time",
] as const;

export type TrackingType = (typeof trackingTypes)[number];
export type DistanceUnit = "m" | "km" | "mi";

export type TrackableSet = {
  distance?: number | null;
  distanceUnit?: string | null;
  durationSeconds?: number | null;
  reps?: number | null;
  weight?: number | null;
};

export type ExerciseRecord =
  | { type: "weight"; value: number; label: string; estimatedOneRepMax: number }
  | { type: "reps"; value: number; label: string }
  | { type: "duration"; value: number; label: string }
  | { type: "distance"; value: number; label: string }
  | { type: "pace"; value: number; label: string };

const trackingLabels: Record<TrackingType, string> = {
  weight_reps: "Weight + reps",
  reps_only: "Reps only",
  time: "Time",
  distance: "Distance",
  distance_time: "Distance + time",
};

export function normalizeTrackingType(value?: string | null): TrackingType {
  if (value === "bodyweight_reps" || value === "reps") return "reps_only";
  return trackingTypes.includes(value as TrackingType)
    ? (value as TrackingType)
    : "weight_reps";
}

export function getTrackingTypeLabel(value?: string | null) {
  return trackingLabels[normalizeTrackingType(value)];
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0
    ? `${minutes}:${remainder.toString().padStart(2, "0")}`
    : `${remainder} sec`;
}

export function distanceToMeters(distance: number, unit?: string | null) {
  if (!Number.isFinite(distance) || distance <= 0) return null;
  if (unit === "km") return distance * 1_000;
  if (unit === "mi") return distance * 1_609.344;
  if (unit === "m") return distance;
  return null;
}

function estimateOneRepMax(weight: number, reps: number) {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

export function formatTrackedSet(
  trackingType: string | null | undefined,
  set: TrackableSet,
) {
  const mode = normalizeTrackingType(trackingType);
  if (mode === "reps_only") {
    return set.reps !== null && set.reps !== undefined
      ? `${set.reps} reps`
      : "Reps not logged";
  }
  if (mode === "time") {
    return set.durationSeconds !== null && set.durationSeconds !== undefined
      ? `${set.durationSeconds} sec`
      : "Time not logged";
  }
  if (mode === "distance" || mode === "distance_time") {
    const distance =
      set.distance !== null && set.distance !== undefined
        ? `${set.distance} ${set.distanceUnit ?? "m"}`
        : "Distance not logged";
    if (mode === "distance_time" && set.durationSeconds) {
      return `${distance} in ${formatDuration(set.durationSeconds)}`;
    }
    return distance;
  }
  const weight = set.weight !== null && set.weight !== undefined
    ? `${set.weight} lb`
    : "Weight not logged";
  const reps = set.reps !== null && set.reps !== undefined
    ? `${set.reps} reps`
    : "Reps not logged";
  return `${weight} × ${reps}`;
}

export function calculateExerciseRecord(
  trackingType: string | null | undefined,
  sets: readonly TrackableSet[],
): ExerciseRecord | null {
  const mode = normalizeTrackingType(trackingType);
  let best: ExerciseRecord | null = null;

  for (const set of sets) {
    if (
      mode === "weight_reps" &&
      set.weight !== null &&
      set.weight !== undefined &&
      Number.isFinite(set.weight) &&
      set.weight > 0 &&
      set.reps !== null &&
      set.reps !== undefined &&
      Number.isInteger(set.reps) &&
      set.reps > 0
    ) {
      const estimate = estimateOneRepMax(set.weight, set.reps);
      if (!best || estimate > best.value) {
        best = {
          type: "weight",
          value: estimate,
          estimatedOneRepMax: estimate,
          label: `${set.weight} lb × ${set.reps}`,
        };
      }
    } else if (
      mode === "reps_only" &&
      set.reps !== null &&
      set.reps !== undefined &&
      Number.isInteger(set.reps) &&
      set.reps > 0 &&
      (!best || set.reps > best.value)
    ) {
      best = { type: "reps", value: set.reps, label: `${set.reps} reps` };
    } else if (
      mode === "time" &&
      set.durationSeconds !== null &&
      set.durationSeconds !== undefined &&
      set.durationSeconds > 0 &&
      (!best || set.durationSeconds > best.value)
    ) {
      best = {
        type: "duration",
        value: set.durationSeconds,
        label: `${set.durationSeconds} sec`,
      };
    } else if (mode === "distance" || mode === "distance_time") {
      const meters = distanceToMeters(set.distance ?? 0, set.distanceUnit);
      if (!meters) continue;
      if (mode === "distance" && (!best || meters > best.value)) {
        best = {
          type: "distance",
          value: meters,
          label: `${set.distance} ${set.distanceUnit ?? "m"}`,
        };
      } else if (
        mode === "distance_time" &&
        set.durationSeconds &&
        set.durationSeconds > 0
      ) {
        const pace = set.durationSeconds / meters;
        if (!best || pace < best.value) {
          best = {
            type: "pace",
            value: pace,
            label: `${set.distance} ${set.distanceUnit ?? "m"} in ${formatDuration(set.durationSeconds)}`,
          };
        }
      }
    }
  }

  return best;
}
