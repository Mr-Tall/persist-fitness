import { z } from "zod";
import {
  boundedIdSchema,
  optionalNumberSchema,
  optionalTrimmedStringSchema,
} from "@/lib/validation/common";

export const MAX_WORKOUT_TITLE_LENGTH = 100;
export const MAX_WORKOUT_GOAL_LENGTH = 200;
export const MAX_NOTES_LENGTH = 2_000;
export const MAX_TEMPO_LENGTH = 30;
export const MAX_WEIGHT = 10_000;
export const MAX_REPS = 10_000;
export const MAX_RIR = 10;

export const workoutTitleSchema = z
  .string()
  .trim()
  .min(1, "Workout title is required.")
  .max(
    MAX_WORKOUT_TITLE_LENGTH,
    `Workout title must be ${MAX_WORKOUT_TITLE_LENGTH} characters or fewer.`
  );

export const optionalWorkoutGoalSchema = optionalTrimmedStringSchema(
  MAX_WORKOUT_GOAL_LENGTH,
  `Workout goal must be ${MAX_WORKOUT_GOAL_LENGTH} characters or fewer.`
);

export const optionalNotesSchema = optionalTrimmedStringSchema(
  MAX_NOTES_LENGTH,
  `Notes must be ${MAX_NOTES_LENGTH.toLocaleString()} characters or fewer.`
);

export const optionalTempoSchema = optionalTrimmedStringSchema(
  MAX_TEMPO_LENGTH,
  `Tempo must be ${MAX_TEMPO_LENGTH} characters or fewer.`
);

export const optionalExerciseNameSchema = optionalTrimmedStringSchema(
  MAX_WORKOUT_TITLE_LENGTH,
  `Exercise name must be ${MAX_WORKOUT_TITLE_LENGTH} characters or fewer.`
);

function isValidIsoCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const isoCalendarDateSchema = z
  .string()
  .trim()
  .refine(isValidIsoCalendarDate, "Enter a valid workout date.");

export const optionalWeightSchema = optionalNumberSchema(
  z
    .number()
    .finite("Weight must be a finite number.")
    .min(0, "Weight cannot be negative.")
    .max(MAX_WEIGHT, `Weight cannot exceed ${MAX_WEIGHT.toLocaleString()}.`)
);

export const optionalRepsSchema = optionalNumberSchema(
  z
    .number()
    .finite("Reps must be a finite number.")
    .int("Reps must be a whole number.")
    .min(0, "Reps cannot be negative.")
    .max(MAX_REPS, `Reps cannot exceed ${MAX_REPS.toLocaleString()}.`)
);

export const optionalRirSchema = optionalNumberSchema(
  z
    .number()
    .finite("RIR must be a finite number.")
    .int("RIR must be a whole number.")
    .min(0, "RIR cannot be negative.")
    .max(MAX_RIR, `RIR cannot exceed ${MAX_RIR}.`)
);

export const createWorkoutSchema = z.object({
  title: workoutTitleSchema,
  goal: optionalWorkoutGoalSchema,
  notes: optionalNotesSchema,
  date: isoCalendarDateSchema,
});

export const updateWorkoutSchema = createWorkoutSchema.extend({
  workoutId: boundedIdSchema,
});

export const workoutIdSchema = z.object({
  workoutId: boundedIdSchema,
});

export const addExerciseSchema = z.object({
  workoutId: boundedIdSchema,
  exerciseId: optionalTrimmedStringSchema(200, "Exercise ID is too long."),
  name: optionalExerciseNameSchema,
});

const setValueSchemas = {
  reps: optionalRepsSchema,
  weight: optionalWeightSchema,
  rir: optionalRirSchema,
  tempo: optionalTempoSchema,
  notes: optionalNotesSchema,
};

export const addSetSchema = z.object({
  workoutId: boundedIdSchema,
  workoutExerciseId: boundedIdSchema,
  ...setValueSchemas,
});

export const updateSetSchema = z.object({
  workoutId: boundedIdSchema,
  workoutSetId: boundedIdSchema,
  ...setValueSchemas,
});

export const deleteExerciseSchema = z.object({
  workoutId: boundedIdSchema,
  workoutExerciseId: boundedIdSchema,
});

export const deleteSetSchema = z.object({
  workoutId: boundedIdSchema,
  workoutSetId: boundedIdSchema,
});
