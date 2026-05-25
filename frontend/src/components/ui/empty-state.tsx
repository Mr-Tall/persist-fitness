type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/60 p-8 text-center sm:p-10">
      <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}