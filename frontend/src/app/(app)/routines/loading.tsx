import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

export default function RoutinesLoading() {
  return (
    <RouteLoading label="Loading routines">
      <header data-skeleton="header">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="mt-3 h-9 w-60 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-lg" />
        <SkeletonBlock className="mt-4 h-12 w-full sm:w-44" />
      </header>
      <section className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4" data-skeleton="routine-list">
        {[0, 1, 2].map((routine) => (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 sm:p-5" key={routine}>
            <SkeletonBlock className="h-6 w-48 max-w-full" />
            <SkeletonBlock className="mt-2 h-3 w-28" />
            <div className="mt-3 flex gap-2">
              <SkeletonBlock className="h-7 w-20 rounded-full" />
              <SkeletonBlock className="h-7 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-12 w-full" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-11 w-full" />
              <SkeletonBlock className="h-11 w-full" />
            </div>
          </div>
        ))}
      </section>
    </RouteLoading>
  );
}
