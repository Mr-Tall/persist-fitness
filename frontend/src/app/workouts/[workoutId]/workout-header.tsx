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
    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.20),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.10),transparent_30%)]" />

      <Button href="/workouts" variant="ghost" className="px-0 py-0">
        ← Back to workouts
      </Button>

      <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
            Workout mode
          </p>

          <h1 className="mt-3 bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
            {workout.title}
          </h1>

          <p className="mt-3 text-sm font-medium text-neutral-400">
            {formatWorkoutDate(workout.date)} · {workout.goal || "No goal set"}
          </p>
        </div>

        <WorkoutStatGrid
          exerciseCount={workout.exercises.length}
          totalSets={totalSets}
          totalVolume={totalVolume}
          isCompleted={isCompleted}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <FinishWorkoutButton workoutId={workout.id} status={workout.status} />

        <form action={repeatWorkout}>
          <input type="hidden" name="workoutId" value={workout.id} />
          <Button type="submit" variant="secondary" fullWidth>
            Repeat workout
          </Button>
        </form>

        <form action={deleteWorkout}>
          <DeleteWorkoutButton workoutId={workout.id} />
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricBadge variant={isCompleted ? "emerald" : "amber"}>
          {isCompleted ? "Completed" : "Active session"}
        </MetricBadge>

        <MetricBadge>{duration}</MetricBadge>
      </div>

      <ProgressBar
        value={workoutProgress}
        max={100}
        label="Session progress"
        helper={`${totalSets} / 12 sets logged`}
        className="mt-5"
      />

      <EditWorkoutForm
        workout={{
          id: workout.id,
          title: workout.title,
          goal: workout.goal,
          notes: workout.notes,
          date: workout.date,
        }}
      />

      {workout.notes && (
        <Card className="mt-5 rounded-2xl bg-black/25 p-4">
          <p className="text-sm leading-6 text-neutral-300">{workout.notes}</p>
        </Card>
      )}
    </Card>
  );
}