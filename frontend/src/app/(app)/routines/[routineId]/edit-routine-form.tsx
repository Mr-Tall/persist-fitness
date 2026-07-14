"use client";

import {
  updateRoutineWithState,
  type UpdateRoutineFormState,
} from "@/app/actions/routines";
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

type EditRoutineFormProps = {
  routine: {
    id: string;
    title: string;
    goal: string | null;
    description: string | null;
  };
};

const initialState: UpdateRoutineFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

const focusableElementSelector = [
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type EditableRoutineValues = {
  title: string;
  goal: string;
  description: string;
};

function restoreEditableRoutineValues(
  form: HTMLFormElement,
  values: EditableRoutineValues,
) {
  for (const [fieldName, value] of Object.entries(values)) {
    const field = form.elements.namedItem(fieldName);

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    ) {
      field.value = value;
    }
  }
}

export function EditRoutineForm({ routine }: EditRoutineFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showActionMessage, setShowActionMessage] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const submittedValuesRef = useRef<EditableRoutineValues | null>(null);
  const fieldId = useId();
  const dialogTitleId = `${fieldId}-dialog-title`;
  const dialogDescriptionId = `${fieldId}-dialog-description`;
  const titleId = `${fieldId}-title`;
  const goalId = `${fieldId}-goal`;
  const descriptionId = `${fieldId}-description`;
  const messageId = `${fieldId}-message`;

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setShowActionMessage(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const [state, formAction] = useActionState(
    async (
      previousState: UpdateRoutineFormState,
      formData: FormData,
    ): Promise<UpdateRoutineFormState> => {
      const result = await updateRoutineWithState(previousState, formData);

      if (result.status === "success") {
        submittedValuesRef.current = null;
        setTitle("");
        setGoal("");
        setDescription("");
        closeDialog();
      }

      return result;
    },
    initialState,
  );

  const shouldShowMessage =
    showActionMessage && state.status !== "idle" && Boolean(state.message);

  useLayoutEffect(() => {
    if (
      shouldShowMessage &&
      state.status === "error" &&
      formRef.current &&
      submittedValuesRef.current
    ) {
      restoreEditableRoutineValues(formRef.current, submittedValuesRef.current);
      submittedValuesRef.current = null;
    }
  }, [shouldShowMessage, state.status, state.submittedAt]);

  useEffect(() => {
    if (!state.submittedAt || !state.message) {
      return;
    }

    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state.message, state.status, state.submittedAt]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) {
        return;
      }

      const focusableElements = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(focusableElementSelector),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        sheetRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeDialog, isOpen]);

  function openDialog() {
    submittedValuesRef.current = null;
    setTitle(routine.title);
    setGoal(routine.goal ?? "");
    setDescription(routine.description ?? "");
    setShowActionMessage(false);
    setIsOpen(true);
  }

  return (
    <>
      <button
        ref={triggerRef}
        aria-label={`Edit ${routine.title} routine`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-hidden={isOpen ? true : undefined}
        tabIndex={isOpen ? -1 : undefined}
        type="button"
        onClick={openDialog}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
      >
        Edit routine
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/80 px-2 pt-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <section
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={
              shouldShowMessage
                ? `${dialogDescriptionId} ${messageId}`
                : dialogDescriptionId
            }
            tabIndex={-1}
            className="flex h-[calc(100dvh-0.75rem)] w-full flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-neutral-950 shadow-[0_-24px_80px_-35px_rgba(16,185,129,0.55)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl sm:rounded-3xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                  Routine details
                </p>
                <h2
                  id={dialogTitleId}
                  className="mt-0.5 text-lg font-black text-white"
                >
                  Edit routine
                </h2>
                <p
                  id={dialogDescriptionId}
                  className="mt-1 text-sm leading-6 text-neutral-400"
                >
                  Update the name, goal, or description for this routine.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close edit routine"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg font-bold text-neutral-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <form
              ref={formRef}
              action={formAction}
              onSubmit={() => {
                submittedValuesRef.current = { title, goal, description };
                setShowActionMessage(true);
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="routineId" value={routine.id} />

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div>
                  <label
                    htmlFor={titleId}
                    className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Routine name
                  </label>
                  <input
                    ref={titleInputRef}
                    id={titleId}
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    autoComplete="off"
                    enterKeyHint="next"
                    className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base font-bold text-white outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={goalId}
                    className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Goal
                  </label>
                  <select
                    id={goalId}
                    name="goal"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    autoComplete="off"
                    className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-3 text-base text-white outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
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
                  <label
                    htmlFor={descriptionId}
                    className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Description
                  </label>
                  <textarea
                    id={descriptionId}
                    name="description"
                    rows={6}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    autoComplete="off"
                    className="mt-1 min-h-32 w-full resize-y rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-base leading-6 text-white outline-none transition focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                  />
                </div>
              </div>

              <footer className="shrink-0 border-t border-white/10 bg-neutral-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-5">
                {shouldShowMessage && (
                  <p
                    id={messageId}
                    role={state.status === "error" ? "alert" : "status"}
                    className={`mb-3 rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
                      state.status === "success"
                        ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-200"
                        : "border-red-300/25 bg-red-400/[0.08] text-red-200"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="min-h-12 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-neutral-200 transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  >
                    Cancel
                  </button>
                  <ToastSubmitButton
                    pendingText="Saving routine..."
                    toastMessage="Saving routine..."
                    className="min-h-12 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:min-w-40"
                  >
                    Save routine
                  </ToastSubmitButton>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
