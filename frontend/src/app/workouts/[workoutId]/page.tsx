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
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AddExerciseForm } from "./add-exercise-form";
import { AddSetForm } from "./add-set-form";
import { DeleteWorkoutButton } from "./delete-workout-button";
import { EditSetForm } from "./edit-set-form";
import { PreviousPerformanceCard } from "./previous-performance-card";

type WorkoutDetailPageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="mb-8">
        <Link href="/workouts" className="text-sm font-medium text-emerald-600">
          ← Back to workouts
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-bold">{workout.title}</h1>

            <p className="mt-2 text-neutral-600">
              {formatWorkoutDate(workout.date)} · {workout.goal || "No goal set"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form action={repeatWorkout}>
              <input type="hidden" name="workoutId" value={workout.id} />
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
              >
                Repeat workout
              </button>
            </form>

            <form action={deleteWorkout}>
              <DeleteWorkoutButton workoutId={workout.id} />
            </form>
          </div>
        </div>

        {workout.notes && (
          <p className="mt-4 rounded-2xl bg-neutral-100 p-4 text-neutral-700">
            {workout.notes}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold">Exercises</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Add movements, then log sets with reps, weight, RIR, tempo, and
              notes.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <AddExerciseForm workoutId={workout.id} exercises={libraryExercises} />
        </div>

        {workout.exercises.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
            <h3 className="font-semibold">No exercises added yet</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Add your first exercise above, then start logging sets.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {workout.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{exercise.name}</h3>
                    <p className="text-sm text-neutral-500">
                      {exercise.sets.length} sets logged
                    </p>
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

                {exercise.sets.length > 0 && (
                  <>
                    {/* Mobile set cards */}
                    <div className="mt-4 space-y-3 md:hidden">
                      {exercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-neutral-950">
                                Set {set.setNumber}
                              </p>
                              <p className="mt-1 text-sm text-neutral-600">
                                {set.reps ?? "—"} reps
                                {set.weight !== null
                                  ? ` · ${set.weight} lb`
                                  : ""}
                              </p>
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

                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-xl bg-white p-2">
                              <p className="text-neutral-500">RIR</p>
                              <p className="mt-1 font-semibold text-neutral-950">
                                {set.rir ?? "—"}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-2">
                              <p className="text-neutral-500">Tempo</p>
                              <p className="mt-1 font-semibold text-neutral-950">
                                {set.tempo || "—"}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-2">
                              <p className="text-neutral-500">Notes</p>
                              <p className="mt-1 truncate font-semibold text-neutral-950">
                                {set.notes || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop set table */}
                    <div className="mt-4 hidden overflow-x-auto md:block">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-500">
                            <th className="py-2 pr-4">Set</th>
                            <th className="py-2 pr-4">Reps</th>
                            <th className="py-2 pr-4">Weight</th>
                            <th className="py-2 pr-4">RIR</th>
                            <th className="py-2 pr-4">Tempo</th>
                            <th className="py-2 pr-4">Notes</th>
                            <th className="py-2 pr-4"></th>
                          </tr>
                        </thead>

                        <tbody>
                          {exercise.sets.map((set) => (
                            <tr
                              key={set.id}
                              className="border-b border-neutral-100"
                            >
                              <td className="py-2 pr-4">{set.setNumber}</td>
                              <td className="py-2 pr-4">{set.reps ?? "—"}</td>
                              <td className="py-2 pr-4">
                                {set.weight !== null
                                  ? `${set.weight} lb`
                                  : "—"}
                              </td>
                              <td className="py-2 pr-4">{set.rir ?? "—"}</td>
                              <td className="py-2 pr-4">
                                {set.tempo || "—"}
                              </td>
                              <td className="py-2 pr-4">
                                {set.notes || "—"}
                              </td>
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-2">
                                  <EditSetForm
                                    workoutId={workout.id}
                                    set={set}
                                  />

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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <AddSetForm
                  workoutId={workout.id}
                  workoutExerciseId={exercise.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}