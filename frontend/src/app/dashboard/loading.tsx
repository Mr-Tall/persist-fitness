function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.08] ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-10 w-72 max-w-full" />
            <SkeletonBlock className="h-5 w-96 max-w-full" />
          </div>

          <SkeletonBlock className="h-14 w-full sm:w-64 lg:w-56" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/10 bg-black/20 p-5"
            >
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-4 h-9 w-20" />
              <SkeletonBlock className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <SkeletonBlock className="h-7 w-48" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <SkeletonBlock className="h-5 w-52" />
                <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
                <SkeletonBlock className="mt-4 h-3 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <SkeletonBlock className="h-7 w-40" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock key={item} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}