type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
        {value}
      </h2>
      {helper && <p className="mt-1 text-xs leading-5 text-neutral-500">{helper}</p>}
    </div>
  );
}