import { finishWorkout, reopenWorkout } from "@/app/actions/workouts";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";

type FinishWorkoutButtonProps = {
  workoutId: string;
  status: string;
};

export function FinishWorkoutButton({
  workoutId,
  status,
}: FinishWorkoutButtonProps) {
  const isCompleted = status === "completed";

  return (
    <form action={isCompleted ? reopenWorkout : finishWorkout}>
      <input type="hidden" name="workoutId" value={workoutId} />

      <ToastSubmitButton
        pendingText={isCompleted ? "Reopening..." : "Finishing..."}
        toastMessage={isCompleted ? "Reopening workout..." : "Finishing workout..."}
        className={
          isCompleted
            ? "min-h-11 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 sm:w-auto"
            : "min-h-11 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto"
        }
      >
        {isCompleted ? "Reopen workout" : "Finish workout"}
      </ToastSubmitButton>
    </form>
  );
}
