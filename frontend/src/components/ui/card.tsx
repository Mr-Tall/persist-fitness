import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "glass" | "emerald" | "warning";
};

export function Card({
  children,
  className,
  variant = "glass",
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[2rem] border p-6 shadow-sm backdrop-blur transition-all",
        {
          "border-white/10 bg-white/[0.06]":
            variant === "glass",

          "border-emerald-300/20 bg-emerald-400/[0.08]":
            variant === "emerald",

          "border-amber-300/20 bg-amber-400/[0.08]":
            variant === "warning",
        },
        className
      )}
    >
      {children}
    </div>
  );
}