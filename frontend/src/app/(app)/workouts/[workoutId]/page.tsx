
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
import { notFound } from "next/navigation";
import { AddExerciseForm } from "./add-exercise-form";
import { getLatestSetPrefill } from "./add-set-prefill";
import { AddSetForm } from "./add-set-form";
import { CompletionSummary } from "./completion-summary";
import { PreviousPerformanceCard } from "./previous-performance-card";
import { SavedSetFeedbackProvider } from "./saved-set-feedback";
import { WorkoutHeader } from "./workout-header";
import { WorkoutExerciseAccordion } from "./workout-exercise-accordion";
import { WorkoutMobileBar } from "./workout-mobile-bar";
import { SetCard } from "./set-card";

type WorkoutDetailPageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

function calculateWorkoutVolume(
  exercises: {
    sets: {
      weight: number | null;
      reps: number | null;
    }[];
  }[]
) {
  return exercises.reduce((total, exercise) => {
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

function formatVolume(volume: number) {
  return `${Math.round(volume).toLocaleString()} lb`;
}

function formatLatestSetResult(set: {
  weight: number | null;
  reps: number | null;
}) {
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
        });

        return [exercise.id, statuses] as const;
      })
    )
  );

  const totalSets = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  );

  const totalVolume = calculateWorkoutVolume(workout.exercises);
  const isCompleted = workout.status === "completed";
  const duration = formatDuration(workout.startedAt, workout.finishedAt);
  const workoutProgress = Math.min(100, Math.round((totalSets / 12) * 100));

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

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:py-10">
      <WorkoutHeader
        workout={workout}
        totalSets={totalSets}
        totalVolume={formatVolume(totalVolume)}
        duration={duration}
        workoutProgress={workoutProgress}
        isCompleted={isCompleted}
      />

      {isCompleted && (
        <>
          <CompletionSummary
            duration={duration}
            totalSets={totalSets}
            totalVolume={formatVolume(totalVolume)}
            exerciseCount={workout.exercises.length}
            personalRecordCount={personalRecordCount}
          />

          <p
            role="status"
            className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] px-4 py-3 text-sm font-bold leading-6 text-emerald-100"
          >
            Completed workout. Logging controls are unavailable until reopened.
          </p>
        </>
      )}

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
                const exerciseVolume = exercise.sets.reduce((total, set) => {
                  if (set.weight === null || set.reps === null) {
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
                    ? formatLatestSetResult(latestSet)
                    : null,
                  hasPersonalRecord: Array.from(prStatuses.values()).some(
                    (status) => status.isPersonalRecord
                  ),
                  content: (
                    <SavedSetFeedbackProvider>
                      <div className="bg-white/[0.025] p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
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

                        <PreviousPerformanceCard
                          previous={
                            previousPerformanceByExerciseId.get(exercise.id) ??
                            null
                          }
                        />
                      </div>

                      <div className="p-4 sm:p-5">
                        {exercise.sets.length === 0 ? (
                          <EmptyState
                            title={
                              isCompleted ? "No sets recorded" : "No sets logged yet"
                            }
                            description={
                              isCompleted
                                ? "No working sets were saved for this exercise."
                                : "Add your first set below when you finish the lift."
                            }
                          />
                        ) : (
                          <div className="space-y-3">
                            {exercise.sets.map((set) => (
                              <SetCard
                                key={set.id}
                                workoutId={workout.id}
                                set={set}
                                prStatus={prStatuses.get(set.id)}
                                editable={!isCompleted}
                              />
                            ))}
                          </div>
                        )}

                        {!isCompleted && (
                          <AddSetForm
                            workoutId={workout.id}
                            workoutExerciseId={exercise.id}
                            prefill={latestSetPrefill}
                          />
                        )}
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
          totalSets={totalSets}
          duration={duration}
        />
      )}
    </main>
  );
}
