import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
          404
        </p>

        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Page not found.
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-300">
          This page may have moved, been deleted, or never existed. Let&apos;s
          get you back to your training dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
          >
            Go to dashboard
          </Link>

          <Link
            href="/workouts"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            View workouts
          </Link>
        </div>
      </section>
    </main>
  );
}