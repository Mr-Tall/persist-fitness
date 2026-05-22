import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WorkoutsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workouts = await db.workout.findMany({
    where: {
      userId: session.user.id,
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-600">
            Workouts
          </p>
          <h1 className="mt-3 text-3xl font-bold">Training log</h1>
          <p className="mt-3 text-neutral-600">
            View your past sessions and start building a history of consistency.
          </p>
        </div>

        <Link
          href="/workouts/new"
          className="rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
        >
          New workout
        </Link>
      </section>

      {workouts.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-neutral-300 p-10 text-center">
          <h2 className="text-xl font-semibold">No workouts logged yet</h2>
          <p className="mt-3 text-neutral-600">
            Create your first workout to start tracking your training.
          </p>
          <Link
            href="/workouts/new"
            className="mt-6 inline-block rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600"
          >
            Log first workout
          </Link>
        </section>
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
                className="rounded-3xl border border-neutral-200 p-6 transition hover:border-neutral-400 hover:bg-neutral-50"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{workout.title}</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {workout.date.toLocaleDateString()} ·{" "}
                      {workout.goal || "No goal set"}
                    </p>
                  </div>

                  <div className="text-sm text-neutral-600">
                    {workout.exercises.length} exercises · {setCount} sets
                  </div>
                </div>

                {workout.notes && (
                  <p className="mt-4 text-sm text-neutral-600">{workout.notes}</p>
                )}
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}