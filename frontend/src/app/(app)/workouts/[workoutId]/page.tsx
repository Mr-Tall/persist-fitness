
import {
  deleteExerciseFromWorkout,
} from "@/app/actions/workout-exercises";
import { DeleteInlineButton } from "./delete-inline-button";
import { requireUserId } from "@/lib/auth/require-user";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricBadge } from "@/components/ui/metric-badge";
import { Section } from "@/components/ui/section";
import { db } from "@/lib/db";
import { getPreviousPerformanceForExercise } from "@/lib/previous-performance";
import { getSetPrStatuses } from "@/lib/set-pr-status";
import { deriveWorkoutExperience } from "@/lib/workout-experience";
import { notFound } from "next/navigation";
import { AddExerciseForm } from "./add-exercise-form";
import { getLatestSetPrefill } from "./add-set-prefill";
import { CompletionSummary } from "./completion-summary";
import { WorkoutHealthSync } from "@/components/health/workout-health-sync";
import { PreviousPerformanceCard } from "./previous-performance-card";
import { SavedSetFeedbackProvider } from "./saved-set-feedback";
import { WorkoutHeader } from "./workout-header";
import { WorkoutExerciseAccordion } from "./workout-exercise-accordion";
import { WorkoutMobileBar } from "./workout-mobile-bar";
import { WorkoutExperienceProvider } from "./workout-experience-provider";
import { OfflineSetCollection } from "./offline-set-collection";
import { snapshotKey } from "@/lib/offline-workout/types";
import { createSnapshotExpiration } from "@/lib/offline-workout/storage";
import { WorkoutSyncIndicator } from "./workout-sync-indicator";
import { OfflineWorkoutCleanup } from "./offline-workout-cleanup";
import {
  formatTrackedSet,
  normalizeTrackingType,
} from "@/lib/exercise-tracking";

type WorkoutDetailPageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

function formatVolume(volume: number) {
  return `${Math.round(volume).toLocaleString()} lb`;
}

function formatLatestSetResult(trackingType: string | null | undefined, set: {
  weight: number | null;
  reps: number | null;
  durationSeconds?: number | null;
  distance?: number | null;
  distanceUnit?: string | null;
}) {
  if (normalizeTrackingType(trackingType) !== "weight_reps") {
    return formatTrackedSet(trackingType, set);
  }
  const weight = set.weight !== null ? `${set.weight} lb` : "—";
  const reps = set.reps !== null ? set.reps : "—";
  return `${weight} × ${reps}`;
}

