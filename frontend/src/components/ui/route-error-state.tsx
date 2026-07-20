"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

type RouteErrorStateProps = {
  context: string;
  description: string;
  destinationHref: string;
  destinationLabel: string;
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
};

export function RouteErrorState({
  context,
  description,
  destinationHref,
  destinationLabel,
  error,
  reset,
  title,
}: RouteErrorStateProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error(`${context} route failed to render.`, {
      errorType: error.name,
      digest: error.digest ?? null,
    });
    headingRef.current?.focus();
  }, [context, error]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-5xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 sm:flex sm:items-center sm:px-6 sm:py-10">
      <section
        aria-labelledby={headingId}
        className="w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-7"
        role="alert"
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          {context}
        </p>
        <h1
          className="mt-2 text-2xl font-black leading-tight tracking-tight text-white outline-none sm:text-3xl"
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
        >
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-neutral-300">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 font-bold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
            href={destinationHref}
          >
            {destinationLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
