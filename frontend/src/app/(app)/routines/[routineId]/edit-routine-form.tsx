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
        aria-label={`Edit ${routine.title} routine`}
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
      >
        Edit routine
      </button>
    );
  }

  return (
    <section className="col-span-full rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Edit routine</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Update the name, goal, or description for this routine.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="min-h-11 rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-neutral-300 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
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
            className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
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
            className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
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
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
          />
        </div>

        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
        >
          Save routine
        </button>
      </form>
    </section>
  );
}
