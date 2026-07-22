import { ReactNode } from "react";
import { Button } from "./button";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  actionHref,
  children,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/70 p-8 text-center">
      <h3 className="font-black text-white">{title}</h3>

      {description && (
        <p className="mt-2 text-sm leading-6 text-neutral-400">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}

      {!action && actionLabel && actionHref && (
        <div className="mt-5">
          <Button href={actionHref}>{actionLabel}</Button>
        </div>
      )}

      {children}
    </div>
  );
}
