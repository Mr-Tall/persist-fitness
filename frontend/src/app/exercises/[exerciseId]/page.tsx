import { auth } from "@/auth";
import { FavoriteExerciseButton } from "@/app/exercises/favorite-exercise-button";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { formatWorkoutDate } from "@/lib/format-date";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

type ExerciseDetailPageProps = {
  params: Promise<{
    exerciseId: string;
  }>;
};

function estimateOneRepMax(weight: number, reps: number) {
  if (reps <= 1) {
    return weight;
  }

  return weight * (1 + reps / 30);
}

export default async function ExerciseDetailPage({
  params,
}: ExerciseDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { exerciseId } = await params;

  const exercise = await db.exercise.findUnique({
    where: {
      id: exerciseId,
    },
    include: {
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

  if (!exercise) {
    notFound();
  }

  const loggedExercises = await db.workoutExercise.findMany({
    where: {
      exerciseId: exercise.id,
      workout: {
        userId: session.user.id,
      },
    },
    orderBy: {
      workout: {
        date: "desc",
      },
    },
    include: {
      workout: {
        select: {
          id: true,
          title: true,
          date: true,
          goal: true,
        },
      },
      sets: {
        orderBy: {
          setNumber: "asc",
        },
      },
    },
  });

  const bestSet = loggedExercises
    .flatMap((loggedExercise) =>
      loggedExercise.sets
        .filter((set) => set.weight !== null && set.reps !== null)
        .map((set) => ({
          workoutId: loggedExercise.workout.id,
          workoutTitle: loggedExercise.workout.title,
          workoutDate: loggedExercise.workout.date,
          setNumber: set.setNumber,
          weight: set.weight as number,
          reps: set.reps as number,
          estimatedOneRepMax: estimateOneRepMax(
            set.weight as number,
            set.reps as number
          ),
        }))
    )
    .sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/exercises" className="text-sm font-medium text-emerald-600">
        ← Back to exercises
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow="Exercise"
          title={exercise.name}
          description={`${exercise.equipment || "No equipment"} · ${
            exercise.mechanic || "Movement"
          } · ${exercise.category || "Training"}`}
          action={
            <FavoriteExerciseButton
              exerciseId={exercise.id}
              isFavorite={exercise.favoritedBy.length > 0}
            />
          }
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Times logged</p>
          <h2 className="mt-2 text-2xl font-bold">{loggedExercises.length}</h2>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Best set</p>
          <h2 className="mt-2 text-2xl font-bold">
            {bestSet ? `${bestSet.weight} × ${bestSet.reps}` : "—"}
          </h2>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Estimated 1RM</p>
          <h2 className="mt-2 text-2xl font-bold">
            {bestSet ? `${Math.round(bestSet.estimatedOneRepMax)} lb` : "—"}
          </h2>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Muscles</h2>

            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-500">Primary</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {exercise.primaryMuscles.length > 0 ? (
                  exercise.primaryMuscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {muscle}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">Not listed</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-500">Secondary</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {exercise.secondaryMuscles.length > 0 ? (
                  exercise.secondaryMuscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {muscle}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">Not listed</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Instructions</h2>

            {exercise.instructions.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">
                No instructions listed yet.
              </p>
            ) : (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-neutral-600">
                {exercise.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Performance history</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Past workouts where you logged this exercise from the library.
          </p>

          {loggedExercises.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-center">
              <p className="font-medium">No history yet</p>
              <p className="mt-2 text-sm text-neutral-600">
                Add this exercise to a workout and log sets to build history.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {loggedExercises.map((loggedExercise) => (
                <Link
                  key={loggedExercise.id}
                  href={`/workouts/${loggedExercise.workout.id}`}
                  className="block rounded-2xl border border-neutral-200 p-4 transition hover:border-neutral-400 hover:bg-neutral-50"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold">
                        {loggedExercise.workout.title}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {formatWorkoutDate(loggedExercise.workout.date)} ·{" "}
                        {loggedExercise.workout.goal || "No goal set"}
                      </p>
                    </div>

                    <p className="text-sm font-medium text-neutral-600">
                      {loggedExercise.sets.length} sets
                    </p>
                  </div>

                  {loggedExercise.sets.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {loggedExercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
                        >
                          <span className="font-semibold">
                            Set {set.setNumber}:
                          </span>{" "}
                          {set.reps ?? "—"} reps
                          {set.weight !== null ? ` · ${set.weight} lb` : ""}
                          {set.rir !== null ? ` · RIR ${set.rir}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}