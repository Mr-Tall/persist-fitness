import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

export default function NewWorkoutLoading() {
  return (
    <RouteLoading label="Loading new workout" maxWidth="max-w-3xl">
      <header data-skeleton="header">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-3 h-9 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </header>
      <section
        className="mt-6 space-y-5 rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-6"
        data-skeleton="workout-form"
      >
        {["title", "goal", "date", "notes"].map((field, index) => (
          <div data-skeleton={`field-${field}`} key={field}>
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className={index === 3 ? "mt-2 h-24 w-full" : "mt-2 h-12 w-full"} />
          </div>
        ))}
        <SkeletonBlock className="h-12 w-full sm:w-72" />
      </section>
    </RouteLoading>
  );
}
