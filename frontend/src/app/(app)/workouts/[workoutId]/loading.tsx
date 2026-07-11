function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.08] ${className}`}
    />
  );
}

export default function WorkoutDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-10 w-72 max-w-full" />
            <SkeletonBlock className="h-5 w-96 max-w-full" />
          </div>

          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-11 w-32" />
            <SkeletonBlock className="h-11 w-32" />
            <SkeletonBlock className="h-11 w-32" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/10 bg-black/20 p-5"
            >
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-4 h-9 w-20" />
            </div>
          ))}
        </div>

        <SkeletonBlock className="mt-8 h-3 w-full" />
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <SkeletonBlock className="h-6 w-36" />
          <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
          <SkeletonBlock className="mt-5 h-12 w-full" />
          <SkeletonBlock className="mt-4 h-48 w-full" />
          <SkeletonBlock className="mt-4 h-12 w-40" />
        </div>
      </section>

      <section className="mt-6 space-y-5">
        {[0, 1].map((exercise) => (
          <article
            key={exercise}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <SkeletonBlock className="h-7 w-48" />
                <SkeletonBlock className="h-4 w-64 max-w-full" />
              </div>

              <SkeletonBlock className="h-9 w-24" />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[0, 1].map((set) => (
                <div
                  key={set}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4"
                >
                  <SkeletonBlock className="h-5 w-24" />
                  <SkeletonBlock className="mt-4 h-8 w-32" />
                  <SkeletonBlock className="mt-4 h-16 w-full" />
                </div>
              ))}
            </div>

            <SkeletonBlock className="mt-5 h-36 w-full" />
          </article>
        ))}
      </section>
    </main>
  );
}