import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StartWorkoutButton } from "./start-workout-button";

type MobileTodayPrimaryCardProps = {
  activeWorkout: {
    id: string;
    title: string;
    startedTime: string;
    setCount: number;
    exerciseCount: number;
  } | null;
  hasRoutines: boolean;
  trainingMessage: string;
};

export function MobileTodayPrimaryCard({
  activeWorkout,
  hasRoutines,
  trainingMessage,
}: MobileTodayPrimaryCardProps) {
  return (
    <Card
      variant={activeWorkout ? "emerald" : "glass"}
      className="relative overflow-hidden rounded-[1.75rem] p-5"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.2),transparent_44%)]" />

      {activeWorkout ? (
        <>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Workout in progress
          </p>
          <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-white">
            {activeWorkout.title}
          </h2>
          <p className="mt-2 text-sm text-neutral-300">
            Started {activeWorkout.startedTime} &middot; {activeWorkout.setCount}{" "}
            sets &middot; {activeWorkout.exerciseCount} exercises
          </p>

          <Button
            href={`/workouts/${activeWorkout.id}`}
            fullWidth
            className="mt-5 min-h-12"
          >
            Resume workout
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Next up
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Ready for today&apos;s session?
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {trainingMessage}
          </p>

          <div className="mt-5 [&_button]:min-h-12 [&_button]:w-full [&_form]:w-full">
            <StartWorkoutButton />
          </div>

          <Button
            href={hasRoutines ? "/routines" : "/routines/new"}
            variant="secondary"
            fullWidth
            className="mt-2 min-h-12"
          >
            {hasRoutines ? "Start from routine" : "Create a routine"}
          </Button>
        </>
      )}
    </Card>
  );
}
