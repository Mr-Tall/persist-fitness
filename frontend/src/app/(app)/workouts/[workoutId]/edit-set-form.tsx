"use client";

import {
  updateSetInExerciseWithState,
  type UpdateSetFormState,
} from "@/app/actions/workout-exercises";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { normalizeTrackingType } from "@/lib/exercise-tracking";
import { getOfflineSetValues } from "@/lib/offline-workout/form-values";
import { isTemporarySetId } from "@/lib/offline-workout/types";
import { useOfflineWorkout } from "./workout-experience-provider";

type EditSetFormProps = {
  workoutId: string;
  workoutExerciseId?: string;
  set: {
    id: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    rir: number | null;
    tempo: string | null;
    notes: string | null;
    durationSeconds?: number | null;
    distance?: number | null;
    distanceUnit?: string | null;
  };
  trackingType?: string | null;
};

const initialState: UpdateSetFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

const editSetDialogOpenedEvent = "persist:edit-set-dialog-opened";

const editableFieldNames = [
  "weight", "reps", "rir", "tempo", "notes",
  "minutes", "seconds", "distance", "distanceUnit",
] as const;

type EditableSetValues = Record<(typeof editableFieldNames)[number], string>;

function getEditableSetValues(form: HTMLFormElement): EditableSetValues {
  const formData = new FormData(form);

  return Object.fromEntries(
    editableFieldNames.map((fieldName) => [
      fieldName,
      String(formData.get(fieldName) ?? ""),
    ])
  ) as EditableSetValues;
}

function restoreEditableSetValues(
  form: HTMLFormElement,
  values: EditableSetValues
) {
  for (const fieldName of editableFieldNames) {
    const field = form.elements.namedItem(fieldName);

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    ) {
      field.value = values[fieldName];
    }
  }
}

