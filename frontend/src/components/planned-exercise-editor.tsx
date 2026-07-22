"use client";

import {
  updateExerciseInRoutineWithState,
  type UpdateRoutineExerciseFormState,
} from "@/app/actions/routines";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import {
  createContext,
  type ReactNode,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

type TemplateExercise = {
  id: string;
  name: string;
  sets: number | null;
  reps: string | null;
  notes: string | null;
};

type ProviderProps = {
  children: ReactNode;
  exercises: TemplateExercise[];
  routineId: string;
};

type TriggerProps = {
  exerciseId: string;
  exerciseName: string;
};

type EditorContextValue = {
  activeExerciseId: string | null;
  openEditor: (exerciseId: string, trigger: HTMLButtonElement) => void;
};

type EditableValues = {
  sets: string;
  reps: string;
  notes: string;
};

const initialState: UpdateRoutineExerciseFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

const EditorContext = createContext<EditorContextValue | null>(null);

function restoreEditableValues(form: HTMLFormElement, values: EditableValues) {
  for (const [fieldName, value] of Object.entries(values)) {
    const field = form.elements.namedItem(fieldName);

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = value;
    }
  }
}

export function PlannedExerciseEditorProvider({
  children,
  exercises,
  routineId,
}: ProviderProps) {
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [showActionMessage, setShowActionMessage] = useState(false);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const openingTriggerRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const setsRef = useRef<HTMLInputElement>(null);
  const submittedValuesRef = useRef<EditableValues | null>(null);
  const fieldId = useId();
  const dialogTitleId = `${fieldId}-dialog-title`;
  const dialogDescriptionId = `${fieldId}-dialog-description`;
  const setsId = `${fieldId}-sets`;
  const repsId = `${fieldId}-reps`;
  const notesId = `${fieldId}-notes`;
  const messageId = `${fieldId}-message`;
  const activeExercise =
    exercises.find((exercise) => exercise.id === activeExerciseId) ?? null;

  const closeEditor = useCallback(() => {
    setActiveExerciseId(null);
    setShowActionMessage(false);
    submittedValuesRef.current = null;
  }, []);

  const [state, formAction] = useActionState(
    async (
      previousState: UpdateRoutineExerciseFormState,
      formData: FormData,
    ): Promise<UpdateRoutineExerciseFormState> => {
      const result = await updateExerciseInRoutineWithState(
        previousState,
        formData,
      );

      if (result.status === "success") {
        setSets("");
        setReps("");
        setNotes("");
        closeEditor();
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
      restoreEditableValues(formRef.current, submittedValuesRef.current);
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

  function openEditor(exerciseId: string, trigger: HTMLButtonElement) {
    const exercise = exercises.find((candidate) => candidate.id === exerciseId);

    if (!exercise) {
      return;
    }

    openingTriggerRef.current = trigger;
    submittedValuesRef.current = null;
    setSets(exercise.sets?.toString() ?? "");
    setReps(exercise.reps ?? "");
    setNotes(exercise.notes ?? "");
    setShowActionMessage(false);
    setActiveExerciseId(exercise.id);
  }

  return (
    <EditorContext.Provider value={{ activeExerciseId, openEditor }}>
      {children}

      <AccessibleDialog
        descriptionId={
          shouldShowMessage
            ? `${dialogDescriptionId} ${messageId}`
            : dialogDescriptionId
        }
        initialFocusRef={setsRef}
        onClose={closeEditor}
        open={Boolean(activeExercise)}
        restoreFocusRef={openingTriggerRef}
        titleId={dialogTitleId}
      >
        {activeExercise && (
          <>
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-text-secondary">
                  Planned exercise
                </p>
                <h2
                  id={dialogTitleId}
                  className="mt-0.5 break-words text-lg font-black text-white [overflow-wrap:anywhere]"
                >
                  Edit {activeExercise.name} plan
                </h2>
                <p
                  id={dialogDescriptionId}
                  className="mt-1 text-sm leading-6 text-neutral-400"
                >
                  Update planned sets, target reps, or coaching notes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                aria-label={`Close ${activeExercise.name} plan editor`}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border bg-action-secondary text-lg font-bold text-text-secondary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <form
              ref={formRef}
              action={formAction}
              onSubmit={() => {
                submittedValuesRef.current = { sets, reps, notes };
                setShowActionMessage(true);
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <input type="hidden" name="routineId" value={routineId} />
              <input
                type="hidden"
                name="templateExerciseId"
                value={activeExercise.id}
              />

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={setsId}
                      className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Planned sets
                    </label>
                    <input
                      ref={setsRef}
                      id={setsId}
                      name="sets"
                      type="number"
                      min="1"
                      max="20"
                      step="1"
                      inputMode="numeric"
                      enterKeyHint="next"
                      autoComplete="off"
                      value={sets}
                      onChange={(event) => setSets(event.target.value)}
                      placeholder="3"
                      className="mt-1 min-h-12 w-full rounded-xl border border-border bg-canvas/60 px-3 py-3 text-base font-bold text-text-primary outline-none transition-colors focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={repsId}
                      className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Target reps
                    </label>
                    <input
                      id={repsId}
                      name="reps"
                      inputMode="text"
                      enterKeyHint="next"
                      autoComplete="off"
                      value={reps}
                      onChange={(event) => setReps(event.target.value)}
                      placeholder="8-10"
                      className="mt-1 min-h-12 w-full rounded-xl border border-border bg-canvas/60 px-3 py-3 text-base text-text-primary outline-none transition-colors focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={notesId}
                    className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Notes
                  </label>
                  <textarea
                    id={notesId}
                    name="notes"
                    rows={6}
                    autoComplete="off"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Tempo, technique cue, intensity target, etc."
                    className="mt-1 min-h-32 w-full resize-y rounded-xl border border-border bg-canvas/60 px-3 py-3 text-base leading-6 text-text-primary outline-none transition-colors focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
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
                        ? "border-success/25 bg-success-soft text-success"
                        : "border-danger/25 bg-danger-soft text-danger"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="min-h-12 rounded-xl border border-border bg-action-secondary px-4 py-3 text-sm font-black text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    Cancel
                  </button>
                  <ToastSubmitButton
                    pendingText="Saving exercise..."
                    toastMessage="Saving exercise..."
                    className="min-h-12 rounded-xl bg-action px-4 py-3 text-sm font-black text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-w-40"
                  >
                    Save exercise
                  </ToastSubmitButton>
                </div>
              </footer>
            </form>
          </>
        )}
      </AccessibleDialog>
    </EditorContext.Provider>
  );
}

export function PlannedExerciseEditTrigger({
  exerciseId,
  exerciseName,
}: TriggerProps) {
  const context = useContext(EditorContext);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!context) {
    throw new Error(
      "PlannedExerciseEditTrigger must be used within PlannedExerciseEditorProvider",
    );
  }

  const isActive = context.activeExerciseId === exerciseId;
  const isEditorOpen = context.activeExerciseId !== null;

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => {
        if (triggerRef.current) {
          context.openEditor(exerciseId, triggerRef.current);
        }
      }}
      aria-label={`Edit ${exerciseName} plan`}
      aria-haspopup="dialog"
      aria-expanded={isActive}
      aria-hidden={isEditorOpen ? true : undefined}
      tabIndex={isEditorOpen ? -1 : undefined}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-action-secondary px-3 py-2 text-xs font-black text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      Edit
    </button>
  );
}