function formatDuration(startedAt: Date | null, finishedAt: Date | null) {
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

export default async function WorkoutDetailPage({
  params,
}: WorkoutDetailPageProps) {
  const userId = await requireUserId();
  const { workoutId } = await params;

  const workout = await db.workout.findFirst({
    where: {
      id: workoutId,
      userId: userId,
    },
    include: {
      exercises: {
        include: {
          exercise: {
            select: { trackingType: true },
          },
          sets: {
            orderBy: {
              setNumber: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!workout) {
    notFound();
  }

  const libraryExercisesRaw = await db.exercise.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      equipment: true,
      primaryMuscles: true,
      secondaryMuscles: true,
      force: true,
      level: true,
      mechanic: true,
      movementPattern: true,
      exerciseType: true,
      laterality: true,
      trackingType: true,
      instructions: true,
      tips: true,
      aliases: true,
      images: true,
      thumbnailUrl: true,
      favoritedBy: {
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  const libraryExercises = libraryExercisesRaw.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    equipment: exercise.equipment,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    force: exercise.force,
    level: exercise.level,
    mechanic: exercise.mechanic,
    movementPattern: exercise.movementPattern,
    exerciseType: exercise.exerciseType,
    laterality: exercise.laterality,
    trackingType: exercise.trackingType,
    instructions: exercise.instructions,
    tips: exercise.tips,
    aliases: exercise.aliases,
    images: exercise.images,
    thumbnailUrl: exercise.thumbnailUrl,
    isFavorite: exercise.favoritedBy.length > 0,
  }));

  const previousPerformanceByExerciseId = new Map(
    await Promise.all(
      workout.exercises.map(async (exercise) => {
        const previous = await getPreviousPerformanceForExercise({
          userId: userId,
          currentWorkoutId: workout.id,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.name,
          trackingType: exercise.exercise?.trackingType,
        });

        return [exercise.id, previous] as const;
      })
    )
  );

  const prStatusByExerciseId = new Map(
    await Promise.all(
      workout.exercises.map(async (exercise) => {
        const statuses = await getSetPrStatuses({
          userId: userId,
          currentWorkoutId: workout.id,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.name,
          trackingType: exercise.exercise?.trackingType,
        });

        return [exercise.id, statuses] as const;
      })
    )
  );

  const isCompleted = workout.status === "completed";
  const duration = formatDuration(workout.startedAt, workout.finishedAt);

  const personalRecordCount = Array.from(prStatusByExerciseId.values()).reduce(
    (total, statuses) => {
      return (
        total +
        Array.from(statuses.values()).filter((status) => status.isPersonalRecord)
          .length
      );
    },
    0
  );

  const experience = deriveWorkoutExperience(workout.exercises, {
    startedAt: workout.startedAt,
    finishedAt: workout.finishedAt,
    personalRecordCount,
  });
  const totalVolume = formatVolume(experience.totalVolume);
  const snapshotSavedAt = workout.updatedAt.getTime();
  const offlineSnapshot = !isCompleted
    ? {
        key: snapshotKey(userId, workout.id),
        userId,
        workoutId: workout.id,
        title: workout.title,
        startedAt: workout.startedAt.toISOString(),
        serverUpdatedAt: workout.updatedAt.toISOString(),
        status: "active" as const,
        savedAt: snapshotSavedAt,
        expiresAt: createSnapshotExpiration(snapshotSavedAt),
        exercises: workout.exercises.map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          order: exercise.order,
          trackingType: normalizeTrackingType(exercise.exercise?.trackingType),
          sets: exercise.sets.map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            durationSeconds: set.durationSeconds,
            distance: set.distance,
            distanceUnit: set.distanceUnit,
            rir: set.rir,
            tempo: set.tempo,
            notes: set.notes,
            pending: false,
          })),
        })),
      }
    : null;

  return (
    <WorkoutExperienceProvider initialSnapshot={offlineSnapshot}>
      <main className="mx-auto max-w-5xl px-4 pb-[calc(var(--mobile-nav-height)_+_7rem)] pt-6 sm:px-6 sm:py-10">
      {isCompleted && <OfflineWorkoutCleanup userId={userId} workoutId={workout.id} />}
      <WorkoutHeader
        workout={workout}
        completedExercises={experience.completedExercises}
        totalExercises={experience.totalExercises}
        totalSets={experience.totalSets}
        totalVolume={totalVolume}
        personalRecordCount={experience.personalRecordCount}
        estimatedDuration={experience.estimatedDuration}
        duration={duration}
        workoutProgress={experience.progressPercent}
        isCompleted={isCompleted}
      />

      {isCompleted && (
        <>
          <CompletionSummary
            duration={duration}
            totalSets={experience.totalSets}
            totalVolume={totalVolume}
            exerciseCount={workout.exercises.length}
            personalRecordCount={personalRecordCount}
          />

          <p
            role="status"
            className="mt-4 rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-bold leading-6 text-success"
          >
            Completed workout. Logging controls are unavailable until reopened.
          </p>

          {workout.startedAt && workout.finishedAt && (
            <WorkoutHealthSync
              workout={{
                externalId: workout.id,
                title: workout.title,
                startedAt: workout.startedAt.toISOString(),
                endedAt: workout.finishedAt.toISOString(),
                durationSeconds: Math.max(
                  0,
                  Math.round(
                    (workout.finishedAt.getTime() - workout.startedAt.getTime()) /
                      1000,
                  ),
                ),
              }}
            />
          )}
        </>
      )}

      {!isCompleted && <WorkoutSyncIndicator />}

      <Section
        className="mt-6"
        eyebrow={isCompleted ? "Workout history" : "Build session"}
        title="Exercises"
        description={
          isCompleted
            ? "Review the movements, sets, and performance saved with this workout."
            : "Add movements, log working sets, and keep your previous performance in view."
        }
      >
        {!isCompleted && (
          <AddExerciseForm workoutId={workout.id} exercises={libraryExercises} />
        )}

        {workout.exercises.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={
                isCompleted ? "No exercises recorded" : "No exercises added yet"
              }
              description={
                isCompleted
                  ? "This workout was completed without any logged exercises."
                  : "Add your first exercise above, then start logging sets."
              }
            />
          </div>
        ) : (
          <div className="mt-6">
            <WorkoutExerciseAccordion
              isCompleted={isCompleted}
              items={workout.exercises.map((exercise) => {
                const prStatuses =
                  prStatusByExerciseId.get(exercise.id) ?? new Map();
                const trackingType = normalizeTrackingType(
                  exercise.exercise?.trackingType,
                );
                const exerciseVolume = exercise.sets.reduce((total, set) => {
                  if (
                    trackingType !== "weight_reps" ||
                    set.weight === null ||
                    set.reps === null
                  ) {
                    return total;
                  }

                  return total + set.weight * set.reps;
                }, 0);
                const latestSet = exercise.sets.reduce<
                  (typeof exercise.sets)[number] | null
                >(
                  (latest, set) =>
                    latest === null || set.setNumber > latest.setNumber
                      ? set
                      : latest,
                  null
                );
                const latestSetPrefill = getLatestSetPrefill(exercise.sets);

                return {
                  id: exercise.id,
                  name: exercise.name,
                  setCount: exercise.sets.length,
                  latestResult: latestSet
                    ? formatLatestSetResult(trackingType, latestSet)
                    : null,
                  hasPersonalRecord: Array.from(prStatuses.values()).some(
                    (status) => status.isPersonalRecord
                  ),
                  content: (
                    <SavedSetFeedbackProvider>
                      <div className="bg-white/[0.025] p-4 sm:p-5">
                        <PreviousPerformanceCard
                          previous={
                            previousPerformanceByExerciseId.get(exercise.id) ??
                            null
                          }
                        />
                      </div>

                      <div className="p-4 sm:p-5">
                        <OfflineSetCollection
                          workoutId={workout.id}
                          workoutExerciseId={exercise.id}
                          trackingType={exercise.exercise?.trackingType}
                          initialSets={exercise.sets}
                          prefill={latestSetPrefill}
                          isCompleted={isCompleted}
                          prStatuses={Array.from(prStatuses.entries())}
                        />

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <MetricBadge>{formatVolume(exerciseVolume)}</MetricBadge>

                          {!isCompleted && (
                            <form action={deleteExerciseFromWorkout}>
                              <input
                                type="hidden"
                                name="workoutId"
                                value={workout.id}
                              />
                              <input
                                type="hidden"
                                name="workoutExerciseId"
                                value={exercise.id}
                              />
                              <DeleteInlineButton
                                label="Delete exercise"
                                confirmMessage={`Delete ${exercise.name} and all of its sets?`}
                              />
                            </form>
                          )}
                        </div>
                      </div>
                    </SavedSetFeedbackProvider>
                  ),
                };
              })}
            />
          </div>
        )}
      </Section>

      {!isCompleted && (
        <WorkoutMobileBar
          workoutId={workout.id}
          workoutStatus={workout.status}
          totalSets={experience.totalSets}
          duration={duration}
        />
      )}
      </main>
    </WorkoutExperienceProvider>
  );
}
