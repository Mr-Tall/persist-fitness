import type { PreviousPerformance } from "@/lib/previous-performance";

export type ProgressionSuggestion = {
  message: string;
  targetWeight: number | null;
  targetReps: number | null;
};

export function getProgressionSuggestion(
  previous: PreviousPerformance | null
): ProgressionSuggestion | null {
  if (!previous || previous.sets.length === 0) {
    return null;
  }

  const bestSet = previous.sets
    .filter((set) => set.weight !== null && set.reps !== null)
    .sort((a, b) => {
      const aScore = (a.weight ?? 0) * (a.reps ?? 0);
      const bScore = (b.weight ?? 0) * (b.reps ?? 0);
      return bScore - aScore;
    })[0];

  if (!bestSet || bestSet.weight === null || bestSet.reps === null) {
    return null;
  }

  if (bestSet.rir !== null && bestSet.rir >= 2) {
    return {
      message: `Last time looked controlled. Try ${bestSet.weight + 5} lb for ${bestSet.reps} reps.`,
      targetWeight: bestSet.weight + 5,
      targetReps: bestSet.reps,
    };
  }

  if (bestSet.rir !== null && bestSet.rir <= 1) {
    return {
      message: `Last time was close to failure. Try matching ${bestSet.weight} lb and aim for ${bestSet.reps + 1} reps.`,
      targetWeight: bestSet.weight,
      targetReps: bestSet.reps + 1,
    };
  }

  return {
    message: `Try to match or slightly beat ${bestSet.weight} lb × ${bestSet.reps} reps from last time.`,
    targetWeight: bestSet.weight,
    targetReps: bestSet.reps,
  };
}