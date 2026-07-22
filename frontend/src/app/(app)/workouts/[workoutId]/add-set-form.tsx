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
  useState,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";
import type { AddSetPrefill } from "./add-set-prefill";
import { RestTimer } from "./rest-timer";
import { useSavedSetFeedback } from "./saved-set-feedback";
import { normalizeTrackingType } from "@/lib/exercise-tracking";
import { getOfflineSetValues } from "@/lib/offline-workout/form-values";
import { useOfflineWorkout } from "./workout-experience-provider";

type AddSetFormProps = {
  workoutId: string;
  workoutExerciseId: string;
  prefill?: AddSetPrefill;
  trackingType?: string | null;
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
  minutes: string;
  seconds: string;
  distance: string;
  distanceUnit: string;
};

const submittedFieldNames = [
  "weight",
  "reps",
  "rir",
  "tempo",
  "notes",
  "minutes",
  "seconds",
  "distance",
  "distanceUnit",
] as const;

function getFieldValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement
    ? field.value
    : "";
}

function getSetValues(form: HTMLFormElement): SubmittedSetValues {
  return {
    weight: getFieldValue(form, "weight"),
    reps: getFieldValue(form, "reps"),
    rir: getFieldValue(form, "rir"),
    tempo: getFieldValue(form, "tempo"),
    notes: getFieldValue(form, "notes"),
    minutes: getFieldValue(form, "minutes"),
    seconds: getFieldValue(form, "seconds"),
    distance: getFieldValue(form, "distance"),
    distanceUnit: getFieldValue(form, "distanceUnit"),
  };
}

function restoreSetValues(
  form: HTMLFormElement,
  values: SubmittedSetValues
) {
  for (const name of submittedFieldNames) {
    const field = form.elements.namedItem(name);
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    ) {
      field.value = values[name];
    }
  }
}

function moveFocusOnEnter(
  event: KeyboardEvent<HTMLInputElement>,
  target: string,
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

  targetElement?.focus();
}

