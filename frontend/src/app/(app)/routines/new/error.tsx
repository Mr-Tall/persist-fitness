"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function NewRoutineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      context="New routine"
      description="Nothing has been changed. Try loading the routine setup again."
      destinationHref="/routines"
      destinationLabel="Back to routines"
      error={error}
      reset={reset}
      title="Routine setup couldn't load"
    />
  );
}
