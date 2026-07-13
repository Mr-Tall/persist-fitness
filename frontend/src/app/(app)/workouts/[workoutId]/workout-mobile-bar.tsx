import { FinishWorkoutButton } from "./finish-workout-button";

type WorkoutMobileBarProps = {
  workoutId: string;
  workoutStatus: string;
  totalSets: number;
  duration: string;
};

export function WorkoutMobileBar({
  workoutId,
  workoutStatus,
  totalSets,
  duration,
}: WorkoutMobileBarProps) {
  if (workoutStatus === "completed") {
    return null;
  }

  return (
    <aside
      aria-label="Workout controls"
      className="fixed inset-x-3 bottom-[calc(var(--mobile-nav-height)_+_0.5rem)] z-40 rounded-2xl border border-white/10 bg-black/90 p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-black text-white">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"
            />
            Active workout
          </p>
          <p
            title={`${totalSets} sets · Duration ${duration}`}
            className="mt-0.5 truncate text-xs font-medium text-neutral-400"
          >
            {totalSets} {totalSets === 1 ? "set" : "sets"}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">Duration </span>
            {duration}
          </p>
        </div>

        <div className="shrink-0 [&_button]:min-h-12 [&_button]:whitespace-nowrap [&_form]:m-0">
          <FinishWorkoutButton workoutId={workoutId} status={workoutStatus} />
        </div>
      </div>
    </aside>
  );
}
