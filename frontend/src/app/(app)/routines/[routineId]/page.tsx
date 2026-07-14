import {
  deleteExerciseFromRoutine,
  deleteRoutine,
  startRoutine,
} from "@/app/actions/routines";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddTemplateExerciseForm } from "../add-template-exercise-form";
import { DeleteRoutineExerciseButton } from "../delete-routine-exercise-button";
import { DeleteRoutineButton } from "./delete-routine-button";
import { EditRoutineForm } from "./edit-routine-form";
import { EditTemplateExerciseForm } from "./edit-template-exercise-form";

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

  const exerciseCount = routine.exercises.length;
  const addExerciseForm = (
    <AddTemplateExerciseForm
      routineId={routine.id}
      exercises={libraryExercises}
      isEmptyRoutine={exerciseCount === 0}
    />
  );

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 pt-4 sm:px-6 sm:py-10">
      <header className="px-1">
        <Link
          className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          href="/routines"
        >
          <span aria-hidden="true" className="mr-1.5">
            &larr;
          </span>
          Back to routines
        </Link>

        <div className="mt-2 min-w-0">
          <h1 className="break-words text-3xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere] sm:text-4xl">
            {routine.title}
          </h1>

          <dl
            aria-label="Routine details"
            className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-neutral-300"
            role="group"
          >
            <div className="min-w-0 max-w-full rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <dt className="sr-only">Goal</dt>
              <dd className="break-words [overflow-wrap:anywhere]">
                {routine.goal || "No goal set"}
              </dd>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <dt className="sr-only">Exercise count</dt>
              <dd>
                {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
              </dd>
            </div>
          </dl>

          {routine.description && (
            <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-neutral-400 [overflow-wrap:anywhere]">
              {routine.description}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[auto_auto] sm:justify-start">
          <form action={startRoutine} className="w-full sm:w-auto">
            <input name="routineId" type="hidden" value={routine.id} />
            <button
              aria-label={`Start ${routine.title} workout`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
              type="submit"
            >
              Start workout
            </button>
          </form>

          <EditRoutineForm
            routine={{
              id: routine.id,
              title: routine.title,
              goal: routine.goal,
              description: routine.description,
            }}
          />
        </div>

        {exerciseCount === 0 && (
          <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] px-4 py-3 text-xs font-bold leading-5 text-amber-100">
            This routine has no planned exercises. Starting it will create an
            empty workout you can build as you train.
          </p>
        )}
      </header>

      <section className="mt-5 space-y-5 sm:mt-7" aria-label="Routine plan">
        {exerciseCount === 0 && addExerciseForm}

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-white sm:text-xl">
            Planned exercises
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            These exercises are copied into each workout started from this
            routine.
          </p>

          {exerciseCount === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
              <h3 className="font-black text-white">No exercises added yet</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Add your first exercise above to turn this into a ready-to-start
                plan.
              </p>
            </div>
          ) : (
            <ol
              aria-label="Planned exercises"
              className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              {routine.exercises.map((exercise, index) => (
                <li
                  key={exercise.id}
                  className="min-w-0 px-3 py-3.5 sm:px-4 sm:py-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-black text-neutral-300"
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="sr-only">Exercise {index + 1}: </span>
                      <h3 className="break-words text-sm font-black leading-5 text-white [overflow-wrap:anywhere] sm:text-base">
                        {exercise.name}
                      </h3>
                      <p className="mt-1 break-words text-sm font-black leading-5 text-emerald-200 [overflow-wrap:anywhere]">
                        {exercise.sets && exercise.reps
                          ? `${exercise.sets} sets × ${exercise.reps}`
                          : exercise.sets
                            ? `${exercise.sets} sets`
                            : exercise.reps
                              ? `Target ${exercise.reps} reps`
                              : "Targets not set"}
                      </p>
                    </div>
                  </div>

                  {exercise.notes && (
                    <details className="group mt-2 ml-10 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-bold text-neutral-300 transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                        Notes
                        <span
                          aria-hidden="true"
                          className="text-neutral-500 transition group-open:rotate-180"
                        >
                          ↓
                        </span>
                      </summary>
                      <p className="break-words border-t border-white/[0.08] px-3 py-2.5 text-xs leading-5 text-neutral-400 [overflow-wrap:anywhere]">
                        {exercise.notes}
                      </p>
                    </details>
                  )}

                  <div className="mt-2 ml-10 flex min-w-0 flex-wrap items-start gap-2">
                    <EditTemplateExerciseForm
                      routineId={routine.id}
                      exercise={{
                        id: exercise.id,
                        name: exercise.name,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        notes: exercise.notes,
                      }}
                    />

                    <form action={deleteExerciseFromRoutine}>
                      <input
                        name="routineId"
                        type="hidden"
                        value={routine.id}
                      />
                      <input
                        name="templateExerciseId"
                        type="hidden"
                        value={exercise.id}
                      />
                      <DeleteRoutineExerciseButton
                        exerciseName={exercise.name}
                      />
                    </form>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {exerciseCount > 0 && addExerciseForm}
      </section>

      <section
        aria-labelledby="routine-settings-title"
        className="mt-6 rounded-2xl border border-red-300/15 bg-red-400/[0.04] p-4 sm:mt-8 sm:flex sm:items-center sm:justify-between sm:gap-5"
      >
        <div>
          <h2 className="text-sm font-black text-white" id="routine-settings-title">
            Routine settings
          </h2>
          <p className="mt-1 text-xs leading-5 text-neutral-400">
            Delete this routine and its planned exercises permanently.
          </p>
        </div>

        <form action={deleteRoutine} className="mt-3 sm:mt-0">
          <input name="routineId" type="hidden" value={routine.id} />
          <DeleteRoutineButton routineTitle={routine.title} />
        </form>
      </section>
    </main>
  );
}
