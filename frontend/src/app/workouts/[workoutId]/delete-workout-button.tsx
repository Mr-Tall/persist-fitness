"use client";

import { useState } from "react";

type DeleteWorkoutButtonProps = {
  workoutId: string;
};

export function DeleteWorkoutButton({ workoutId }: DeleteWorkoutButtonProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <button
        type="button"
        onClick={() => setConfirmed(true)}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Delete workout
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-700">
        Are you sure? This will permanently delete this workout and its sets.
      </p>

      <div className="mt-3 flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Yes, delete
        </button>

        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:bg-white"
        >
          Cancel
        </button>
      </div>

      <input type="hidden" name="workoutId" value={workoutId} />
    </div>
  );
}