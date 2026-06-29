import clsx from "clsx";
import { ReactNode } from "react";

type MetricBadgeVariant = "default" | "emerald" | "amber" | "red";

type MetricBadgeProps = {
  children: ReactNode;
  variant?: MetricBadgeVariant;
  className?: string;
};

const styles = {
  default: "border-white/10 bg-white/[0.06] text-neutral-300",
  emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  red: "border-red-300/30 bg-red-400/10 text-red-200",
};

export function MetricBadge({
  children,
  variant = "default",
  className,
}: MetricBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}