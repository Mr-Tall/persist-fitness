"use client";

import { updateSetInExercise } from "@/app/actions/workout-exercises";
import { useState } from "react";

type EditSetFormProps = {
  workoutId: string;
  set: {
    id: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    rir: number | null;
    tempo: string | null;
    notes: string | null;
  };
};

export function EditSetForm({ workoutId, set }: EditSetFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg px-2 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-neutral-950">
              Edit set {set.setNumber}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Update reps, load, effort, tempo, or notes.
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

        <form action={updateSetInExercise} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="workoutId" value={workoutId} />
          <input type="hidden" name="workoutSetId" value={set.id} />

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Reps
            </label>
            <input
              name="reps"
              type="number"
              min="0"
              defaultValue={set.reps ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Weight
            </label>
            <input
              name="weight"
              type="number"
              min="0"
              step="0.5"
              defaultValue={set.weight ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              RIR
            </label>
            <input
              name="rir"
              type="number"
              min="0"
              max="10"
              defaultValue={set.rir ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Tempo
            </label>
            <input
              name="tempo"
              defaultValue={set.tempo ?? ""}
              placeholder="3-1-1"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500">
              Notes
            </label>
            <input
              name="notes"
              defaultValue={set.notes ?? ""}
              placeholder="Optional"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-neutral-950 px-4 py-3 font-semibold text-white hover:bg-neutral-800"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}