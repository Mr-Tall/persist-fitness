import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

function WorkoutHeaderSkeleton() {
  return (
    <section
      className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-3 sm:p-5 lg:p-7"
      data-skeleton="workout-header"
    >
      <SkeletonBlock className="h-11 w-36 max-w-full rounded-xl" />
      <div className="mt-2 min-w-0">
        <SkeletonBlock className="h-8 w-72 max-w-[90%]" />
        <div className="mt-2 flex min-w-0 flex-wrap gap-2">
          <SkeletonBlock className="h-7 w-28 rounded-full" />
          <SkeletonBlock className="h-7 w-32 rounded-full" />
        </div>
        <SkeletonBlock className="mt-2 h-3 w-56 max-w-full" />
      </div>

      <dl
        className="mt-3 grid min-w-0 grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/25"
        data-skeleton="workout-momentum"
      >
        {[0, 1, 2].map((metric) => (
          <div className="min-w-0 px-2 py-2.5 text-center sm:px-4" data-skeleton="momentum-metric" key={metric}>
            <SkeletonBlock className="mx-auto h-3 w-16 max-w-full" />
            <SkeletonBlock className="mx-auto mt-2 h-6 w-14 max-w-full" />
          </div>
        ))}
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex" data-skeleton="workout-actions">
        <SkeletonBlock className="col-span-2 h-12 w-full sm:col-span-1 sm:w-36" />
        <SkeletonBlock className="h-11 w-full sm:w-36" />
        <SkeletonBlock className="h-11 w-full sm:w-28" />
      </div>
    </section>
  );
}

function AddSetComposerSkeleton() {
  return (
    <section
      className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-3 sm:p-4"
      data-skeleton="add-set-composer"
    >
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-16 w-full" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-10 w-full self-end" />
      </div>
      <SkeletonBlock className="mt-3 h-12 w-full" />
      <SkeletonBlock className="mt-3 h-12 w-full sm:ml-auto sm:w-40" />
    </section>
  );
}

function SavedSetRowSkeleton() {
  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3"
      data-skeleton="saved-set-row"
    >
      <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <SkeletonBlock className="h-3 w-14" />
        <SkeletonBlock className="mt-2 h-6 w-32 max-w-full" />
      </div>
      <SkeletonBlock className="h-11 w-20 shrink-0 rounded-xl" />
    </div>
  );
}

function ExerciseAccordionSkeleton() {
  return (
    <div className="mt-5 min-w-0 space-y-3" data-skeleton="exercise-accordion">
      <article className="min-w-0 overflow-hidden rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.05]">
        <div className="flex min-h-14 min-w-0 items-center gap-3 px-4 py-2" data-skeleton="current-exercise-summary">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-5 w-52 max-w-[85%]" />
            <SkeletonBlock className="mt-2 h-3 w-36 max-w-full" />
          </div>
          <SkeletonBlock className="h-6 w-16 shrink-0 rounded-full" />
        </div>

        <div className="border-t border-emerald-300/15">
          <div className="bg-white/[0.025] p-4 sm:p-5" data-skeleton="previous-performance">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="mt-2 h-6 w-32 max-w-full" />
                </div>
                <SkeletonBlock className="h-3 w-20 shrink-0" />
              </div>
              <SkeletonBlock className="mt-3 h-11 w-full" />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <AddSetComposerSkeleton />

            <div className="mt-5 space-y-3" data-skeleton="saved-set-history">
              <SavedSetRowSkeleton />
              <SavedSetRowSkeleton />
              <SavedSetRowSkeleton />
            </div>
          </div>
        </div>
      </article>

      <article className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-2" data-skeleton="collapsed-exercise-summary">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-5 w-44 max-w-[80%]" />
          <SkeletonBlock className="mt-2 h-3 w-28" />
        </div>
        <SkeletonBlock className="h-6 w-6 shrink-0 rounded-full" />
      </article>
    </div>
  );
}

export default function WorkoutDetailLoading() {
  return (
    <RouteLoading label="Loading workout details">
      <WorkoutHeaderSkeleton />

      <section className="mt-6 min-w-0" data-skeleton="exercise-section">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-2 h-7 w-32" />
        <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
        <SkeletonBlock className="mt-4 h-12 w-full sm:w-44" />
        <ExerciseAccordionSkeleton />
      </section>

      <div
        aria-hidden="true"
        className="h-[calc(var(--mobile-nav-height)_+_6rem_+_env(safe-area-inset-bottom))] md:hidden"
        data-skeleton="workout-dock-clearance"
      />
    </RouteLoading>
  );
}
