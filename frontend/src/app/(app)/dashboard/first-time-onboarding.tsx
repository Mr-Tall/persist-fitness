"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  completeOnboarding,
  type OnboardingFormState,
} from "@/app/actions/onboarding";

const initialState: OnboardingFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

const focusableElementSelector = [
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const goalOptions = [
  { label: "Build Muscle", value: "Build muscle" },
  { label: "Strength", value: "Get stronger" },
  { label: "General Fitness", value: "General fitness" },
] as const;

type FirstTimeOnboardingProps = {
  restoreFocusId?: string;
};

export function FirstTimeOnboarding({
  restoreFocusId = "dashboard-content",
}: FirstTimeOnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const messageId = `${id}-message`;

  const restoreDashboardFocus = useCallback(() => {
    window.setTimeout(() => {
      const previousFocus = previousFocusRef.current;
      if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus();
        return;
      }

      document.getElementById(restoreFocusId)?.focus();
    }, 0);
  }, [restoreFocusId]);

  const [state, formAction, isPending] = useActionState(
    async (
      previousState: OnboardingFormState,
      formData: FormData,
    ): Promise<OnboardingFormState> => {
      const intent = formData.get("intent");
      const result = await completeOnboarding(previousState, formData);

      if (result.status === "success") {
        setIsVisible(false);
        restoreDashboardFocus();

        if (intent === "create-workout") {
          router.push("/workouts/new");
        }
      }

      return result;
    },
    initialState,
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        event.preventDefault();
        skipButtonRef.current?.click();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableElementSelector),
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        headingRef.current?.focus();
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
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPending, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const focusTimer = window.setTimeout(() => headingRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [isVisible, step]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/85 px-2 pt-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          state.status === "error"
            ? `${descriptionId} ${messageId}`
            : descriptionId
        }
        className="flex h-[calc(100dvh-0.75rem)] w-full flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-neutral-950 shadow-[0_-24px_80px_-35px_rgba(16,185,129,0.65)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl"
      >
        <form
          action={formAction}
          aria-busy={isPending}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" name="goal" value={goal} />

          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Step {step} of 3
            </p>
            <button
              ref={skipButtonRef}
              type="submit"
              name="intent"
              value="skip"
              disabled={isPending}
              className="min-h-11 rounded-xl px-3 text-sm font-bold text-neutral-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-60"
            >
              Skip onboarding
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
            {step === 1 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Welcome to Persist
                </p>
                <h2
                  ref={headingRef}
                  id={titleId}
                  tabIndex={-1}
                  className="mt-2 text-3xl font-black tracking-tight text-white outline-none"
                >
                  Make every workout count.
                </h2>
                <p
                  id={descriptionId}
                  className="mt-3 text-sm leading-6 text-neutral-300"
                >
                  A focused training log for building consistency and seeing what is working.
                </p>

                <ul className="mt-7 space-y-3" aria-label="What Persist helps you do">
                  {["Track workouts", "Monitor progress", "Build routines"].map(
                    (benefit) => (
                      <li
                        key={benefit}
                        className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 font-bold text-white"
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"
                        >
                          ✓
                        </span>
                        {benefit}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Your direction
                </p>
                <h2
                  ref={headingRef}
                  id={titleId}
                  tabIndex={-1}
                  className="mt-2 text-3xl font-black tracking-tight text-white outline-none"
                >
                  What are you training for?
                </h2>
                <p id={descriptionId} className="mt-3 text-sm leading-6 text-neutral-300">
                  Choose a starting goal. You can change it later in Profile.
                </p>

                <div className="mt-7 grid gap-3" role="group" aria-label="Training goal">
                  {goalOptions.map((option) => {
                    const isSelected = goal === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setGoal(option.value)}
                        className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-base font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                          isSelected
                            ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
                            : "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Ready to train
                </p>
                <h2
                  ref={headingRef}
                  id={titleId}
                  tabIndex={-1}
                  className="mt-2 text-3xl font-black tracking-tight text-white outline-none"
                >
                  Create your first workout.
                </h2>
                <p id={descriptionId} className="mt-3 text-sm leading-6 text-neutral-300">
                  Start with a title and add exercises as you train. You can keep it simple.
                </p>

                <div className="mt-7 rounded-3xl border border-emerald-300/25 bg-emerald-400/[0.08] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                    First step
                  </p>
                  <p className="mt-2 text-xl font-black text-white">First Workout</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">
                    Log one session to unlock meaningful progress and training history.
                  </p>
                </div>
              </div>
            )}

            {state.status === "error" && (
              <p
                id={messageId}
                role="alert"
                className="mt-5 rounded-2xl border border-red-300/25 bg-red-400/[0.08] px-4 py-3 text-sm font-bold leading-6 text-red-200"
              >
                {state.message}
              </p>
            )}
          </div>

          <footer className="shrink-0 border-t border-white/10 bg-neutral-950/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-6">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-12 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                Continue
              </button>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGoal("");
                    setStep(3);
                  }}
                  className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-neutral-200 transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Skip goal
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-12 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-2">
                <button
                  type="submit"
                  name="intent"
                  value="create-workout"
                  disabled={isPending}
                  className="min-h-12 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Create Workout"}
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="skip"
                  disabled={isPending}
                  className="min-h-12 rounded-2xl px-5 py-3 text-sm font-bold text-neutral-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-60"
                >
                  Skip for now
                </button>
              </div>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
