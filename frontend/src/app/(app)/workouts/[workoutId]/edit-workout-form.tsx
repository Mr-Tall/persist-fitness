"use client";

import {
  updateWorkoutWithState,
  type UpdateWorkoutFormState,
} from "@/app/actions/workouts";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type EditWorkoutFormProps = {
  workout: {
    id: string;
    title: string;
    goal: string | null;
    notes: string | null;
    date: Date;
  };
};

const initialState: UpdateWorkoutFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

export function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);

  const [state, formAction] = useActionState(
    async (
      previousState: UpdateWorkoutFormState,
      formData: FormData
    ): Promise<UpdateWorkoutFormState> => {
      const result = await updateWorkoutWithState(previousState, formData);

      if (result.status === "success") {
        setIsOpen(false);
      }

      return result;
    },
    initialState
  );

  const shouldShowMessage =
    state.status !== "idle" &&
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
        onClick={() => {
          setOpenedAt(Date.now());
          setIsOpen(true);
        }}
        className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 sm:flex-none sm:text-sm"
      >
        Edit workout
      </button>
    );
  }

  return (
    <section className="mt-2 w-full basis-full rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Edit workout</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Update the workout details without changing the logged exercises or
            sets.
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

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="workoutId" value={workout.id} />

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Workout title
          </label>
          <input
            id="title"
            name="title"
            maxLength={100}
            defaultValue={workout.title}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={toDateInputValue(workout.date)}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div>
          <label htmlFor="goal" className="block text-sm font-medium">
            Goal
          </label>
          <select
            id="goal"
            name="goal"
            defaultValue={workout.goal ?? ""}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">No specific goal</option>
            <option value="Hypertrophy">Hypertrophy</option>
            <option value="Strength">Strength</option>
            <option value="Endurance">Endurance</option>
            <option value="Technique">Technique</option>
            <option value="Recovery">Recovery</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            maxLength={2000}
            rows={4}
            defaultValue={workout.notes ?? ""}
            placeholder="How did the session feel? Any pain, fatigue, or changes?"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {shouldShowMessage && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
              state.status === "success"
                ? "border-emerald-300/25 bg-emerald-50 text-emerald-700"
                : "border-red-300/25 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}

        <ToastSubmitButton
          pendingText="Saving workout..."
          toastMessage="Saving workout..."
          className="w-full rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          Save workout
        </ToastSubmitButton>
      </form>
    </section>
  );
}
