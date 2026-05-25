type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <section className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}