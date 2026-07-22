"use client";

import {
  useActionState,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  createWorkoutWithState,
  type CreateWorkoutFormState,
} from "@/app/actions/workouts";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: CreateWorkoutFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

const controlClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25";

export function NewWorkoutForm({ today }: { today: string }) {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const messageRef = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const messageId = `${id}-message`;

  const [state, formAction, isPending] = useActionState(
    createWorkoutWithState,
    initialState,
  );

  const hasError =
    !isPending && state.status === "error" && Boolean(state.message);

  useLayoutEffect(() => {
    if (hasError) {
      messageRef.current?.focus({ preventScroll: true });
    }
  }, [hasError, state.submittedAt]);

  return (
    <form
      action={formAction}
      aria-busy={isPending}
      aria-describedby={hasError ? messageId : undefined}
      className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-6"
    >
      {hasError && (
        <p
          className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-bold leading-6 text-danger outline-none"
          id={messageId}
          ref={messageRef}
          role="alert"
          tabIndex={-1}
        >
          {state.message}
        </p>
      )}

      <div>
        <label className="block text-sm font-bold text-neutral-200" htmlFor={`${id}-title`}>
          Workout title
        </label>
        <input
          autoComplete="off"
          className={controlClassName}
          id={`${id}-title`}
          maxLength={100}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Example: Push Day, Upper Strength, Leg Day"
          required
          value={title}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-200" htmlFor={`${id}-goal`}>
          Goal
        </label>
        <select
          className={controlClassName}
          id={`${id}-goal`}
          name="goal"
          onChange={(event) => setGoal(event.target.value)}
          value={goal}
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
        <label className="block text-sm font-bold text-neutral-200" htmlFor={`${id}-date`}>
          Date
        </label>
        <input
          className={controlClassName}
          id={`${id}-date`}
          name="date"
          onChange={(event) => setDate(event.target.value)}
          required
          type="date"
          value={date}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-200" htmlFor={`${id}-notes`}>
          Notes
        </label>
        <textarea
          className={`${controlClassName} min-h-28 resize-y`}
          id={`${id}-notes`}
          maxLength={2000}
          name="notes"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="How did the session feel? Any soreness, form notes, or goals?"
          rows={4}
          value={notes}
        />
      </div>

      <SubmitButton
        className="min-h-12 w-full rounded-2xl bg-action px-5 py-3 font-black text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
        disabled={isPending}
        pendingText="Creating workout..."
      >
        Create workout and add exercises
      </SubmitButton>
    </form>
  );
}
