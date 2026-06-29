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
    "bg-emerald-400 text-black hover:bg-emerald-300",

  secondary:
    "border border-white/10 bg-white/5 text-white hover:bg-white/10",

  danger:
    "bg-red-500 text-white hover:bg-red-400",

  ghost:
    "text-neutral-300 hover:bg-white/5",
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
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-bold transition-all duration-200",
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