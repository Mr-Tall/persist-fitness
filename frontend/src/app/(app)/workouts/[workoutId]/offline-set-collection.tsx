"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useOfflineWorkout } from "./workout-experience-provider";
import { AddSetForm } from "./add-set-form";
import { SetCard } from "./set-card";
import type { AddSetPrefill } from "./add-set-prefill";
import type { WorkoutSetForPage } from "./workout-page-types";

type PrStatus = {
  isPersonalRecord: boolean;
  estimatedOneRepMax: number | null;
  recordLabel?: string | null;
};

export function OfflineSetCollection({
  workoutId,
  workoutExerciseId,
  trackingType,
  initialSets,
  prefill,
  isCompleted,
  prStatuses,
}: {
  workoutId: string;
  workoutExerciseId: string;
  trackingType?: string | null;
  initialSets: WorkoutSetForPage[];
  prefill?: AddSetPrefill;
  isCompleted: boolean;
  prStatuses: Array<[string, PrStatus]>;
}) {
  const offline = useOfflineWorkout();
  const sets =
    offline?.snapshot?.exercises.find((exercise) => exercise.id === workoutExerciseId)
      ?.sets ?? initialSets;
  const statusBySetId = new Map(prStatuses);

  return (
    <>
      {!isCompleted && (
        <AddSetForm
          workoutId={workoutId}
          workoutExerciseId={workoutExerciseId}
          prefill={prefill}
          trackingType={trackingType}
        />
      )}

      {sets.length === 0 ? (
        <div className={isCompleted ? "" : "mt-5"}>
          <EmptyState
            title={isCompleted ? "No sets recorded" : "No sets logged yet"}
            description={
              isCompleted
                ? "No working sets were saved for this exercise."
                : "Add your first set above when you finish the lift."
            }
          />
        </div>
      ) : (
        <div className={`space-y-3 ${isCompleted ? "" : "mt-5"}`}>
          {sets.map((set) => (
            <SetCard
              key={set.id}
              workoutId={workoutId}
              workoutExerciseId={workoutExerciseId}
              set={set}
              prStatus={statusBySetId.get(set.id)}
              editable={!isCompleted}
              trackingType={trackingType}
            />
          ))}
        </div>
      )}
    </>
  );
}
