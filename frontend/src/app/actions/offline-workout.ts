"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { normalizeTrackingType } from "@/lib/exercise-tracking";
import type {
  OfflineConflictCode,
  OfflineSyncResult,
  OfflineWorkoutMutation,
} from "@/lib/offline-workout/types";
import {
  MAX_DISTANCE,
  MAX_DURATION_MINUTES,
  MAX_NOTES_LENGTH,
  MAX_REPS,
  MAX_RIR,
  MAX_TEMPO_LENGTH,
  MAX_WEIGHT,
} from "@/lib/validation/workout";

const MAX_ATTEMPTS = 3;
const valuesSchema = z.object({
  weight: z.number().finite().min(0).max(MAX_WEIGHT).nullable(),
  reps: z.number().int().min(0).max(MAX_REPS).nullable(),
  durationSeconds: z.number().int().positive().max(MAX_DURATION_MINUTES * 60).nullable(),
  distance: z.number().finite().positive().max(MAX_DISTANCE).nullable(),
  distanceUnit: z.enum(["m", "km", "mi"]).nullable(),
  rir: z.number().int().min(0).max(MAX_RIR).nullable(),
  tempo: z.string().trim().max(MAX_TEMPO_LENGTH).nullable(),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).nullable(),
});
const mutationSchema = z.object({
  clientMutationId: z.string().min(1).max(200),
  workoutId: z.string().min(1).max(200),
  workoutExerciseId: z.string().min(1).max(200),
  trackingType: z.enum(["weight_reps", "reps_only", "time", "distance", "distance_time"]),
  operation: z.enum(["add", "edit", "delete"]),
  targetSetId: z.string().min(1).max(200).nullable(),
  temporarySetId: z.string().min(1).max(200).nullable(),
  values: valuesSchema.nullable(),
  clientTimestamp: z.number().finite(),
  baseUpdatedAt: z.string().datetime().nullable(),
});

function conflict(code: OfflineConflictCode, message: string): OfflineSyncResult {
  return { status: "conflict", code, message };
}

function valuesMatchTrackingType(
  trackingType: string | null | undefined,
  values: z.infer<typeof valuesSchema> | null,
) {
  if (!values) return false;
  const mode = normalizeTrackingType(trackingType);
  if (mode === "weight_reps") {
    return values.weight !== null || values.reps !== null || values.rir !== null ||
      values.tempo !== null || values.notes !== null;
  }
  if (mode === "reps_only") return values.reps !== null || values.rir !== null || values.notes !== null;
  if (mode === "time") return values.durationSeconds !== null || values.notes !== null;
  if (mode === "distance") return values.distance !== null || values.notes !== null;
  return values.distance !== null || values.durationSeconds !== null || values.notes !== null;
}

function scopedValues(
  trackingType: string | null | undefined,
  values: z.infer<typeof valuesSchema>,
) {
  const mode = normalizeTrackingType(trackingType);
  return {
    weight: mode === "weight_reps" ? values.weight : null,
    reps: mode === "weight_reps" || mode === "reps_only" ? values.reps : null,
    durationSeconds: mode === "time" || mode === "distance_time" ? values.durationSeconds : null,
    distance: mode === "distance" || mode === "distance_time" ? values.distance : null,
    distanceUnit: mode === "distance" || mode === "distance_time" ? (values.distanceUnit ?? "m") : null,
    rir: mode === "weight_reps" || mode === "reps_only" ? values.rir : null,
    tempo: mode === "weight_reps" ? values.tempo : null,
    notes: values.notes,
  };
}

async function runSerializable<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      const retryable = typeof error === "object" && error !== null && "code" in error &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt === MAX_ATTEMPTS) throw error;
    }
  }
  throw new Error("Offline mutation transaction exited unexpectedly.");
}

