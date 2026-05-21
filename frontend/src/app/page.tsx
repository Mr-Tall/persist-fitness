import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Persist Fitness
        </p>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Track, learn, and progress with an AI-assisted workout companion.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
          Persist Fitness helps lifters log detailed workouts, explore exercise tutorials, and eventually receive smart training suggestions based on goals, equipment, and training history.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-emerald-300"
          >
            Start with Google
          </Link>

          <Link
            href="/exercises"
            className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Explore the app
          </Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Workout logging</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Record sets, reps, weight, effort, notes, and training goals.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Exercise tutorials</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Browse movements by muscle group, equipment, and instructions.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">AI guidance</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Generate practical workout templates and form cues as the app grows.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}