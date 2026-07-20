"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function ExerciseDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      context="Exercise"
      description="Your training history is still safe. Try loading this exercise again."
      destinationHref="/exercises"
      destinationLabel="Back to exercises"
      error={error}
      reset={reset}
      title="Exercise couldn't load"
    />
  );
}
