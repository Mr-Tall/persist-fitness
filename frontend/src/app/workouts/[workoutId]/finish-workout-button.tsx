import { finishWorkout, reopenWorkout } from "@/app/actions/workouts";
import { SubmitButton } from "@/components/ui/submit-button";

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

      <SubmitButton
        pendingText={isCompleted ? "Reopening..." : "Finishing..."}
        className={
          isCompleted
            ? "w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 sm:w-auto"
            : "w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300 sm:w-auto"
        }
      >
        {isCompleted ? "Reopen workout" : "Finish workout"}
      </SubmitButton>
    </form>
  );
}