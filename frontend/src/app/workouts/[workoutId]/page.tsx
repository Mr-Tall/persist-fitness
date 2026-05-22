import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatWorkoutDate } from "@/lib/format-date";

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
          sets: true,
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
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="mb-8">
        <Link href="/workouts" className="text-sm font-medium text-emerald-600">
          ← Back to workouts
        </Link>

        <h1 className="mt-4 text-3xl font-bold">{workout.title}</h1>

        <p className="mt-2 text-neutral-600">
          {formatWorkoutDate(workout.date)} · {workout.goal || "No goal set"}
        </p>

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
              Exercise and set logging comes next.
            </p>
          </div>

          <button
            disabled
            className="rounded-xl bg-neutral-200 px-5 py-3 font-semibold text-neutral-500"
          >
            Add exercise soon
          </button>
        </div>

        {workout.exercises.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
            <h3 className="font-semibold">No exercises added yet</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Next we’ll build the flow for adding exercises, sets, reps, weight, and RIR.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-semibold">{exercise.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {exercise.sets.length} sets
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}