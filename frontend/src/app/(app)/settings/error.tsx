"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      context="Profile"
      description="Your profile settings are still safe. Try loading them again."
      destinationHref="/dashboard"
      destinationLabel="Go to Today"
      error={error}
      reset={reset}
      title="Profile couldn't load"
    />
  );
}