export function EditSetForm({
  workoutId,
  workoutExerciseId = "",
  set,
  trackingType,
}: EditSetFormProps) {
  const mode = normalizeTrackingType(trackingType);
  const offline = useOfflineWorkout();
  const markSyncSaved = offline?.markSaved;
  const [isOpen, setIsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const primaryFieldRef = useRef<HTMLInputElement>(null);
  const submittedValuesRef = useRef<EditableSetValues | null>(null);
  const fieldId = useId();
  const titleId = `${fieldId}-title`;
  const descriptionId = `${fieldId}-description`;
  const messageId = `${fieldId}-message`;

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

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
        closeDialog();
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
      markSyncSaved?.();
      submittedValuesRef.current = null;
      toast.success(state.message);
      return;
    }

    if (state.status === "error") {
      markSyncSaved?.();
      toast.error(state.message);
    }
  }, [markSyncSaved, openedAt, state.message, state.status, state.submittedAt]);

  useLayoutEffect(() => {
    if (
      shouldShowError &&
      formRef.current &&
      submittedValuesRef.current
    ) {
      restoreEditableSetValues(formRef.current, submittedValuesRef.current);
      submittedValuesRef.current = null;
    }
  }, [shouldShowError, state.submittedAt]);

  useEffect(() => {
    function closeWhenAnotherSetOpens(event: Event) {
      const openedSetId = (event as CustomEvent<string>).detail;

      if (openedSetId !== set.id) {
        setIsOpen(false);
      }
    }

    window.addEventListener(editSetDialogOpenedEvent, closeWhenAnotherSetOpens);

    return () => {
      window.removeEventListener(
        editSetDialogOpenedEvent,
        closeWhenAnotherSetOpens
      );
    };
  }, [set.id]);

  function openDialog() {
    window.dispatchEvent(
      new CustomEvent<string>(editSetDialogOpenedEvent, { detail: set.id })
    );
    setOpenedAt(Date.now());
    setIsOpen(true);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Edit set ${set.setNumber}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-hidden={isOpen ? true : undefined}
        tabIndex={isOpen ? -1 : undefined}
        onClick={openDialog}
        className="min-h-11 rounded-xl px-3 py-2 text-xs font-bold text-text-secondary transition hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Edit
      </button>

      <AccessibleDialog
        descriptionId={
          shouldShowError ? `${descriptionId} ${messageId}` : descriptionId
        }
        initialFocusRef={primaryFieldRef}
        onClose={closeDialog}
        open={isOpen}
        restoreFocusRef={triggerRef}
        titleId={titleId}
      >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-text-secondary">
                  Set {set.setNumber}
                </p>
                <h2 id={titleId} className="mt-0.5 text-lg font-black text-white">
                  Edit set {set.setNumber}
                </h2>
                <p
                  id={descriptionId}
                  className="mt-1 text-sm leading-6 text-neutral-400"
                >
                  Update load, reps, effort, tempo, or notes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                aria-label={`Cancel editing set ${set.setNumber}`}
                className="flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-border bg-action-secondary px-3 py-2 text-sm font-bold text-text-secondary transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Cancel
              </button>
            </header>

            <form
              ref={formRef}
              data-sensitive
              data-ph-mask
              data-sentry-mask
              action={formAction}
              onSubmit={(event) => {
                submittedValuesRef.current = getEditableSetValues(
                  event.currentTarget
                );
                if (
                  offline &&
                  (!navigator.onLine || isTemporarySetId(set.id))
                ) {
                  event.preventDefault();
                  const values = getOfflineSetValues(
                    new FormData(event.currentTarget),
                    mode,
                  );
                  void offline
                    .editSetOffline(workoutExerciseId, set.id, values)
                    .then(() => {
                      submittedValuesRef.current = null;
                      closeDialog();
                      toast.success("Set changes saved offline.");
                    });
                } else {
                  offline?.markSaving();
                }
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="workoutId" value={workoutId} />
              <input type="hidden" name="workoutSetId" value={set.id} />

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {mode === "weight_reps" && <div>
                    <label
                      htmlFor={`${fieldId}-weight`}
                      className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Weight
                    </label>
                    <input
                      ref={primaryFieldRef}
                      id={`${fieldId}-weight`}
                      name="weight"
                      type="number"
                      min="0"
                      max="10000"
                      step="0.5"
                      inputMode="decimal"
                      enterKeyHint="next"
                      autoComplete="off"
                      defaultValue={set.weight ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none transition focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
                    />
                  </div>}

                  {(mode === "weight_reps" || mode === "reps_only") && <div>
                    <label
                      htmlFor={`${fieldId}-reps`}
                      className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Reps
                    </label>
                    <input
                      id={`${fieldId}-reps`}
                      ref={mode === "reps_only" ? primaryFieldRef : undefined}
                      name="reps"
                      type="number"
                      min="0"
                      max="10000"
                      step="1"
                      inputMode="numeric"
                      enterKeyHint="next"
                      autoComplete="off"
                      defaultValue={set.reps ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none transition focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
                    />
                  </div>}

                  {(mode === "weight_reps" || mode === "reps_only") && <div>
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
                      enterKeyHint="next"
                      autoComplete="off"
                      defaultValue={set.rir ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base text-text-primary outline-none transition focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
                    />
                  </div>}

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
                      defaultValue={set.tempo ?? ""}
                      placeholder="3-1-1"
                      className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
                    />
                  </div>}

                  {(mode === "time" || mode === "distance_time") && (
                    <>
                      <div>
                        <label htmlFor={`${fieldId}-minutes`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Minutes</label>
                        <input ref={mode === "time" ? primaryFieldRef : undefined} id={`${fieldId}-minutes`} name="minutes" type="number" min="0" max="1440" step="1" inputMode="numeric" autoComplete="off" defaultValue={set.durationSeconds ? Math.floor(set.durationSeconds / 60) : ""} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30" />
                      </div>
                      <div>
                        <label htmlFor={`${fieldId}-seconds`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Seconds</label>
                        <input id={`${fieldId}-seconds`} name="seconds" type="number" min="0" max="59" step="1" inputMode="numeric" autoComplete="off" defaultValue={set.durationSeconds ? set.durationSeconds % 60 : ""} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30" />
                      </div>
                    </>
                  )}

                  {(mode === "distance" || mode === "distance_time") && (
                    <>
                      <div>
                        <label htmlFor={`${fieldId}-distance`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Distance</label>
                        <input ref={primaryFieldRef} id={`${fieldId}-distance`} name="distance" type="number" min="0" max="1000000" step="any" inputMode="decimal" autoComplete="off" defaultValue={set.distance ?? ""} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30" />
                      </div>
                      <div>
                        <label htmlFor={`${fieldId}-distance-unit`} className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Unit</label>
                        <select id={`${fieldId}-distance-unit`} name="distanceUnit" defaultValue={set.distanceUnit ?? "m"} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base font-bold text-text-primary outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30">
                          <option value="m">m</option><option value="km">km</option><option value="mi">mi</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
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
                      rows={4}
                      inputMode="text"
                      enterKeyHint="enter"
                      autoComplete="off"
                      defaultValue={set.notes ?? ""}
                      placeholder="Optional"
                      className="mt-1 min-h-24 w-full resize-y rounded-xl border border-border bg-surface px-3 py-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/30"
                    />
                  </div>

                  {shouldShowError && (
                    <p
                      id={messageId}
                      role="alert"
                      className="break-words rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-bold leading-6 text-danger sm:col-span-2"
                    >
                      {state.message}
                    </p>
                  )}
                </div>
              </div>

              <footer className="shrink-0 border-t border-white/10 bg-neutral-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-5">
                <ToastSubmitButton
                  pendingText="Saving changes..."
                  toastMessage="Saving set changes..."
                  className="min-h-12 w-full rounded-xl bg-action px-4 py-3 font-black text-action-foreground transition hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  Save changes
                </ToastSubmitButton>
              </footer>
            </form>
      </AccessibleDialog>
    </>
  );
}
