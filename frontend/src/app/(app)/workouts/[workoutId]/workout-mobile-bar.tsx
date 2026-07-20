"use client";

import { useEffect, useRef, useState } from "react";
import { FinishWorkoutButton } from "./finish-workout-button";

const KEYBOARD_HEIGHT_THRESHOLD = 120;
const EDITABLE_FIELD_SELECTOR =
  "input:not([type='hidden']):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])";

function isAddSetEditorField(element: Element | null): element is HTMLElement {
  return Boolean(
    element instanceof HTMLElement &&
      element.matches(EDITABLE_FIELD_SELECTOR) &&
      element.closest("[data-add-set-editor]"),
  );
}

function useSuppressDockForKeyboard(enabled: boolean) {
  const [isSuppressed, setIsSuppressed] = useState(false);
  const baselineHeightRef = useRef(0);
  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const visualViewport = window.visualViewport;
    const desktopQuery = window.matchMedia?.("(min-width: 768px)");
    baselineHeightRef.current = Math.max(
      window.innerHeight,
      visualViewport?.height ?? 0,
    );

    function evaluateViewport() {
      const activeElement = document.activeElement;
      const isEditingSet = isAddSetEditorField(activeElement);
      const viewportHeight = visualViewport?.height ?? window.innerHeight;

      if (!isEditingSet || desktopQuery?.matches) {
        if (!isEditingSet && viewportHeight > baselineHeightRef.current) {
          baselineHeightRef.current = viewportHeight;
        }
        setIsSuppressed(false);
        return;
      }

      const heightReduction = baselineHeightRef.current - viewportHeight;
      const keyboardIsOpen = heightReduction >= KEYBOARD_HEIGHT_THRESHOLD;
      setIsSuppressed(keyboardIsOpen);

      if (keyboardIsOpen && activeElement instanceof HTMLElement) {
        const visibleBottom =
          (visualViewport?.offsetTop ?? 0) + viewportHeight;
        if (activeElement.getBoundingClientRect().bottom > visibleBottom - 16) {
          activeElement.scrollIntoView({ block: "nearest" });
        }
      }
    }

    function handleFocusOut() {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
      blurTimerRef.current = window.setTimeout(evaluateViewport, 0);
    }

    function handleFocusIn() {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      evaluateViewport();
    }

    visualViewport?.addEventListener("resize", evaluateViewport);
    visualViewport?.addEventListener("scroll", evaluateViewport);
    window.addEventListener("resize", evaluateViewport);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    desktopQuery?.addEventListener?.("change", evaluateViewport);

    return () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
      visualViewport?.removeEventListener("resize", evaluateViewport);
      visualViewport?.removeEventListener("scroll", evaluateViewport);
      window.removeEventListener("resize", evaluateViewport);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      desktopQuery?.removeEventListener?.("change", evaluateViewport);
    };
  }, [enabled]);

  return isSuppressed;
}

type WorkoutMobileBarProps = {
  workoutId: string;
  workoutStatus: string;
  totalSets: number;
  duration: string;
};

export function WorkoutMobileBar({
  workoutId,
  workoutStatus,
  totalSets,
  duration,
}: WorkoutMobileBarProps) {
  const isSuppressedForKeyboard = useSuppressDockForKeyboard(
    workoutStatus === "active",
  );

  if (workoutStatus === "completed" || isSuppressedForKeyboard) {
    return null;
  }

  return (
    <aside
      aria-label="Workout controls"
      className="fixed inset-x-3 bottom-[calc(var(--mobile-nav-height)_+_0.5rem)] z-40 rounded-2xl border border-white/10 bg-black/90 p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-opacity motion-reduce:transition-none md:hidden"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-black text-white">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"
            />
            Active workout
          </p>
          <p
            title={`${totalSets} sets · Duration ${duration}`}
            className="mt-0.5 truncate text-xs font-medium text-neutral-400"
          >
            {totalSets} {totalSets === 1 ? "set" : "sets"}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">Duration </span>
            {duration}
          </p>
        </div>

        <div className="shrink-0 [&_button]:min-h-12 [&_button]:whitespace-nowrap [&_form]:m-0">
          <FinishWorkoutButton workoutId={workoutId} status={workoutStatus} />
        </div>
      </div>
    </aside>
  );
}
