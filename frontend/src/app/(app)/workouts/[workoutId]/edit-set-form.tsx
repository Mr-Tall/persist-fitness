"use client";

import {
  updateSetInExerciseWithState,
  type UpdateSetFormState,
} from "@/app/actions/workout-exercises";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type EditSetFormProps = {
  workoutId: string;
  set: {
    id: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    rir: number | null;
    tempo: string | null;
    notes: string | null;
  };
};

const initialState: UpdateSetFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

export function EditSetForm({ workoutId, set }: EditSetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);

  const [state, formAction] = useActionState(
    async (
      previousState: UpdateSetFormState,
      formData: FormData
    ): Promise<UpdateSetFormState> => {
      const result = await updateSetInExerciseWithState(
        previousState,
        formData
      );

      if (result.status === "success") {
        setIsOpen(false);
      }

      return result;
    },
    initialState
  );

  const shouldShowError =
    state.status === "error" &&
    state.submittedAt !== null &&
    state.submittedAt >= openedAt &&
    Boolean(state.message);

  useEffect(() => {
    if (!state.submittedAt || !state.message || state.submittedAt < openedAt) {
      return;
    }

    if (state.status === "success") {
      toast.success(state.message);
      return;
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [openedAt, state.message, state.status, state.submittedAt]);

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label={`Edit set ${set.setNumber}`}
        onClick={() => {
          setOpenedAt(Date.now());
          setIsOpen(true);
        }}
        className="min-h-11 rounded-xl px-3 py-2 text-xs font-bold text-neutral-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`edit-set-${set.id}-title`}
        className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p
              id={`edit-set-${set.id}-title`}
              className="text-lg font-semibold text-neutral-950"
            >
              Edit set {set.setNumber}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Update reps, load, effort, tempo, or notes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>

        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="workoutId" value={workoutId} />
          <input type="hidden" name="workoutSetId" value={set.id} />

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Reps
            </label>
            <input
              name="reps"
              type="number"
              min="0"
              max="10000"
              step="1"
              inputMode="numeric"
              defaultValue={set.reps ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Weight
            </label>
            <input
              name="weight"
              type="number"
              min="0"
              max="10000"
              step="0.5"
              inputMode="decimal"
              defaultValue={set.weight ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              RIR
            </label>
            <input
              name="rir"
              type="number"
              min="0"
              max="10"
              step="1"
              inputMode="numeric"
              defaultValue={set.rir ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500">
              Tempo
            </label>
            <input
              name="tempo"
              maxLength={30}
              defaultValue={set.tempo ?? ""}
              placeholder="3-1-1"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500">
              Notes
            </label>
            <input
              name="notes"
              maxLength={2000}
              defaultValue={set.notes ?? ""}
              placeholder="Optional"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            />
          </div>

          {shouldShowError && (
            <p
              role="alert"
              className="rounded-2xl border border-red-300/25 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700 sm:col-span-2"
            >
              {state.message}
            </p>
          )}

          <div className="sm:col-span-2">
            <ToastSubmitButton
              pendingText="Saving changes..."
              toastMessage="Saving set changes..."
              className="w-full rounded-xl bg-neutral-950 px-4 py-3 font-semibold text-white hover:bg-neutral-800"
            >
              Save changes
            </ToastSubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
