"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function ProgramsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorState
      context="Programs"
      description="Your workouts and routines are still safe. Try loading training programs again."
      destinationHref="/routines"
      destinationLabel="Go to routines"
      error={error}
      reset={reset}
      title="Training programs couldn't load"
    />
  );
}
