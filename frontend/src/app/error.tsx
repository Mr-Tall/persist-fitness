"use client";
import { ErrorReference } from "@/components/observability/error-reference";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-danger/20 bg-danger-soft p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-danger">
          Something went wrong.
        </p>

        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Persist hit an unexpected error.
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          Your workout data is still protected. Try again, or head back to the
          dashboard and continue from there.
        </p>
        <ErrorReference error={error} />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-action px-5 py-3 text-sm font-black text-action-foreground transition hover:bg-action-hover"
          >
            Try again
          </button>

          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            Go to dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
