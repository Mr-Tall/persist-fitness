import { normalizeTrackingType } from "@/lib/exercise-tracking";
import type { OfflineSetValues } from "./types";

function numberValue(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function textValue(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

export function getOfflineSetValues(
  formData: FormData,
  trackingType?: string | null,
): OfflineSetValues {
  const mode = normalizeTrackingType(trackingType);
  const minutes = numberValue(formData, "minutes") ?? 0;
  const seconds = numberValue(formData, "seconds") ?? 0;
  const durationSeconds = minutes * 60 + seconds;
  return {
    weight: mode === "weight_reps" ? numberValue(formData, "weight") : null,
    reps:
      mode === "weight_reps" || mode === "reps_only"
        ? numberValue(formData, "reps")
        : null,
    durationSeconds:
      (mode === "time" || mode === "distance_time") && durationSeconds > 0
        ? durationSeconds
        : null,
    distance:
      mode === "distance" || mode === "distance_time"
        ? numberValue(formData, "distance")
        : null,
    distanceUnit:
      mode === "distance" || mode === "distance_time"
        ? String(formData.get("distanceUnit") ?? "m")
        : null,
    rir:
      mode === "weight_reps" || mode === "reps_only"
        ? numberValue(formData, "rir")
        : null,
    tempo: mode === "weight_reps" ? textValue(formData, "tempo") : null,
    notes: textValue(formData, "notes"),
  };
}
