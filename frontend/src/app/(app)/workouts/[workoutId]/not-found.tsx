import Link from "next/link";

export default function WorkoutNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
          Workout not found
        </p>

        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          This workout is unavailable.
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          It may have been deleted, moved, or belong to another account. Your
          other saved workouts are still available.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/workouts"
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
          >
            Back to workouts
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}