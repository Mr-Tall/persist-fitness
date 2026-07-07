"use client";

import {
  addExerciseToWorkoutWithState,
  type AddExerciseFormState,
} from "@/app/actions/workout-exercises";
import { ExerciseSelect } from "@/components/exercise-select";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

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

const initialState: AddExerciseFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

export function AddExerciseForm({ workoutId, exercises }: AddExerciseFormProps) {
  const [canSubmit, setCanSubmit] = useState(false);
  const [state, formAction] = useActionState(
    addExerciseToWorkoutWithState,
    initialState
  );

  useEffect(() => {
    if (!state.submittedAt || !state.message) {
      return;
    }

    if (state.status === "success") {
      toast.success(state.message);
      return;
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.message, state.status, state.submittedAt]);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur"
    >
      <input type="hidden" name="workoutId" value={workoutId} />

      <h2 className="text-lg font-black text-white">Add exercise</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-400">
        Choose from the library or add a custom movement.
      </p>

      <div className="mt-4">
        <ExerciseSelect exercises={exercises} onValidityChange={setCanSubmit} />
      </div>

      {state.status !== "idle" && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
            state.status === "success"
              ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-200"
              : "border-red-300/25 bg-red-400/[0.08] text-red-200"
          }`}
        >
          {state.message}
        </p>
      )}

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