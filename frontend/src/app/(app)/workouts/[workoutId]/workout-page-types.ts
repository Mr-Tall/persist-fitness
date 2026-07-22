export type WorkoutSetForPage = {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  durationSeconds?: number | null;
  distance?: number | null;
  distanceUnit?: string | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
  pending?: boolean;
};

export type WorkoutExerciseForPage = {
  id: string;
  exerciseId: string | null;
  name: string;
  order: number;
  exercise?: { trackingType: string | null } | null;
  sets: WorkoutSetForPage[];
};

export type WorkoutForPage = {
  id: string;
  title: string;
  goal: string | null;
  notes: string | null;
  date: Date;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  exercises: WorkoutExerciseForPage[];
};

export type LibraryExerciseForPage = {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  force?: string | null;
  level?: string | null;
  mechanic?: string | null;
  movementPattern?: string | null;
  exerciseType?: string | null;
  laterality?: string | null;
  trackingType?: string | null;
  instructions?: string[];
  tips?: string[];
  aliases?: string[];
  images?: string[];
  thumbnailUrl?: string | null;
  isFavorite: boolean;
};
