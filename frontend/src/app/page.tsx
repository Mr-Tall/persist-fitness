import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-129px)] max-w-6xl flex-col justify-center px-5 py-12 sm:min-h-[calc(100vh-73px)] sm:px-6 sm:py-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400 sm:text-sm">
          Persist Fitness
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Track your training. Build consistency.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg sm:leading-8">
          Log workouts, track sets, and review your progress from a clean mobile-first training dashboard.
        </p>

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/login"
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-center font-semibold text-neutral-950 transition hover:bg-emerald-300"
          >
            Start with Google
          </Link>

          <Link
            href="/exercises"
            className="rounded-2xl border border-white/20 px-5 py-3 text-center font-semibold text-white transition hover:bg-white/10"
          >
            Explore the app
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:mt-16 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Fast workout logging</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Add exercises and log sets with reps, weight, RIR, tempo, and notes.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Built for the gym</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Mobile-first screens and simple flows for quick use between sets.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Smarter over time</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Your profile and workout history create the base for future AI guidance.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}