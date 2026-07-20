import { RouteLoading, SkeletonBlock } from "@/components/ui/route-loading";

export default function SettingsLoading() {
  return (
    <RouteLoading label="Loading profile" maxWidth="max-w-3xl">
      <header data-skeleton="header">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="mt-3 h-9 w-56 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </header>
      <section className="mt-5 space-y-7 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 sm:mt-8 sm:p-7" data-skeleton="profile-form">
        {[0, 1, 2].map((group) => (
          <div data-skeleton="profile-group" key={group}>
            <SkeletonBlock className="h-3 w-40" />
            <div className="mt-5 space-y-4">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              {group === 0 && <SkeletonBlock className="h-12 w-full" />}
            </div>
          </div>
        ))}
        <SkeletonBlock className="h-12 w-full sm:w-36" />
      </section>
      <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5" data-skeleton="account">
        <SkeletonBlock className="h-6 w-24" />
        <SkeletonBlock className="mt-2 h-4 w-64 max-w-full" />
        <SkeletonBlock className="mt-4 h-12 w-full sm:w-32" />
      </section>
    </RouteLoading>
  );
}
