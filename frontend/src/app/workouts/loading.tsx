function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.08] ${className}`}
    />
  );
}

export default function WorkoutsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-10 w-64 max-w-full" />
            <SkeletonBlock className="h-5 w-96 max-w-full" />
          </div>

          <SkeletonBlock className="h-12 w-full sm:w-44" />
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {[0, 1, 2, 3].map((item) => (
          <article
            key={item}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <SkeletonBlock className="h-6 w-56" />
                <SkeletonBlock className="h-4 w-80 max-w-full" />
                <SkeletonBlock className="h-4 w-48" />
              </div>

              <div className="flex gap-3">
                <SkeletonBlock className="h-10 w-24" />
                <SkeletonBlock className="h-10 w-24" />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}