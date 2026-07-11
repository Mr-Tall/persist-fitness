import { deleteExerciseFromWorkout } from "@/app/actions/workout-exercises";
import { DeleteInlineButton } from "./delete-inline-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricBadge } from "@/components/ui/metric-badge";
import { AddSetForm } from "./add-set-form";
import { PreviousPerformanceCard } from "./previous-performance-card";
import { SetCard } from "./set-card";
import type { WorkoutExerciseForPage } from "./workout-page-types";

type SetPrStatus = {
  isPersonalRecord: boolean;
  estimatedOneRepMax: number | null;
};

type PreviousPerformance = Parameters<
  typeof PreviousPerformanceCard
>[0]["previous"];

type ExerciseCardProps = {
  workoutId: string;
  exercise: WorkoutExerciseForPage;
  exerciseIndex: number;
  exerciseVolume: string;
  previousPerformance: PreviousPerformance;
  prStatuses: Map<string, SetPrStatus>;
};

export function ExerciseCard({
  workoutId,
  exercise,
  exerciseIndex,
  exerciseVolume,
  previousPerformance,
  prStatuses,
}: ExerciseCardProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] bg-black/20 p-0">
      <div className="border-b border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-neutral-500">
              Exercise {exerciseIndex + 1}
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              {exercise.name}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              <MetricBadge>{exercise.sets.length} sets</MetricBadge>
              <MetricBadge>{exerciseVolume}</MetricBadge>
            </div>
          </div>

          <form action={deleteExerciseFromWorkout}>
            <input type="hidden" name="workoutId" value={workoutId} />
            <input type="hidden" name="workoutExerciseId" value={exercise.id} />
            <DeleteInlineButton
              label="Delete exercise"
              confirmMessage={`Delete ${exercise.name} and all of its sets?`}
            />
          </form>
        </div>

        <PreviousPerformanceCard previous={previousPerformance} />
      </div>

      <div className="p-5">
        {exercise.sets.length === 0 ? (
          <EmptyState
            title="No sets logged yet"
            description="Add your first set below when you finish the lift."
          />
        ) : (
          <div className="space-y-3">
            {exercise.sets.map((set) => (
              <SetCard
                key={set.id}
                workoutId={workoutId}
                set={set}
                prStatus={prStatuses.get(set.id)}
              />
            ))}
          </div>
        )}

        <AddSetForm workoutId={workoutId} workoutExerciseId={exercise.id} />
      </div>
    </Card>
  );
}
