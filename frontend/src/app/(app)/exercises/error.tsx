"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function ExercisesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      context="Exercises"
      description="Your workout data is still safe. Try loading the exercise library again."
      destinationHref="/dashboard"
      destinationLabel="Go to Today"
      error={error}
      reset={reset}
      title="Exercise library couldn't load"
    />
  );
}
