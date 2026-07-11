"use client";

import { updateRoutine } from "@/app/actions/routines";
import { useState } from "react";

type EditRoutineFormProps = {
  routine: {
    id: string;
    title: string;
    goal: string | null;
    description: string | null;
  };
};

export function EditRoutineForm({ routine }: EditRoutineFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold transition hover:bg-neutral-50 sm:w-auto"
      >
        Edit routine
      </button>
    );
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Edit routine</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Update the name, goal, or description for this routine.
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

      <form action={updateRoutine} className="space-y-4">
        <input type="hidden" name="routineId" value={routine.id} />

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Routine title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={routine.title}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div>
          <label htmlFor="goal" className="block text-sm font-medium">
            Goal
          </label>
          <select
            id="goal"
            name="goal"
            defaultValue={routine.goal ?? ""}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">No specific goal</option>
            <option value="Hypertrophy">Hypertrophy</option>
            <option value="Strength">Strength</option>
            <option value="Endurance">Endurance</option>
            <option value="Technique">Technique</option>
            <option value="Recovery">Recovery</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={routine.description ?? ""}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          Save routine
        </button>
      </form>
    </section>
  );
}