import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { redirect } from "next/navigation";
import Link from "next/link";
import { startRoutine } from "@/app/actions/routines";

export default async function RoutinesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const routines = await db.workoutTemplate.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      exercises: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Routines"
        title="Workout routines"
        description="Create reusable workout plans so you can start training faster in the gym."
        action={
          <Link
            href="/routines/new"
            className="inline-flex w-full justify-center rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800 sm:w-auto"
          >
            New routine
          </Link>
        }
      />

      {routines.length === 0 ? (
        <EmptyState
          title="No routines yet"
          description="Create your first routine, add planned exercises, then start workouts from it anytime."
          action={
            <Link
              href="/routines/new"
              className="inline-block rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600"
            >
              Create routine
            </Link>
          }
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-semibold">{routine.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {routine.goal || "No goal set"} · {routine.exercises.length}{" "}
                    exercises
                  </p>
                </div>
              </div>

              {routine.description && (
                <p className="mt-4 text-sm leading-6 text-neutral-600">
                  {routine.description}
                </p>
              )}

              {routine.exercises.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {routine.exercises.slice(0, 5).map((exercise) => (
                    <span
                      key={exercise.id}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {exercise.name}
                    </span>
                  ))}

                  {routine.exercises.length > 5 && (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      +{routine.exercises.length - 5} more
                    </span>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <form action={startRoutine}>
                  <input type="hidden" name="routineId" value={routine.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    Start workout
                  </button>
                </form>

                <Link
                  href={`/routines/${routine.id}`}
                  className="rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-semibold hover:bg-neutral-50"
                >
                  Edit routine
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}