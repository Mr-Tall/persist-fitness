import clsx from "clsx";

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  helper?: string;
  className?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  helper,
  className,
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div className={clsx("rounded-2xl border border-white/10 bg-black/25 p-4", className)}>
      {(label || helper) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            {label && (
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                {label}
              </p>
            )}
            {helper && (
              <p className="mt-1 text-sm font-bold text-neutral-300">
                {helper}
              </p>
            )}
          </div>

          <p className="text-2xl font-black text-white">{percentage}%</p>
        </div>
      )}

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}