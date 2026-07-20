import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

export default function ExercisesLoading() {
  return (
    <RouteLoading label="Loading exercise library" maxWidth="max-w-6xl">
      <header data-skeleton="header">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="mt-3 h-9 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
      </header>
      <section className="mt-6 grid gap-4 md:grid-cols-2" data-skeleton="exercise-list">
        {[0, 1, 2, 3].map((exercise) => (
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5" key={exercise}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-6 w-48 max-w-full" />
                <SkeletonBlock className="mt-2 h-4 w-36 max-w-full" />
              </div>
              <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
            </div>
            <div className="mt-4 flex gap-2">
              <SkeletonBlock className="h-7 w-20 rounded-full" />
              <SkeletonBlock className="h-7 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-12 w-full" />
          </div>
        ))}
      </section>
    </RouteLoading>
  );
}
