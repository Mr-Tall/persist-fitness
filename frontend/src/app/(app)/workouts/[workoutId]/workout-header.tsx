import { deleteWorkout, repeatWorkout } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricBadge } from "@/components/ui/metric-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatWorkoutDate } from "@/lib/format-date";
import { DeleteWorkoutButton } from "./delete-workout-button";
import { EditWorkoutForm } from "./edit-workout-form";
import { FinishWorkoutButton } from "./finish-workout-button";
import { WorkoutStatGrid } from "./workout-stat-grid";
import type { WorkoutForPage } from "./workout-page-types";

type WorkoutHeaderProps = {
  workout: WorkoutForPage;
  totalSets: number;
  totalVolume: string;
  duration: string;
  workoutProgress: number;
  isCompleted: boolean;
};

export function WorkoutHeader({
  workout,
  totalSets,
  totalVolume,
  duration,
  workoutProgress,
  isCompleted,
}: WorkoutHeaderProps) {
  return (
    <Card className="relative overflow-hidden p-3 sm:p-5 lg:p-7">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.20),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.10),transparent_30%)]" />

      <Button
        href="/workouts"
        variant="ghost"
        className="min-h-11 rounded-xl px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
      >
        ← Back to workouts
      </Button>

      <header className="mt-2 min-w-0">
        <h1 className="line-clamp-2 break-words bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-2xl font-black leading-tight tracking-tight text-transparent sm:text-3xl lg:text-5xl">
            {workout.title}
        </h1>

        <div
          aria-label="Workout status and duration"
          className="mt-2 flex min-w-0 flex-wrap items-center gap-2"
        >
          <MetricBadge variant={isCompleted ? "emerald" : "amber"}>
            {isCompleted ? "Completed workout" : "Active workout"}
          </MetricBadge>

          <span
            aria-label={`Duration: ${duration}`}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-neutral-300"
          >
            <span className="text-neutral-500">Duration:</span> {duration}
          </span>
        </div>

        <p className="mt-2 break-words text-xs font-medium leading-5 text-neutral-400 sm:text-sm">
          {formatWorkoutDate(workout.date)} · {workout.goal || "No goal set"}
        </p>
      </header>

      <div className="mt-3">
        <WorkoutStatGrid
          exerciseCount={workout.exercises.length}
          totalSets={totalSets}
          totalVolume={totalVolume}
        />
      </div>

      <section
        aria-label="Workout actions"
        className="mt-3 sm:flex sm:items-start sm:gap-2"
      >
        <FinishWorkoutButton workoutId={workout.id} status={workout.status} />

        <div className="mt-2 flex flex-wrap items-start gap-2 sm:mt-0 sm:flex-1">
          <form action={repeatWorkout} className="min-w-0 flex-1 sm:flex-none">
            <input type="hidden" name="workoutId" value={workout.id} />
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              className="min-h-11 rounded-xl px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 sm:text-sm"
            >
              Repeat workout
            </Button>
          </form>

          {!isCompleted && (
            <EditWorkoutForm
              workout={{
                id: workout.id,
                title: workout.title,
                goal: workout.goal,
                notes: workout.notes,
                date: workout.date,
              }}
            />
          )}

          <form
            action={deleteWorkout}
            className="min-w-0 flex-1 has-[div]:basis-full has-[div]:grow sm:flex-none"
          >
            <DeleteWorkoutButton workoutId={workout.id} />
          </form>
        </div>
      </section>

      <ProgressBar
        value={workoutProgress}
        max={100}
        label="Session progress"
        helper={`${totalSets} / 12 sets logged`}
        className="mt-4 hidden md:block"
      />

      {workout.notes && (
        <Card className="mt-3 rounded-2xl bg-black/25 p-3 sm:mt-4 sm:p-4">
          <p className="break-words text-sm leading-6 text-neutral-300">
            {workout.notes}
          </p>
        </Card>
      )}
    </Card>
  );
}
