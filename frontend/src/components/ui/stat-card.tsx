type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur sm:p-5">
      <p className="text-sm font-medium text-neutral-400">{label}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
        {value}
      </h2>
      {helper && (
        <p className="mt-1 text-xs leading-5 text-neutral-500">{helper}</p>
      )}
    </div>
  );
}