export function AddSetForm({
  workoutId,
  workoutExerciseId,
  prefill,
  trackingType,
}: AddSetFormProps) {
  const mode = normalizeTrackingType(trackingType);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValuesRef = useRef<SubmittedSetValues>(null);
  const fieldId = useId();
  const [state, formAction] = useActionState(
    addSetToExerciseWithState,
    initialState
  );
  const offline = useOfflineWorkout();
  const markSyncSaved = offline?.markSaved;
  const [offlineMessage, setOfflineMessage] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const { confirmSavedSet } = useSavedSetFeedback();
  const messageId = `${fieldId}-message`;
  const displayedState = offlineMessage ?? state;
  const hasMessage = displayedState.status !== "idle" && Boolean(displayedState.message);

  useEffect(() => {
    if (!state.submittedAt || !state.message) {
      return;
    }

    if (state.status === "success") {
      markSyncSaved?.();
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
        minutes: "",
        seconds: "",
        distance: "",
        distanceUnit: submittedValues.distanceUnit || "m",
      });
      const nextFieldName =
        mode === "weight_reps" || mode === "reps_only"
          ? "reps"
          : mode === "time"
            ? "minutes"
            : "distance";
      const nextField = form.elements.namedItem(nextFieldName);
      if (nextField instanceof HTMLElement) nextField.focus();
      if (state.savedSetNumber !== undefined) {
        confirmSavedSet(state.savedSetNumber);
      }
      submittedValuesRef.current = null;
      return;
    }

    if (state.status === "error") {
      markSyncSaved?.();
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
    mode,
    markSyncSaved,
  ]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(event) => {
          submittedValuesRef.current = getSetValues(event.currentTarget);
          setOfflineMessage(null);
          if (!navigator.onLine && offline) {
            event.preventDefault();
            const form = event.currentTarget;
            const values = getOfflineSetValues(new FormData(form), mode);
            const hasValue = Object.entries(values).some(
              ([name, value]) => name !== "distanceUnit" && value !== null,
            );
            if (!hasValue) {
              setOfflineMessage({
                status: "error",
                message: "Enter a tracked result or note before saving a set.",
              });
              return;
            }
            void offline
              .addSetOffline(workoutExerciseId, values)
              .then((setNumber) => {
                const submittedValues = submittedValuesRef.current ?? getSetValues(form);
                form.reset();
                restoreSetValues(form, {
                  weight: submittedValues.weight,
                  reps: "",
                  rir: submittedValues.rir,
                  tempo: submittedValues.tempo,
                  notes: "",
                  minutes: "",
                  seconds: "",
                  distance: "",
                  distanceUnit: submittedValues.distanceUnit || "m",
                });
                const nextName = mode === "weight_reps" || mode === "reps_only"
                  ? "reps"
                  : mode === "time" ? "minutes" : "distance";
                (form.elements.namedItem(nextName) as HTMLElement | null)?.focus();
                setOfflineMessage({
                  status: "success",
                  message: `Set ${setNumber} saved offline.`,
                });
                toast.success(`Set ${setNumber} saved offline.`);
                submittedValuesRef.current = null;
              })
              .catch(() => {
                setOfflineMessage({
                  status: "error",
                  message: "This set could not be saved offline. Your entries are still here.",
                });
              });
          } else {
            offline?.markSaving();
          }
        }}
        aria-describedby={hasMessage ? messageId : undefined}
        data-add-set-editor
        data-sensitive
        data-ph-mask
        data-sentry-mask
        className="mt-5 rounded-3xl border border-border bg-surface p-3 shadow-[0_14px_40px_rgba(0,0,0,0.18)] sm:p-4"
      >
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-text-secondary">
            Log next set
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Enter this set&apos;s tracked result, then save.
          </p>
        </div>

        <div className={`grid gap-3 ${mode === "weight_reps" ? "grid-cols-2" : "grid-cols-1"}`}>
          {mode === "weight_reps" && <div>
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
              className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg font-black text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
            />
          </div>}

          {(mode === "weight_reps" || mode === "reps_only") && <div>
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
              onKeyDown={(event) =>
                moveFocusOnEnter(
                  event,
                  mode === "weight_reps" || mode === "reps_only"
                    ? "rir"
                    : "submit",
                )
              }
              placeholder="8"
              className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg font-black text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
            />
          </div>}
        </div>

        {(mode === "time" || mode === "distance_time") && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${fieldId}-minutes`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-300">
                Minutes
              </label>
              <input id={`${fieldId}-minutes`} name="minutes" type="number" min="0" max="1440" step="1" inputMode="numeric" enterKeyHint="next" autoComplete="off" defaultValue={prefill?.durationSeconds ? Math.floor(prefill.durationSeconds / 60) : ""} onKeyDown={(event) => moveFocusOnEnter(event, "seconds")} placeholder="1" className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg font-black text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25" />
            </div>
            <div>
              <label htmlFor={`${fieldId}-seconds`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-300">
                Seconds
              </label>
              <input id={`${fieldId}-seconds`} name="seconds" type="number" min="0" max="59" step="1" inputMode="numeric" enterKeyHint="next" autoComplete="off" defaultValue={prefill?.durationSeconds ? prefill.durationSeconds % 60 : ""} onKeyDown={(event) => moveFocusOnEnter(event, mode === "time" ? "submit" : "distance")} placeholder="30" className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg font-black text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25" />
            </div>
          </div>
        )}

        {(mode === "distance" || mode === "distance_time") && (
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
            <div>
              <label htmlFor={`${fieldId}-distance`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-300">
                Distance
              </label>
              <input id={`${fieldId}-distance`} name="distance" type="number" min="0" max="1000000" step="any" inputMode="decimal" enterKeyHint="next" autoComplete="off" defaultValue={prefill?.distance ?? ""} onKeyDown={(event) => moveFocusOnEnter(event, "distanceUnit")} placeholder="500" className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg font-black text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25" />
            </div>
            <div>
              <label htmlFor={`${fieldId}-distance-unit`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-300">
                Unit
              </label>
              <select id={`${fieldId}-distance-unit`} name="distanceUnit" defaultValue={prefill?.distanceUnit ?? "m"} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-2 py-3 text-base font-bold text-text-primary outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25">
                <option value="m">m</option>
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
          </div>
        )}

        {(mode === "weight_reps" || mode === "reps_only") && <div className="mt-3 grid grid-cols-2 items-end gap-3">
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
              className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
            />
          </div>

          <p className="pb-2 text-xs leading-5 text-neutral-500">
            Reps left in reserve. Optional.
          </p>
        </div>}

        <details className="group mt-3 rounded-2xl border border-white/10 bg-black/15">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-text-secondary outline-none transition hover:bg-action-secondary focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <span>Add details</span>
            <span className="text-xs font-medium text-neutral-500 group-open:hidden">
              {mode === "weight_reps" ? "Tempo and notes" : "Notes"}
            </span>
            <span
              aria-hidden="true"
              className="hidden text-text-primary group-open:inline"
            >
              Done
            </span>
          </summary>

          <div className="grid gap-3 border-t border-white/10 p-3 sm:grid-cols-2">
            {mode === "weight_reps" && <div>
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
                className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
              />
            </div>}

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
                className="mt-1 min-h-12 w-full resize-y rounded-xl border border-border bg-surface px-3 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
              />
            </div>
          </div>
        </details>

        <div className="mt-3 flex sm:justify-end">
          <ToastSubmitButton
            pendingText="Saving..."
            toastMessage="Saving set..."
            className="min-h-12 w-full rounded-xl bg-action px-5 py-3 font-black text-action-foreground shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto sm:min-w-40"
          >
            Save set
          </ToastSubmitButton>
        </div>

        {hasMessage && (
          <p
            id={messageId}
            role={displayedState.status === "error" ? "alert" : "status"}
            className={`mt-3 break-words rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
              displayedState.status === "success"
                ? "border-success/25 bg-success-soft text-success"
                : "border-danger/25 bg-danger-soft text-danger"
            }`}
          >
            {displayedState.message}
          </p>
        )}
      </form>

      <RestTimer />
    </>
  );
}
