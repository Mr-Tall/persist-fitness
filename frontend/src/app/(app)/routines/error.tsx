"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function RoutinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      context="Routines"
      description="Your saved routines are still safe. Try loading them again."
      destinationHref="/dashboard"
      destinationLabel="Go to Today"
      error={error}
      reset={reset}
      title="Routines couldn't load"
    />
  );
}
