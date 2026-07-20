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

const editSetDialogOpenedEvent = "persist:edit-set-dialog-opened";

const editableFieldNames = ["weight", "reps", "rir", "tempo", "notes"] as const;

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

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = values[fieldName];
    }
  }
}

export function EditSetForm({ workoutId, set }: EditSetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
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
      submittedValuesRef.current = null;
      toast.success(state.message);
      return;
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [openedAt, state.message, state.status, state.submittedAt]);

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
        className="min-h-11 rounded-xl px-3 py-2 text-xs font-bold text-neutral-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
      >
        Edit
      </button>

      <AccessibleDialog
        descriptionId={
          shouldShowError ? `${descriptionId} ${messageId}` : descriptionId
        }
        initialFocusRef={weightRef}
        onClose={closeDialog}
        open={isOpen}
        restoreFocusRef={triggerRef}
        titleId={titleId}
      >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
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
                className="flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-neutral-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                Cancel
              </button>
            </header>

            <form
              ref={formRef}
              action={formAction}
              onSubmit={(event) => {
                submittedValuesRef.current = getEditableSetValues(
                  event.currentTarget
                );
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="workoutId" value={workoutId} />
              <input type="hidden" name="workoutSetId" value={set.id} />

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`${fieldId}-weight`}
                      className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Weight
                    </label>
                    <input
                      ref={weightRef}
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
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base font-bold text-white outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`${fieldId}-reps`}
                      className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
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
                      defaultValue={set.reps ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base font-bold text-white outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                    />
                  </div>

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
                      enterKeyHint="next"
                      autoComplete="off"
                      defaultValue={set.rir ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base text-white outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                    />
                  </div>

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
                      defaultValue={set.tempo ?? ""}
                      placeholder="3-1-1"
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                    />
                  </div>

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
                      className="mt-1 min-h-24 w-full resize-y rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                    />
                  </div>

                  {shouldShowError && (
                    <p
                      id={messageId}
                      role="alert"
                      className="break-words rounded-2xl border border-red-300/25 bg-red-400/[0.08] px-4 py-3 text-sm font-bold leading-6 text-red-200 sm:col-span-2"
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
                  className="min-h-12 w-full rounded-xl bg-emerald-400 px-4 py-3 font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Save changes
                </ToastSubmitButton>
              </footer>
            </form>
      </AccessibleDialog>
    </>
  );
}
