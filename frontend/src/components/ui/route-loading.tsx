import type { ReactNode } from "react";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-white/[0.08] motion-reduce:animate-none ${className}`}
      data-skeleton-block
    />
  );
}

export function RouteLoading({
  children,
  label,
  maxWidth = "max-w-5xl",
}: {
  children: ReactNode;
  label: string;
  maxWidth?: string;
}) {
  return (
    <main
      aria-busy="true"
      aria-label={label}
      className={`mx-auto ${maxWidth} px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:py-10`}
      role="status"
    >
      <div aria-hidden="true">{children}</div>
    </main>
  );
}
