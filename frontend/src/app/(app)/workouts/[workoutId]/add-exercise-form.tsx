"use client";

import {
  addExerciseToWorkoutWithState,
  type AddExerciseFormState,
} from "@/app/actions/workout-exercises";
import { ExerciseSelect } from "@/components/exercise-select";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { ToastSubmitButton } from "@/components/ui/toast-submit-button";
import {
  useActionState,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

type AddExerciseFormProps = {
  workoutId: string;
  exercises: {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
    isFavorite?: boolean;
  }[];
};

const initialState: AddExerciseFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

export function AddExerciseForm({ workoutId, exercises }: AddExerciseFormProps) {
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectorVersion, setSelectorVersion] = useState(0);
  const [showActionMessage, setShowActionMessage] = useState(true);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const handledSubmittedAtRef = useRef<number | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [state, formAction] = useActionState(
    addExerciseToWorkoutWithState,
    initialState
  );

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const handleActionResult = useEffectEvent((result: AddExerciseFormState) => {
    if (result.status === "success") {
      setCanSubmit(false);
      setSelectorVersion((version) => version + 1);

      if (isSheetOpen) {
        setShowActionMessage(false);
        setIsSheetOpen(false);
      }

      toast.success(result.message);
      return;
    }

    if (result.status === "error") {
      toast.error(result.message);
    }
  });

  useEffect(() => {
    if (!state.submittedAt || !state.message) {
      return;
    }

    if (handledSubmittedAtRef.current === state.submittedAt) {
      return;
    }
    handledSubmittedAtRef.current = state.submittedAt;
    handleActionResult(state);
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
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:border-emerald-300/35 hover:bg-emerald-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black md:hidden"
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
        inlineClassName="hidden md:flex md:h-auto md:w-full md:flex-col md:overflow-hidden md:rounded-3xl md:border md:border-white/10 md:bg-white/[0.06] md:shadow-sm md:backdrop-blur"
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
                Build session
              </p>
              <h2 id={titleId} className="mt-0.5 text-lg font-black text-white md:mt-0">
                Add exercise
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-neutral-400">
                Choose from the library or add a custom movement.
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
            action={formAction}
            onSubmit={() => setShowActionMessage(true)}
            className="flex min-h-0 flex-1 flex-col md:block"
          >
            <input type="hidden" name="workoutId" value={workoutId} />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:overflow-visible md:px-5">
              <ExerciseSelect
                key={selectorVersion}
                exercises={exercises}
                onValidityChange={setCanSubmit}
              />
            </div>

            <div className="shrink-0 border-t border-white/10 bg-neutral-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:border-t-0 md:bg-transparent md:px-5 md:pb-5 md:pt-0">
              {showActionMessage && state.status !== "idle" && state.message && (
                <p
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
                className="min-h-12 w-full rounded-xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 disabled:bg-neutral-700 disabled:text-neutral-400 md:w-auto"
              >
                Add exercise
              </ToastSubmitButton>
            </div>
          </form>
      </AccessibleDialog>
    </>
  );
}
