"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="min-h-12 w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
            onClick={reset}
            type="button"
          >
            Try again
          </Button>
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
            href="/workouts"
          >
            View workouts
          </Link>
        </div>
      </section>
    </main>
  );
}
