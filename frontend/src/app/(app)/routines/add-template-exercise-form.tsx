"use client";

import {
  addExerciseToRoutineWithState,
  type AddRoutineExerciseFormState,
} from "@/app/actions/routines";
import { ExerciseSelect } from "@/components/exercise-select";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

type AddTemplateExerciseFormProps = {
  routineId: string;
  exercises: {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
    isFavorite?: boolean;
  }[];
  isEmptyRoutine?: boolean;
};

const initialState: AddRoutineExerciseFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

export function AddTemplateExerciseForm({
  routineId,
  exercises,
  isEmptyRoutine = false,
}: AddTemplateExerciseFormProps) {
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectorVersion, setSelectorVersion] = useState(0);
  const [showActionMessage, setShowActionMessage] = useState(true);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const setsId = useId();
  const repsId = useId();
  const notesId = useId();
  const statusId = useId();
  const [state, formAction] = useActionState(
    async (
      previousState: AddRoutineExerciseFormState,
      formData: FormData,
    ): Promise<AddRoutineExerciseFormState> => {
      const wasMobileSheetOpen = isSheetOpen;
      const result = await addExerciseToRoutineWithState(
        previousState,
        formData,
      );

      if (result.status === "success") {
        formRef.current?.reset();
        setSets("");
        setReps("");
        setNotes("");
        setCanSubmit(false);
        setSelectorVersion((version) => version + 1);

        if (wasMobileSheetOpen) {
          setShowActionMessage(false);
          setIsSheetOpen(false);
        }
      }

      return result;
    },
    initialState,
  );

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

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

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          setShowActionMessage(false);
          setIsSheetOpen(true);
        }}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black md:hidden ${
          isEmptyRoutine
            ? "bg-emerald-400 text-black hover:bg-emerald-300"
            : "border border-white/10 bg-white/[0.06] text-white hover:border-emerald-300/35 hover:bg-emerald-400/[0.08]"
        }`}
        aria-label="Open add exercise"
        aria-haspopup="dialog"
        aria-expanded={isSheetOpen}
        aria-hidden={isSheetOpen ? true : undefined}
        tabIndex={isSheetOpen ? -1 : undefined}
      >
        <span aria-hidden="true" className="text-lg leading-none">
          +
        </span>
        Add exercise
      </button>

      <AccessibleDialog
        descriptionId={descriptionId}
        initialFocusSelector="input[type='search']"
        inlineClassName="hidden md:flex md:h-auto md:w-full md:flex-col md:overflow-hidden md:rounded-3xl md:border md:border-white/10 md:bg-white/[0.05] md:shadow-sm"
        onClose={closeSheet}
        open={isSheetOpen}
        overlayClassName="sm:items-end sm:justify-start sm:p-0 md:items-center md:justify-center md:p-4"
        panelClassName="sm:h-[calc(100dvh-0.75rem)] sm:max-h-none sm:max-w-none sm:rounded-t-[2rem] sm:rounded-b-none md:h-auto md:max-h-[calc(100dvh-2rem)] md:max-w-xl md:rounded-3xl"
        renderInlineWhenClosed
        restoreFocusRef={launcherRef}
        titleId={titleId}
      >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 md:border-b-0 md:px-5 md:pb-0 md:pt-5">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300 md:hidden">
                Plan routine
              </p>
              <h2 id={titleId} className="mt-0.5 text-lg font-black text-white md:mt-0">
                Add exercise
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-neutral-400">
                Choose a movement and add its planned targets.
              </p>
            </div>

            <button
              type="button"
              onClick={closeSheet}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg font-bold text-neutral-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:hidden"
              aria-label="Close add exercise"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <form
            ref={formRef}
            action={formAction}
            onSubmit={() => setShowActionMessage(true)}
            aria-describedby={showActionMessage && state.message ? statusId : undefined}
            className="flex min-h-0 flex-1 flex-col md:block"
          >
            <input type="hidden" name="routineId" value={routineId} />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:overflow-visible md:px-5">
              <ExerciseSelect
                key={selectorVersion}
                exercises={exercises}
                onValidityChange={setCanSubmit}
              />

              <fieldset className="mt-5 border-t border-white/10 pt-4">
                <legend className="text-sm font-black text-white">
                  Planned targets
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor={setsId} className="block text-xs font-bold text-neutral-300">
                      Sets
                    </label>
                    <input
                      id={setsId}
                      name="sets"
                      type="number"
                      min="1"
                      max="20"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="3"
                      value={sets}
                      onChange={(event) => setSets(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/60 focus-visible:ring-2 focus-visible:ring-emerald-400/35"
                    />
                  </div>

                  <div>
                    <label htmlFor={repsId} className="block text-xs font-bold text-neutral-300">
                      Reps
                    </label>
                    <input
                      id={repsId}
                      name="reps"
                      autoComplete="off"
                      placeholder="8-12"
                      value={reps}
                      onChange={(event) => setReps(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/60 focus-visible:ring-2 focus-visible:ring-emerald-400/35"
                    />
                  </div>

                  <div>
                    <label htmlFor={notesId} className="block text-xs font-bold text-neutral-300">
                      Notes
                    </label>
                    <input
                      id={notesId}
                      name="notes"
                      autoComplete="off"
                      placeholder="Optional"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none transition placeholder:text-neutral-600 focus-visible:border-emerald-300/60 focus-visible:ring-2 focus-visible:ring-emerald-400/35"
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-neutral-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:border-t-0 md:bg-transparent md:px-5 md:pb-5 md:pt-0">
              {showActionMessage && state.status !== "idle" && state.message && (
                <p
                  id={statusId}
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

              <ToastSubmitButton
                pendingText="Adding exercise..."
                toastMessage="Adding exercise..."
                disabled={!canSubmit}
                className="min-h-12 w-full rounded-xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-400 md:w-auto"
              >
                Add exercise
              </ToastSubmitButton>
            </div>
          </form>
      </AccessibleDialog>
    </>
  );
}
