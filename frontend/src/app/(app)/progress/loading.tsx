function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none ${className}`}
      data-skeleton-block
    />
  );
}

function ProgressHeaderSkeleton() {
  return (
    <div data-skeleton="progress-header">
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="mt-3 h-9 w-52 max-w-full" />
      <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
    </div>
  );
}

function WeeklyMomentumSkeleton() {
  return (
    <section
      className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4"
      data-skeleton="weekly-momentum"
    >
      <SkeletonBlock className="h-3 w-32" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/20 p-3">
          <SkeletonBlock className="h-3 w-24 max-w-full" />
          <SkeletonBlock className="mt-3 h-7 w-12" />
        </div>
        <div className="rounded-xl bg-black/20 p-3">
          <SkeletonBlock className="h-3 w-20 max-w-full" />
          <SkeletonBlock className="mt-3 h-7 w-16" />
        </div>
      </div>
    </section>
  );
}

function LifetimeSummarySkeleton() {
  return (
    <section className="mt-5" data-skeleton="lifetime-summary">
      <SkeletonBlock className="h-4 w-36" />
      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        {[0, 1, 2].map((item) => (
          <div
            className={`bg-slate-950/90 p-4 ${item === 2 ? "col-span-2" : ""}`}
            key={item}
          >
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="mt-3 h-7 w-24 max-w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TopLiftSkeleton() {
  return (
    <section className="mt-5" data-skeleton="top-lift">
      <SkeletonBlock className="h-4 w-24" />
      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
        <SkeletonBlock className="h-3 w-20 bg-amber-200/15" />
        <SkeletonBlock className="mt-3 h-5 w-48 max-w-full bg-amber-200/15" />
        <SkeletonBlock className="mt-3 h-8 w-36 max-w-full bg-amber-200/15" />
        <SkeletonBlock className="mt-3 h-4 w-28 bg-amber-200/15" />
        <SkeletonBlock className="mt-4 h-11 w-40 max-w-full bg-amber-200/15" />
      </div>
    </section>
  );
}

function PersonalRecordsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="mt-6" data-skeleton="personal-records">
      <SkeletonBlock className="h-5 w-40" />
      <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
      <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {Array.from({ length: rows }, (_, item) => (
          <div className="p-4" data-skeleton="personal-record-row" key={item}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-44 max-w-full" />
                <SkeletonBlock className="mt-3 h-6 w-32 max-w-full" />
                <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
              </div>
              <SkeletonBlock className="h-11 w-11 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentTrainingSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <section className="mt-6" data-skeleton="recent-training">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-11 w-24 shrink-0" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }, (_, item) => (
          <div
            className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
            data-skeleton="recent-training-row"
            key={item}
          >
            <SkeletonBlock className="h-4 w-48 max-w-full" />
            <SkeletonBlock className="mt-3 h-3 w-64 max-w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgressSkeleton() {
  return (
    <>
      <ProgressHeaderSkeleton />
      <WeeklyMomentumSkeleton />
      <LifetimeSummarySkeleton />
      <TopLiftSkeleton />
      <PersonalRecordsSkeleton />
      <RecentTrainingSkeleton />
    </>
  );
}

export default function ProgressLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Progress"
      className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:py-10"
      role="status"
    >
      <div aria-hidden="true" className="md:hidden" data-testid="mobile-progress-skeleton">
        <ProgressSkeleton />
      </div>

      <div aria-hidden="true" className="hidden md:block" data-testid="desktop-progress-skeleton">
        <ProgressSkeleton />
      </div>
    </main>
  );
}
