import { auth } from "@/auth";
import { deleteWorkout } from "@/app/actions/workouts";
import { db } from "@/lib/db";
import { formatWorkoutDate } from "@/lib/format-date";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AddExerciseForm } from "./add-exercise-form";
import { AddSetForm } from "./add-set-form";
import { DeleteWorkoutButton } from "./delete-workout-button";

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

          <form action={deleteWorkout}>
            <DeleteWorkoutButton workoutId={workout.id} />
          </form>
        </div>

        {workout.notes && (
          <p className="mt-4 rounded-2xl bg-neutral-100 p-4 text-neutral-700">
            {workout.notes}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold">Exercises</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Add movements, then log sets with reps, weight, RIR, tempo, and notes.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <AddExerciseForm workoutId={workout.id} />
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
                className="rounded-2xl border border-neutral-200 p-5"
              >
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{exercise.name}</h3>
                    <p className="text-sm text-neutral-500">
                      {exercise.sets.length} sets logged
                    </p>
                  </div>
                </div>

                {exercise.sets.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-500">
                          <th className="py-2 pr-4">Set</th>
                          <th className="py-2 pr-4">Reps</th>
                          <th className="py-2 pr-4">Weight</th>
                          <th className="py-2 pr-4">RIR</th>
                          <th className="py-2 pr-4">Tempo</th>
                          <th className="py-2 pr-4">Notes</th>
                        </tr>
                      </thead>

                      <tbody>
                        {exercise.sets.map((set) => (
                          <tr key={set.id} className="border-b border-neutral-100">
                            <td className="py-2 pr-4">{set.setNumber}</td>
                            <td className="py-2 pr-4">{set.reps ?? "—"}</td>
                            <td className="py-2 pr-4">
                              {set.weight !== null ? `${set.weight} lb` : "—"}
                            </td>
                            <td className="py-2 pr-4">{set.rir ?? "—"}</td>
                            <td className="py-2 pr-4">{set.tempo || "—"}</td>
                            <td className="py-2 pr-4">{set.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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