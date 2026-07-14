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
            <div className="mt-5 space-y-3">
              {routine.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
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

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                  </div>
                </div>
              ))}
            </div>
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
