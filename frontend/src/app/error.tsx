"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const developmentMessage =
    process.env.NODE_ENV === "development" ? error.message : "";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-red-300/20 bg-red-400/[0.08] p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-red-300">
          Something went wrong
        </p>

        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Persist hit an unexpected error.
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          Your workout data is still protected. Try again, or head back to the
          dashboard and continue from there.
        </p>

        {developmentMessage && (
          <p className="mt-5 rounded-2xl border border-red-300/20 bg-black/30 px-4 py-3 text-left text-xs leading-5 text-red-100">
            {developmentMessage}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
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