import { deleteRoutine, startRoutine } from "@/app/actions/routines";
import { auth } from "@/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteRoutineButton } from "./[routineId]/delete-routine-button";

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
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:py-10">
      <header className="px-1">
        <p className="text-xs font-black tracking-[0.24em] text-emerald-300 uppercase">
          Routines
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:mt-2 sm:text-5xl">
          Workout routines
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400 sm:mt-2 sm:text-base">
          Build reusable plans and get into your next workout faster.
        </p>
        <div className="mt-4 sm:mt-5">
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
            href="/routines/new"
          >
            Create routine
          </Link>
        </div>
      </header>

      {routines.length === 0 ? (
        <section className="mt-6" aria-label="Routine setup">
          <EmptyState
            title="No routines yet"
            description="Create your first routine, add planned exercises, then start it whenever you are ready to train."
            action={
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                href="/routines/new"
              >
                Create routine
              </Link>
            }
          />
        </section>
      ) : (
        <section aria-labelledby="saved-routines-title" className="mt-6 sm:mt-8">
          <h2 className="sr-only" id="saved-routines-title">
            Saved routines
          </h2>
          <ul
            aria-label="Saved routines"
            className="grid gap-3 md:grid-cols-2 md:gap-4"
          >
            {routines.map((routine) => {
              const exerciseCount = routine.exercises.length;
              const previewExercises = routine.exercises.slice(0, 3);

              return (
                <li
                  className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 shadow-sm sm:p-5"
                  key={routine.id}
                >
                  <article aria-labelledby={`routine-${routine.id}-title`}>
                    <div className="min-w-0">
                      <h3
                        className="break-words text-lg font-black leading-6 text-white [overflow-wrap:anywhere] sm:text-xl"
                        id={`routine-${routine.id}-title`}
                      >
                        {routine.title}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-neutral-400">
                        {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
                        {routine.goal ? ` · ${routine.goal}` : ""}
                      </p>
                    </div>

                    {routine.description && (
                      <p className="mt-3 line-clamp-2 break-words text-sm leading-5 text-neutral-400 [overflow-wrap:anywhere]">
                        {routine.description}
                      </p>
                    )}

                    {previewExercises.length > 0 ? (
                      <ul
                        aria-label={`${routine.title} exercise preview`}
                        className="mt-3 flex flex-wrap gap-1.5"
                      >
                        {previewExercises.map((exercise) => (
                          <li
                            className="min-w-0 max-w-full break-words rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-medium text-neutral-300 [overflow-wrap:anywhere]"
                            key={exercise.id}
                          >
                            {exercise.name}
                          </li>
                        ))}

                        {exerciseCount > previewExercises.length && (
                          <li className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-medium text-neutral-400">
                            +{exerciseCount - previewExercises.length} more
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs font-medium text-neutral-500">
                        No exercises added
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      <form action={startRoutine}>
                        <input name="routineId" type="hidden" value={routine.id} />
                        <button
                          aria-label={`Start ${routine.title} workout`}
                          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                          type="submit"
                        >
                          Start workout
                        </button>
                      </form>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          aria-label={`Edit ${routine.title} routine`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-sm font-bold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                          href={`/routines/${routine.id}`}
                        >
                          Edit
                        </Link>

                        <form action={deleteRoutine} className="min-w-0">
                          <input name="routineId" type="hidden" value={routine.id} />
                          <DeleteRoutineButton
                            routineTitle={routine.title}
                            variant="list"
                          />
                        </form>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
