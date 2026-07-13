"use client";

import {
  addSetToExerciseWithState,
  type AddSetFormState,
} from "@/app/actions/workout-exercises";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";
import type { AddSetPrefill } from "./add-set-prefill";
import { RestTimer } from "./rest-timer";
import { useSavedSetFeedback } from "./saved-set-feedback";

type AddSetFormProps = {
  workoutId: string;
  workoutExerciseId: string;
  prefill?: AddSetPrefill;
};

const initialState: AddSetFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

type SubmittedSetValues = {
  weight: string;
  reps: string;
  rir: string;
  tempo: string;
  notes: string;
};

function getSetValues(form: HTMLFormElement): SubmittedSetValues {
  return {
    weight: (form.elements.namedItem("weight") as HTMLInputElement).value,
    reps: (form.elements.namedItem("reps") as HTMLInputElement).value,
    rir: (form.elements.namedItem("rir") as HTMLInputElement).value,
    tempo: (form.elements.namedItem("tempo") as HTMLInputElement).value,
    notes: (form.elements.namedItem("notes") as HTMLInputElement).value,
  };
}

function restoreSetValues(
  form: HTMLFormElement,
  values: SubmittedSetValues
) {
  (form.elements.namedItem("weight") as HTMLInputElement).value = values.weight;
  (form.elements.namedItem("reps") as HTMLInputElement).value = values.reps;
  (form.elements.namedItem("rir") as HTMLInputElement).value = values.rir;
  (form.elements.namedItem("tempo") as HTMLInputElement).value = values.tempo;
  (form.elements.namedItem("notes") as HTMLInputElement).value = values.notes;
}

function moveFocusOnEnter(
  event: KeyboardEvent<HTMLInputElement>,
  target: "reps" | "rir" | "notes" | "submit"
) {
  if (
    event.key !== "Enter" ||
    event.nativeEvent.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }

  event.preventDefault();

  const form = event.currentTarget.form;
  const targetElement =
    target === "submit"
      ? form?.querySelector<HTMLButtonElement>('button[type="submit"]')
      : (form?.elements.namedItem(target) as HTMLElement | null);

  targetElement?.focus({ preventScroll: true });
}