export async function syncOfflineWorkoutMutation(
  input: OfflineWorkoutMutation,
): Promise<OfflineSyncResult> {
  const userId = await requireUserId();
  const parsed = mutationSchema.safeParse(input);
  if (!parsed.success) {
    return conflict("INVALID_TRACKING", "This change no longer matches the exercise tracking format.");
  }

  const result = await runSerializable(async (transaction) => {
    const receipts = await transaction.$queryRaw<Array<{ resultSetId: string | null }>>`
      SELECT "resultSetId"
      FROM "OfflineWorkoutMutationReceipt"
      WHERE "id" = ${parsed.data.clientMutationId} AND "userId" = ${userId}
      LIMIT 1
    `;
    if (receipts[0]) {
      return { status: "already_applied" as const, serverSetId: receipts[0].resultSetId };
    }

    const workout = await transaction.workout.findFirst({
      where: { id: parsed.data.workoutId, userId },
      select: { status: true },
    });
    if (!workout || workout.status !== "active") {
      return conflict("WORKOUT_FINISHED", "This workout was finished or changed on another device.");
    }

    const exercise = await transaction.workoutExercise.findFirst({
      where: { id: parsed.data.workoutExerciseId, workoutId: parsed.data.workoutId },
      select: { id: true, exercise: { select: { trackingType: true } } },
    });
    if (!exercise) {
      return conflict("EXERCISE_DELETED", "This exercise is no longer in the workout. Your offline change was kept.");
    }
    if (normalizeTrackingType(exercise.exercise?.trackingType) !== parsed.data.trackingType) {
      return conflict("INVALID_TRACKING", "This exercise's tracking format changed. Your offline values were kept.");
    }

    let serverSetId: string | null = null;
    if (parsed.data.operation === "add") {
      if (!valuesMatchTrackingType(exercise.exercise?.trackingType, parsed.data.values)) {
        return conflict("INVALID_TRACKING", "This set no longer matches the exercise tracking format.");
      }
      const maximum = await transaction.workoutSet.aggregate({
        where: { workoutExerciseId: exercise.id },
        _max: { setNumber: true },
      });
      const created = await transaction.workoutSet.create({
        data: {
          workoutExerciseId: exercise.id,
          setNumber: (maximum._max.setNumber ?? 0) + 1,
          ...scopedValues(exercise.exercise?.trackingType, parsed.data.values!),
        },
        select: { id: true },
      });
      serverSetId = created.id;
    } else {
      const target = await transaction.workoutSet.findFirst({
        where: {
          id: parsed.data.targetSetId ?? "",
          workoutExerciseId: exercise.id,
        },
        select: { id: true, setNumber: true },
      });
      if (!target) {
        return conflict("SET_DELETED", "This set was deleted elsewhere. Your offline change was kept.");
      }
      serverSetId = target.id;
      if (parsed.data.operation === "edit") {
        if (!valuesMatchTrackingType(exercise.exercise?.trackingType, parsed.data.values)) {
          return conflict("INVALID_TRACKING", "This set no longer matches the exercise tracking format.");
        }
        await transaction.workoutSet.update({
          where: { id: target.id },
          data: scopedValues(exercise.exercise?.trackingType, parsed.data.values!),
        });
      } else {
        const laterSets = await transaction.workoutSet.findMany({
          where: { workoutExerciseId: exercise.id, setNumber: { gt: target.setNumber } },
          select: { id: true, setNumber: true },
          orderBy: { setNumber: "asc" },
        });
        await transaction.workoutSet.delete({ where: { id: target.id } });
        for (const laterSet of laterSets) {
          await transaction.workoutSet.update({
            where: { id: laterSet.id },
            data: { setNumber: laterSet.setNumber - 1 },
          });
        }
        serverSetId = null;
      }
    }

    await transaction.$executeRaw`
      INSERT INTO "OfflineWorkoutMutationReceipt"
        ("id", "userId", "workoutId", "operation", "resultSetId", "createdAt")
      VALUES
        (${parsed.data.clientMutationId}, ${userId}, ${parsed.data.workoutId}, ${parsed.data.operation}, ${serverSetId}, NOW())
    `;
    return { status: "applied" as const, serverSetId };
  });

  if (result.status !== "conflict") revalidatePath(`/workouts/${parsed.data.workoutId}`);
  return result;
}
