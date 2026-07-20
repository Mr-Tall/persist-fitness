"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function NewWorkoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      context="New workout"
      description="Your workout history is still safe. Try loading the workout setup again."
      destinationHref="/workouts"
      destinationLabel="Back to workouts"
      error={error}
      reset={reset}
      title="Workout setup couldn't load"
    />
  );
}