export function AddSetForm({
  workoutId,
  workoutExerciseId,
  prefill,
}: AddSetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValuesRef = useRef<SubmittedSetValues>(null);
  const fieldId = useId();
  const [state, formAction] = useActionState(
    addSetToExerciseWithState,
    initialState
  );
  const { confirmSavedSet } = useSavedSetFeedback();
  const messageId = `${fieldId}-message`;
  const hasMessage = state.status !== "idle" && Boolean(state.message);

  useEffect(() => {
    if (!state.submittedAt || !state.message) {
      return;
    }

    if (state.status === "success") {
      toast.success(state.message);

      const form = formRef.current;
      if (!form) {
        return;
      }

      const submittedValues = submittedValuesRef.current ?? getSetValues(form);

      form.reset();
      restoreSetValues(form, {
        weight: submittedValues.weight,
        reps: "",
        rir: submittedValues.rir,
        tempo: submittedValues.tempo,
        notes: "",
      });
      const repsInput = form.elements.namedItem("reps") as HTMLInputElement;
      repsInput.focus({ preventScroll: true });
      if (state.savedSetNumber !== undefined) {
        confirmSavedSet(state.savedSetNumber);
      }
      submittedValuesRef.current = null;
      return;
    }

    if (state.status === "error") {
      toast.error(state.message);

      const form = formRef.current;
      if (form && submittedValuesRef.current) {
        restoreSetValues(form, submittedValuesRef.current);
        submittedValuesRef.current = null;
      }
    }
  }, [
    confirmSavedSet,
    state.message,
    state.savedSetNumber,
    state.status,
    state.submittedAt,
  ]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(event) => {
          submittedValuesRef.current = getSetValues(event.currentTarget);
        }}
        aria-describedby={hasMessage ? messageId : undefined}
        className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-3 sm:p-4"
      >
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
            Log next set
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Enter your load and reps, then save.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`${fieldId}-weight`}
              className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-300"
            >
              Weight
            </label>
            <input
              id={`${fieldId}-weight`}
              name="weight"
              type="number"
              min="0"
              max="10000"
              step="0.5"
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              defaultValue={prefill?.weight ?? ""}
              onKeyDown={(event) => moveFocusOnEnter(event, "reps")}
              placeholder="225"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-lg font-black text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/70 focus-visible:ring-2 focus-visible:ring-emerald-300/25"
            />
          </div>

          <div>
            <label
              htmlFor={`${fieldId}-reps`}
              className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-300"
            >
              Reps
            </label>
            <input
              id={`${fieldId}-reps`}
              name="reps"
              type="number"
              min="0"
              max="10000"
              step="1"
              inputMode="numeric"
              enterKeyHint="next"
              autoComplete="off"
              defaultValue={prefill?.reps ?? ""}
              onKeyDown={(event) => moveFocusOnEnter(event, "rir")}
              placeholder="8"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-lg font-black text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/70 focus-visible:ring-2 focus-visible:ring-emerald-300/25"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 items-end gap-3">
          <div>
            <label
              htmlFor={`${fieldId}-rir`}
              className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
            >
              RIR
            </label>
            <input
              id={`${fieldId}-rir`}
              name="rir"
              type="number"
              min="0"
              max="10"
              step="1"
              inputMode="numeric"
              enterKeyHint="done"
              autoComplete="off"
              defaultValue={prefill?.rir ?? ""}
              onKeyDown={(event) => moveFocusOnEnter(event, "submit")}
              placeholder="2"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-base font-bold text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/70 focus-visible:ring-2 focus-visible:ring-emerald-300/25"
            />
          </div>

          <p className="pb-2 text-xs leading-5 text-neutral-500">
            Reps left in reserve. Optional.
          </p>
        </div>

        <details className="group mt-3 rounded-2xl border border-white/10 bg-black/15">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-neutral-300 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-emerald-300/40 [&::-webkit-details-marker]:hidden">
            <span>Add details</span>
            <span className="text-xs font-medium text-neutral-500 group-open:hidden">
              Tempo and notes
            </span>
            <span
              aria-hidden="true"
              className="hidden text-emerald-300 group-open:inline"
            >
              Done
            </span>
          </summary>

          <div className="grid gap-3 border-t border-white/10 p-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${fieldId}-tempo`}
                className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
              >
                Tempo
              </label>
              <input
                id={`${fieldId}-tempo`}
                name="tempo"
                maxLength={30}
                inputMode="text"
                enterKeyHint="next"
                autoComplete="off"
                defaultValue={prefill?.tempo ?? ""}
                onKeyDown={(event) => moveFocusOnEnter(event, "notes")}
                placeholder="3-1-1"
                className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-base text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/70 focus-visible:ring-2 focus-visible:ring-emerald-300/25"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldId}-notes`}
                className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
              >
                Notes
              </label>
              <textarea
                id={`${fieldId}-notes`}
                name="notes"
                maxLength={2000}
                rows={2}
                inputMode="text"
                enterKeyHint="enter"
                autoComplete="off"
                placeholder="Optional"
                className="mt-1 min-h-12 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-base text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/70 focus-visible:ring-2 focus-visible:ring-emerald-300/25"
              />
            </div>
          </div>
        </details>

        <div className="mt-3 flex sm:justify-end">
          <ToastSubmitButton
            pendingText="Saving..."
            toastMessage="Saving set..."
            className="min-h-12 w-full rounded-xl bg-emerald-400 px-5 py-3 font-black text-black shadow-[0_12px_32px_rgba(52,211,153,0.16)] transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto sm:min-w-40"
          >
            Save set
          </ToastSubmitButton>
        </div>

        {hasMessage && (
          <p
            id={messageId}
            role={state.status === "error" ? "alert" : "status"}
            className={`mt-3 break-words rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
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
