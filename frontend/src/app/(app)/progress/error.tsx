"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorReference } from "@/components/observability/error-reference";

export default function ProgressError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Progress failed to render.", {
      errorType: error.name,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <section
        aria-labelledby="progress-error-title"
        className="max-w-xl rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-7"
        role="alert"
      >
        <p className="text-xs font-semibold tracking-[0.16em] text-text-secondary uppercase">
          Progress
        </p>
        <h1
          className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          id="progress-error-title"
        >
          Progress couldn&apos;t load
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
          Your workout history is still safe. Try loading your progress again.
        </p>
        <ErrorReference error={error} />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="min-h-12 w-full bg-action text-action-foreground hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
            onClick={reset}
            type="button"
          >
            Try again
          </Button>
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-strong hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
            href="/workouts"
          >
            View workouts
          </Link>
        </div>
      </section>
    </main>
  );
}
