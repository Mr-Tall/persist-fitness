"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

import {
  createRoutineWithState,
  type CreateRoutineFormState,
} from "@/app/actions/routines";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: CreateRoutineFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

const controlClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus-visible:border-emerald-300/60 focus-visible:ring-2 focus-visible:ring-emerald-300/25";

export function NewRoutineForm() {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const messageId = `${id}-message`;

  const [state, formAction, isPending] = useActionState(
    async (previousState: CreateRoutineFormState, formData: FormData) => {
      const result = await createRoutineWithState(previousState, formData);
      setShowMessage(true);
      return result;
    },
    initialState,
  );

  const hasError =
    showMessage && state.status === "error" && Boolean(state.message);

  useEffect(() => {
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
      onSubmit={() => setShowMessage(false)}
    >
      {hasError && (
        <p
          className="rounded-2xl border border-red-300/25 bg-red-400/[0.08] px-4 py-3 text-sm font-bold leading-6 text-red-200 outline-none"
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
          Routine title
        </label>
        <input
          autoComplete="off"
          className={controlClassName}
          id={`${id}-title`}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Example: Push Day, Pull Day, Leg Day"
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
        <label className="block text-sm font-bold text-neutral-200" htmlFor={`${id}-description`}>
          Description
        </label>
        <textarea
          className={`${controlClassName} min-h-28 resize-y`}
          id={`${id}-description`}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Example: Chest, shoulders, and triceps with a focus on progressive overload."
          rows={4}
          value={description}
        />
      </div>

      <SubmitButton
        className="min-h-12 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
        disabled={isPending}
        pendingText="Creating routine..."
      >
        Create routine
      </SubmitButton>
    </form>
  );
}
