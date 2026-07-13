function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-skeleton-block
      className={`animate-pulse rounded-2xl bg-white/[0.08] motion-reduce:animate-none ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Today"
      role="status"
      className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-10"
    >
      <div
        aria-hidden="true"
        data-testid="mobile-today-skeleton"
        className="md:hidden"
      >
        <header
          data-skeleton="today-header"
          className="flex min-w-0 flex-col gap-3 px-1 pb-4 pt-1"
        >
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <SkeletonBlock className="h-9 w-52 max-w-[75%]" />
          </div>
          <SkeletonBlock className="h-6 w-28 rounded-full" />
        </header>

        <section
          data-skeleton="primary-card"
          className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5"
        >
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-3 h-7 w-64 max-w-[85%]" />
          <div className="mt-3 space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
          <SkeletonBlock className="mt-5 h-12 w-full" />
        </section>

        <section data-skeleton="weekly-momentum" className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-4 px-1">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
              >
                <SkeletonBlock className="h-7 w-10" />
                <SkeletonBlock className="mt-2 h-3 w-24 max-w-full" />
              </div>
            ))}
          </div>
        </section>

        <section data-skeleton="latest-workout" className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-4 px-1">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
          <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-44 max-w-[80%]" />
              <SkeletonBlock className="h-3 w-56 max-w-full" />
            </div>
            <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
          </div>
        </section>
      </div>

      <div
        aria-hidden="true"
        data-testid="desktop-dashboard-skeleton"
        className="hidden md:block"
      >
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
                data-skeleton="desktop-stat"
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
          {[0, 1].map((item) => (
            <div
              key={item}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
            >
              <SkeletonBlock className="h-7 w-48 max-w-full" />
              <div className="mt-5 space-y-3">
                {[0, 1, 2].map((row) => (
                  <SkeletonBlock key={row} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
