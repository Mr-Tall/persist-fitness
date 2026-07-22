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
      className="min-h-11 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-70"
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
        className="min-h-11 w-full rounded-xl border border-danger/20 bg-danger-soft px-3 py-2 text-xs font-bold text-danger transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:text-sm"
      >
        Delete workout
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4">
      <p className="text-sm font-bold text-danger">
        Are you sure? This will permanently delete this workout and its sets.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <ConfirmDeleteWorkoutButton />

        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="min-h-11 rounded-xl border border-border bg-action-secondary px-4 py-2 text-sm font-semibold transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Cancel
        </button>
      </div>

      <input type="hidden" name="workoutId" value={workoutId} />
    </div>
  );
}
