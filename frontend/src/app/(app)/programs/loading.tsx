import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

export default function ProgramsLoading() {
  return (
    <RouteLoading label="Loading training programs" maxWidth="max-w-5xl">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="mt-3 h-9 w-64 max-w-full" />
      <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      <SkeletonBlock className="mt-6 h-32 w-full rounded-2xl" />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock className="h-64 w-full rounded-2xl" key={item} />
        ))}
      </div>
    </RouteLoading>
  );
}
