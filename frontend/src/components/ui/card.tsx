import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** `emerald` is a temporary backwards-compatible alias for `elevated`. */
  variant?: "glass" | "elevated" | "success" | "warning" | "emerald";
};

export function Card({
  children,
  className,
  variant = "glass",
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[2rem] border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur transition-colors",
        {
          "border-border bg-surface":
            variant === "glass",

          "border-border-strong bg-surface-elevated":
            variant === "elevated" || variant === "emerald",

          "border-success/25 bg-success-soft":
            variant === "success",

          "border-warning/25 bg-warning-soft":
            variant === "warning",
        },
        className
      )}
    >
      {children}
    </div>
  );
}
