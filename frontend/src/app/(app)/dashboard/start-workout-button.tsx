import { startTodaysWorkout } from "@/app/actions/workouts";
import { SubmitButton } from "@/components/ui/submit-button";

export function StartWorkoutButton() {
  return (
    <form action={startTodaysWorkout}>
      <SubmitButton
        pendingText="Starting..."
        className="w-full rounded-2xl bg-action px-6 py-4 text-sm font-black text-action-foreground shadow-[0_18px_50px_rgba(0,0,0,0.32)] transition-colors hover:bg-action-hover sm:w-auto lg:w-full"
      >
        Start today&apos;s workout
      </SubmitButton>
    </form>
  );
}
