import Link from "next/link";
import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const styles = {
  primary:
    "bg-action text-action-foreground shadow-[0_10px_30px_rgba(0,0,0,0.28)] hover:bg-action-hover",

  secondary:
    "border border-border bg-action-secondary text-text-primary hover:border-border-strong hover:bg-surface-elevated",

  danger:
    "bg-danger text-white hover:brightness-110",

  ghost:
    "text-text-secondary hover:bg-action-secondary hover:text-text-primary",
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  href,
  className,
  ...props
}: ButtonProps) {
  const classes = clsx(
    "inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    styles[variant],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
