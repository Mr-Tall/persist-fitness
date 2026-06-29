import { deleteWorkout, repeatWorkout } from "@/app/actions/workouts";
import {
  deleteExerciseFromWorkout,
  deleteSetFromExercise,
} from "@/app/actions/workout-exercises";
import { DeleteInlineButton } from "@/app/workouts/[workoutId]/delete-inline-button";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatWorkoutDate } from "@/lib/format-date";
import { getPreviousPerformanceForExercise } from "@/lib/previous-performance";
import { getSetPrStatuses } from "@/lib/set-pr-status";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AddExerciseForm } from "./add-exercise-form";
import { AddSetForm } from "./add-set-form";
import { DeleteWorkoutButton } from "./delete-workout-button";
import { EditSetForm } from "./edit-set-form";
import { EditWorkoutForm } from "./edit-workout-form";
import { FinishWorkoutButton } from "./finish-workout-button";
import { PreviousPerformanceCard } from "./previous-performance-card";

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
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      if (set.weight === null || set.reps === null) {
        return setTotal;
      }

      return setTotal + set.weight * set.reps;
    }, 0);

    return total + exerciseVolume;
  }, 0);
}

function formatVolume(volume: number) {
  return `${Math.round(volume).toLocaleString()} lb`;
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
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workoutId } = await params;

  const workout = await db.workout.findFirst({
    where: {
      id: workoutId,
      userId: session.user.id,
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
          userId: session.user.id,
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
          userId: session.user.id,
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
          userId: session.user.id,
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

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-7">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.20),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.10),transparent_30%)]" />

        <Link href="/workouts" className="text-sm font-bold text-emerald-300">
          ← Back to workouts
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
              Workout mode
            </p>

            <h1 className="mt-3 bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
              {workout.title}
            </h1>

            <p className="mt-3 text-sm font-medium text-neutral-400">
              {formatWorkoutDate(workout.date)} · {workout.goal || "No goal set"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[420px] sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                Exercises
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {workout.exercises.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                Sets
              </p>
              <p className="mt-1 text-2xl font-black text-white">{totalSets}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                Volume
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {formatVolume(totalVolume)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                Status
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {isCompleted ? "Done" : "Active"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <FinishWorkoutButton workoutId={workout.id} status={workout.status} />

          <form action={repeatWorkout}>
            <input type="hidden" name="workoutId" value={workout.id} />
            <button
              type="submit"
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 sm:w-auto"
            >
              Repeat workout
            </button>
          </form>

          <form action={deleteWorkout}>
            <DeleteWorkoutButton workoutId={workout.id} />
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${
              isCompleted
                ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                : "border-amber-300/30 bg-amber-400/10 text-amber-200"
            }`}
          >
            {isCompleted ? "Completed" : "Active session"}
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-neutral-300">
            {duration}
          </span>
        </div>

        <EditWorkoutForm
          workout={{
            id: workout.id,
            title: workout.title,
            goal: workout.goal,
            notes: workout.notes,
            date: workout.date,
          }}
        />

        {workout.notes && (
          <p className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-neutral-300">
            {workout.notes}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Build session
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Exercises</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              Add movements, log working sets, and keep your previous
              performance in view.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <AddExerciseForm workoutId={workout.id} exercises={libraryExercises} />
        </div>

        {workout.exercises.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <h3 className="font-black text-white">No exercises added yet</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Add your first exercise above, then start logging sets.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {workout.exercises.map((exercise, exerciseIndex) => {
              const prStatuses =
                prStatusByExerciseId.get(exercise.id) ?? new Map();

              const exerciseVolume = exercise.sets.reduce((total, set) => {
                if (set.weight === null || set.reps === null) {
                  return total;
                }

                return total + set.weight * set.reps;
              }, 0);

              return (
                <article
                  key={exercise.id}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-sm backdrop-blur"
                >
                  <div className="border-b border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-neutral-500">
                          Exercise {exerciseIndex + 1}
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-white">
                          {exercise.name}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-neutral-300">
                            {exercise.sets.length} sets
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-neutral-300">
                            {formatVolume(exerciseVolume)}
                          </span>
                        </div>
                      </div>

                      <form action={deleteExerciseFromWorkout}>
                        <input type="hidden" name="workoutId" value={workout.id} />
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
                    </div>

                    <PreviousPerformanceCard
                      previous={
                        previousPerformanceByExerciseId.get(exercise.id) ?? null
                      }
                    />
                  </div>

                  <div className="p-5">
                    {exercise.sets.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                        <p className="font-black text-white">
                          No sets logged yet
                        </p>
                        <p className="mt-2 text-sm leading-6 text-neutral-400">
                          Add your first set below when you finish the lift.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exercise.sets.map((set) => {
                          const prStatus = prStatuses.get(set.id);

                          return (
                            <div
                              key={set.id}
                              className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-black text-black">
                                    {set.setNumber}
                                  </div>

                                  <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                                      Set {set.setNumber}
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-white">
                                      {set.weight !== null
                                        ? `${set.weight} lb`
                                        : "—"}{" "}
                                      <span className="text-neutral-500">×</span>{" "}
                                      {set.reps ?? "—"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <EditSetForm workoutId={workout.id} set={set} />

                                  <form action={deleteSetFromExercise}>
                                    <input
                                      type="hidden"
                                      name="workoutId"
                                      value={workout.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="workoutSetId"
                                      value={set.id}
                                    />
                                    <DeleteInlineButton
                                      label="Delete"
                                      confirmMessage={`Delete set ${set.setNumber}?`}
                                    />
                                  </form>
                                </div>
                              </div>

                              {prStatus?.isPersonalRecord && (
                                <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/[0.10] px-4 py-3 text-sm font-black text-amber-200">
                                  New PR 🎉 est. 1RM{" "}
                                  {Math.round(
                                    prStatus.estimatedOneRepMax ?? 0
                                  )}{" "}
                                  lb
                                </div>
                              )}

                              <div className="mt-4 grid grid-cols-3 gap-2 text-xs sm:grid-cols-4">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
                                    Reps
                                  </p>
                                  <p className="mt-1 text-lg font-black text-white">
                                    {set.reps ?? "—"}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
                                    RIR
                                  </p>
                                  <p className="mt-1 text-lg font-black text-white">
                                    {set.rir ?? "—"}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
                                    Tempo
                                  </p>
                                  <p className="mt-1 truncate text-lg font-black text-white">
                                    {set.tempo || "—"}
                                  </p>
                                </div>

                                <div className="col-span-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:col-span-1">
                                  <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
                                    Notes
                                  </p>
                                  <p className="mt-1 truncate text-sm font-bold text-white">
                                    {set.notes || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <AddSetForm
                      workoutId={workout.id}
                      workoutExerciseId={exercise.id}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed bottom-20 left-4 right-4 z-40 rounded-3xl border border-white/10 bg-black/80 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
              Sets
            </p>
            <p className="mt-1 text-sm font-black text-white">{totalSets}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
              Volume
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {formatVolume(totalVolume)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
              Status
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {isCompleted ? "Done" : "Active"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}