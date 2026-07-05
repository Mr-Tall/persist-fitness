"use client";

import { addExerciseToWorkout } from "@/app/actions/workout-exercises";
import { ExerciseSelect } from "@/components/exercise-select";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import { useState } from "react";

type AddExerciseFormProps = {
  workoutId: string;
  exercises: {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
    isFavorite?: boolean;
  }[];
};

export function AddExerciseForm({ workoutId, exercises }: AddExerciseFormProps) {
  const [canSubmit, setCanSubmit] = useState(false);

  return (
    <form
      action={addExerciseToWorkout}
      className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur"
    >
      <input type="hidden" name="workoutId" value={workoutId} />

      <h2 className="text-lg font-black text-white">Add exercise</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-400">
        Choose from the library or add a custom movement.
      </p>

      <div className="mt-4">
        <ExerciseSelect
          exercises={exercises}
          onValidityChange={setCanSubmit}
        />
      </div>

      <ToastSubmitButton
        pendingText="Adding exercise..."
        toastMessage="Adding exercise..."
        disabled={!canSubmit}
        className="mt-4 w-full rounded-xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 disabled:bg-neutral-700 disabled:text-neutral-400 sm:w-auto"
      >
        Add exercise
      </ToastSubmitButton>
    </form>
  );
}