"use client";

import { updateExerciseInRoutine } from "@/app/actions/routines";
import { useState } from "react";

type EditTemplateExerciseFormProps = {
  exercise: {
    id: string;
    name: string;
    sets: number | null;
    reps: string | null;
    notes: string | null;
  };
  routineId: string;
};

export function EditTemplateExerciseForm({
  exercise,
  routineId,
}: EditTemplateExerciseFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Edit ${exercise.name} plan`}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-neutral-200 transition hover:border-emerald-300/30 hover:bg-emerald-400/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Edit {exercise.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Update the planned sets, reps, and notes for this routine.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>

      <form action={updateExerciseInRoutine} className="space-y-4">
        <input type="hidden" name="routineId" value={routineId} />
        <input type="hidden" name="templateExerciseId" value={exercise.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`sets-${exercise.id}`}
              className="block text-sm font-medium"
            >
              Planned sets
            </label>
            <input
              id={`sets-${exercise.id}`}
              name="sets"
              type="number"
              min="1"
              max="20"
              defaultValue={exercise.sets ?? ""}
              placeholder="3"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor={`reps-${exercise.id}`}
              className="block text-sm font-medium"
            >
              Planned reps
            </label>
            <input
              id={`reps-${exercise.id}`}
              name="reps"
              defaultValue={exercise.reps ?? ""}
              placeholder="8-10"
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`notes-${exercise.id}`}
            className="block text-sm font-medium"
          >
            Notes
          </label>
          <textarea
            id={`notes-${exercise.id}`}
            name="notes"
            rows={3}
            defaultValue={exercise.notes ?? ""}
            placeholder="Tempo, technique cue, intensity target, etc."
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          Save exercise
        </button>
      </form>
    </div>
  );
}
