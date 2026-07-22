import { ReactNode } from "react";
import { Card } from "./card";

type SectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headingId?: string;
};

export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  headingId,
}: SectionProps) {
  return (
    <Card className={className}>
      {(eyebrow || title || description || action) && (
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {eyebrow && (
              <p className="text-xs font-black uppercase tracking-[0.24em] text-text-secondary">
                {eyebrow}
              </p>
            )}

            {title && (
              <h2
                className="mt-2 text-2xl font-black text-white"
                id={headingId}
              >
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm leading-6 text-neutral-400">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </Card>
  );
}
