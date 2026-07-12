"use client";

import {
  addSetToExerciseWithState,
  type AddSetFormState,
} from "@/app/actions/workout-exercises";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { RestTimer } from "./rest-timer";

type AddSetFormProps = {
  workoutId: string;
  workoutExerciseId: string;
};

const initialState: AddSetFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

export function AddSetForm({ workoutId, workoutExerciseId }: AddSetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    addSetToExerciseWithState,
    initialState
  );

  useEffect(() => {
    if (!state.submittedAt || !state.message) {
      return;
    }

    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      return;
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.message, state.status, state.submittedAt]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4"
      >
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
            Log next set
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Fast entry for reps, load, effort, and notes.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
              Reps
            </label>
            <input
              name="reps"
              type="number"
              min="0"
              max="10000"
              step="1"
              inputMode="numeric"
              placeholder="8"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
              Weight
            </label>
            <input
              name="weight"
              type="number"
              min="0"
              max="10000"
              step="0.5"
              inputMode="decimal"
              placeholder="225"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
              RIR
            </label>
            <input
              name="rir"
              type="number"
              min="0"
              max="10"
              step="1"
              inputMode="numeric"
              placeholder="2"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
              Tempo
            </label>
            <input
              name="tempo"
              maxLength={30}
              placeholder="3-1-1"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
              Notes
            </label>
            <input
              name="notes"
              maxLength={2000}
              placeholder="Optional"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div className="flex items-end">
            <ToastSubmitButton
              pendingText="Saving..."
              toastMessage="Saving set..."
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-black text-black transition hover:bg-emerald-300"
            >
              Save set
            </ToastSubmitButton>
          </div>
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
      </form>

      <RestTimer />
    </>
  );
}
