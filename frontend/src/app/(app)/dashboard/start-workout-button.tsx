import { startTodaysWorkout } from "@/app/actions/workouts";
import { SubmitButton } from "@/components/ui/submit-button";

export function StartWorkoutButton() {
  return (
    <form action={startTodaysWorkout}>
      <SubmitButton
        pendingText="Starting..."
        className="w-full rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black text-black shadow-[0_18px_50px_rgba(52,211,153,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto lg:w-full"
      >
        Start today&apos;s workout
      </SubmitButton>
    </form>
  );
}