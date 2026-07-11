export type WorkoutSetForPage = {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
};

export type WorkoutExerciseForPage = {
  id: string;
  exerciseId: string | null;
  name: string;
  order: number;
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
  isFavorite: boolean;
};