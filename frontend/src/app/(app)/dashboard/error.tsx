"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard failed to render.", {
      errorType: error.name,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-6xl items-start px-4 py-4 sm:items-center sm:px-6 sm:py-10">
      <section
        aria-labelledby="dashboard-error-title"
        role="alert"
        className="w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-8"
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Today
        </p>

        <h1
          id="dashboard-error-title"
          className="mt-2 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl"
        >
          Today couldn&apos;t load
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-300">
          Your workout data is still safe. Try loading this screen again.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={reset}
            fullWidth
            className="min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Try again
          </Button>

          <Button
            href="/workouts"
            variant="secondary"
            fullWidth
            className="min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            View workouts
          </Button>
        </div>
      </section>
    </main>
  );
}
