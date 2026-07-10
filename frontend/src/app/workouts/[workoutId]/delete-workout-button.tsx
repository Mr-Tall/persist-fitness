"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

type DeleteWorkoutButtonProps = {
  workoutId: string;
};

function ConfirmDeleteWorkoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => {
        if (!pending) {
          toast("Deleting workout...", {
            duration: 1600,
          });
        }
      }}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Deleting..." : "Yes, delete"}
    </button>
  );
}

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
      <p className="text-sm font-bold text-red-700">
        Are you sure? This will permanently delete this workout and its sets.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <ConfirmDeleteWorkoutButton />

        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-red-100"
        >
          Cancel
        </button>
      </div>

      <input type="hidden" name="workoutId" value={workoutId} />
    </div>
  );
}