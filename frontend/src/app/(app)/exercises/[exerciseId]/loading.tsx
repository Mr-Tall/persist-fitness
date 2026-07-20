import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

export default function ExerciseDetailLoading() {
  return (
    <RouteLoading label="Loading exercise" maxWidth="max-w-5xl">
      <SkeletonBlock className="h-11 w-40" />
      <header className="mt-4" data-skeleton="header">
        <SkeletonBlock className="h-3 w-20" />
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-9 w-72 max-w-full" />
            <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
          </div>
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
        </div>
      </header>
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3" data-skeleton="metrics">
        {[0, 1, 2].map((metric) => (
          <div className={metric === 2 ? "col-span-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4 md:col-span-1" : "rounded-2xl border border-white/10 bg-white/[0.05] p-4"} key={metric}>
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="mt-3 h-7 w-24 max-w-full" />
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-5" data-skeleton="progress-chart">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="mt-4 h-40 w-full" />
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_1.4fr]" data-skeleton="details">
        <div className="space-y-4">
          <SkeletonBlock className="h-32 w-full" />
          <SkeletonBlock className="h-40 w-full" />
        </div>
        <SkeletonBlock className="h-64 w-full" />
      </section>
    </RouteLoading>
  );
}
