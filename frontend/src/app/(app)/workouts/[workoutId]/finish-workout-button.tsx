"use client";

import { finishWorkout, reopenWorkout } from "@/app/actions/workouts";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import { useOfflineWorkout } from "./workout-experience-provider";

type FinishWorkoutButtonProps = {
  workoutId: string;
  status: string;
};

export function FinishWorkoutButton({
  workoutId,
  status,
}: FinishWorkoutButtonProps) {
  const isCompleted = status === "completed";
  const offline = useOfflineWorkout();

  if (!isCompleted && offline && offline.pendingCount > 0) {
    return (
      <div className="min-w-0">
        <button
          type="button"
          disabled={!offline.isOnline || offline.status === "syncing"}
          onClick={() => void offline.syncNow()}
          className="min-h-11 w-full rounded-xl bg-action px-4 py-2 text-sm font-black text-action-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
        >
          {offline.isOnline ? "Sync now" : "Reconnect to finish"}
        </button>
        <p className="sr-only" role="status">
          Finish workout is unavailable until {offline.pendingCount} pending changes synchronize.
        </p>
      </div>
    );
  }

  return (
    <form action={isCompleted ? reopenWorkout : finishWorkout}>
      <input type="hidden" name="workoutId" value={workoutId} />

      <ToastSubmitButton
        pendingText={isCompleted ? "Reopening..." : "Finishing..."}
        toastMessage={isCompleted ? "Reopening workout..." : "Finishing workout..."}
        className={
          isCompleted
            ? "min-h-11 w-full rounded-xl border border-border px-4 py-3 text-sm font-black text-text-primary transition hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
            : "min-h-11 w-full rounded-xl bg-action px-4 py-3 text-sm font-black text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
        }
      >
        {isCompleted ? "Reopen workout" : "Finish workout"}
      </ToastSubmitButton>
    </form>
  );
}
