import { db } from "@/lib/db";
import Link from "next/link";
import { requireUserId } from "@/lib/auth/require-user";
import { formatWorkoutDate } from "@/lib/format-date";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function WorkoutsPage() {
  const userId = await requireUserId();

  const workouts = await db.workout.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Workouts"
        title="Training log"
        description="View your past sessions, continue tracking progress, and build consistency one workout at a time."
        action={
          <Link
            href="/workouts/new"
            className="inline-flex w-full justify-center rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800 sm:w-auto"
          >
            New workout
          </Link>
        }
      />

      {workouts.length === 0 ? (
        <EmptyState
          title="No workouts logged yet"
          description="Create your first workout to start building a training history."
          action={
            <Link
              href="/workouts/new"
              className="inline-block rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600"
            >
              Log first workout
            </Link>
          }
        />
      ) : (
        <section className="grid gap-4">
          {workouts.map((workout) => {
            const setCount = workout.exercises.reduce(
              (total, exercise) => total + exercise.sets.length,
              0
            );

            return (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{workout.title}</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatWorkoutDate(workout.date)} ·{" "}
                      {workout.goal || "No goal set"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
                    {workout.exercises.length} exercises · {setCount} sets
                  </div>
                </div>

                {workout.notes && (
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    {workout.notes}
                  </p>
                )}
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}