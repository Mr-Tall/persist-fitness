export type AddSetPrefill = {
  weight: number | null;
  reps: number | null;
  rir: number | null;
  tempo: string | null;
  durationSeconds?: number | null;
  distance?: number | null;
  distanceUnit?: string | null;
};

type SavedSetForPrefill = AddSetPrefill & {
  setNumber: number;
};

export function getLatestSetPrefill(
  sets: SavedSetForPrefill[]
): AddSetPrefill | undefined {
  const latestSet = sets.reduce<SavedSetForPrefill | undefined>(
    (latest, set) =>
      latest === undefined || set.setNumber > latest.setNumber ? set : latest,
    undefined
  );

  if (!latestSet) {
    return undefined;
  }

  return {
    weight: latestSet.weight,
    reps: latestSet.reps,
    rir: latestSet.rir,
    tempo: latestSet.tempo,
    durationSeconds: latestSet.durationSeconds,
    distance: latestSet.distance,
    distanceUnit: latestSet.distanceUnit,
  };
}
