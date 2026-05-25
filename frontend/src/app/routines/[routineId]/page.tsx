import {
  deleteExerciseFromRoutine,
  startRoutine,
} from "@/app/actions/routines";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AddTemplateExerciseForm } from "../add-template-exercise-form";
import { DeleteRoutineExerciseButton } from "../delete-routine-exercise-button";

type RoutineDetailPageProps = {
  params: Promise<{
    routineId: string;
  }>;
};

export default async function RoutineDetailPage({
  params,
}: RoutineDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { routineId } = await params;

  const routine = await db.workoutTemplate.findFirst({
    where: {
      id: routineId,
      userId: session.user.id,
    },
    include: {
      exercises: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!routine) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="mb-8">
        <Link href="/routines" className="text-sm font-medium text-emerald-600">
          ← Back to routines
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-bold">{routine.title}</h1>

            <p className="mt-2 text-neutral-600">
              {routine.goal || "No goal set"} · {routine.exercises.length}{" "}
              exercises
            </p>
          </div>

          <form action={startRoutine}>
            <input type="hidden" name="routineId" value={routine.id} />
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
            >
              Start workout
            </button>
          </form>
        </div>

        {routine.description && (
          <p className="mt-4 rounded-2xl bg-neutral-100 p-4 text-neutral-700">
            {routine.description}
          </p>
        )}
      </section>

      <section className="space-y-6">
        <AddTemplateExerciseForm routineId={routine.id} />

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Planned exercises</h2>
          <p className="mt-1 text-sm text-neutral-600">
            These exercises will be copied into each workout started from this
            routine.
          </p>

          {routine.exercises.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
              <h3 className="font-semibold">No exercises added yet</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Add your first exercise above to build this routine.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {routine.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {index + 1}. {exercise.name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {exercise.sets ? `${exercise.sets} sets` : "Sets not set"}
                      {exercise.reps ? ` · ${exercise.reps} reps` : ""}
                      {exercise.notes ? ` · ${exercise.notes}` : ""}
                    </p>
                  </div>

                  <form action={deleteExerciseFromRoutine}>
                    <input type="hidden" name="routineId" value={routine.id} />
                    <input
                      type="hidden"
                      name="templateExerciseId"
                      value={exercise.id}
                    />
                    <DeleteRoutineExerciseButton
                      exerciseName={exercise.name}
                    />
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}