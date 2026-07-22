import clsx from "clsx";
import { ReactNode } from "react";

type MetricBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  // Temporary backwards-compatible aliases. Prefer semantic names above.
  | "emerald"
  | "amber"
  | "red";

type MetricBadgeProps = {
  children: ReactNode;
  variant?: MetricBadgeVariant;
  className?: string;
};

const styles = {
  default: "border-border bg-action-secondary text-text-secondary",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
  info: "border-info/30 bg-info-soft text-info",
  emerald: "border-success/30 bg-success-soft text-success",
  amber: "border-warning/30 bg-warning-soft text-warning",
  red: "border-danger/30 bg-danger-soft text-danger",
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
