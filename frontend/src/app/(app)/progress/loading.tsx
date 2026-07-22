function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none ${className}`}
      data-skeleton-block
    />
  );
}

function HeaderSkeleton() {
  return (
    <div data-skeleton="progress-header">
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="mt-3 h-9 w-56 max-w-full" />
      <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <section className="mt-5" data-skeleton="overview">
      <SkeletonBlock className="h-4 w-24" />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, item) => (
          <div className="rounded-2xl border border-border bg-surface p-4" key={item}>
            <SkeletonBlock className="h-7 w-20 max-w-full" />
            <SkeletonBlock className="mt-2 h-3 w-24 max-w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendsSkeleton() {
  return (
    <section className="mt-6" data-skeleton="performance-trends">
      <SkeletonBlock className="h-4 w-40" />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div className="rounded-2xl border border-border bg-surface p-4" key={item}>
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="mt-3 h-7 w-32 max-w-full" />
            <SkeletonBlock className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RowSectionSkeleton({
  name,
  rows = 3,
}: {
  name: string;
  rows?: number;
}) {
  return (
    <section className="mt-6" data-skeleton={name}>
      <SkeletonBlock className="h-5 w-44 max-w-full" />
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
        {Array.from({ length: rows }, (_, item) => (
          <div className="border-b border-border p-4 last:border-b-0" key={item}>
            <SkeletonBlock className="h-4 w-48 max-w-full" />
            <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgressSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <OverviewSkeleton />
      <TrendsSkeleton />
      <RowSectionSkeleton name="top-lifts" />
      <RowSectionSkeleton name="recent-personal-records" />
      <RowSectionSkeleton name="muscle-distribution" rows={4} />
      <RowSectionSkeleton name="biggest-improvements" />
      <RowSectionSkeleton name="recent-training" rows={2} />
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
