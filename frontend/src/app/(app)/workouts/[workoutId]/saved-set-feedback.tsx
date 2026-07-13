"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const SAVED_SET_FEEDBACK_DURATION_MS = 1200;

type SavedSetFeedbackValue = {
  savedSetNumber: number | null;
  confirmSavedSet: (setNumber: number) => void;
};

const SavedSetFeedbackContext = createContext<SavedSetFeedbackValue>({
  savedSetNumber: null,
  confirmSavedSet: () => undefined,
});

export function SavedSetFeedbackProvider({ children }: { children: ReactNode }) {
  const [savedSetNumber, setSavedSetNumber] = useState<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  const confirmSavedSet = useCallback((setNumber: number) => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }

    setSavedSetNumber(setNumber);
    clearTimerRef.current = window.setTimeout(() => {
      setSavedSetNumber(null);
      clearTimerRef.current = null;
    }, SAVED_SET_FEEDBACK_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({ savedSetNumber, confirmSavedSet }),
    [confirmSavedSet, savedSetNumber]
  );

  return (
    <SavedSetFeedbackContext.Provider value={value}>
      {children}
    </SavedSetFeedbackContext.Provider>
  );
}

export function useSavedSetFeedback() {
  return useContext(SavedSetFeedbackContext);
}
