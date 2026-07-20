import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

function WorkoutRowSkeleton({ showNotes = false }: { showNotes?: boolean }) {
  return (
    <article
      className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-5"
      data-skeleton="workout-row"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-5 w-52 max-w-[85%]" />
          <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
        </div>
        <SkeletonBlock className="h-9 w-40 max-w-full shrink-0 rounded-xl" />
      </div>
      {showNotes && <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />}
    </article>
  );
}

export default function WorkoutsLoading() {
  return (
    <RouteLoading label="Loading workouts" maxWidth="max-w-6xl">
      <header
        className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between"
        data-skeleton="workout-history-header"
      >
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="mt-3 h-9 w-52 max-w-[80%]" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
        </div>
        <SkeletonBlock className="h-12 w-full shrink-0 sm:w-40" />
      </header>

      <section
        className="grid min-w-0 gap-3 sm:gap-4"
        data-skeleton="workout-history-list"
      >
        <WorkoutRowSkeleton showNotes />
        <WorkoutRowSkeleton />
        <WorkoutRowSkeleton showNotes />
        <WorkoutRowSkeleton />
      </section>
    </RouteLoading>
  );
}
