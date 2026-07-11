import { Card } from "@/components/ui/card";
import { MetricBadge } from "@/components/ui/metric-badge";

type CompletionSummaryProps = {
  duration: string;
  totalSets: number;
  totalVolume: string;
  exerciseCount: number;
  personalRecordCount: number;
};

export function CompletionSummary({
  duration,
  totalSets,
  totalVolume,
  exerciseCount,
  personalRecordCount,
}: CompletionSummaryProps) {
  return (
    <Card variant="emerald" className="mt-6 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            Workout complete
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            Great session.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">
            Your workout has been saved with session totals, volume, and PR
            context.
          </p>
        </div>

        <MetricBadge variant="emerald">Completed</MetricBadge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Duration
          </p>
          <p className="mt-1 text-xl font-black text-white">{duration}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Sets
          </p>
          <p className="mt-1 text-xl font-black text-white">{totalSets}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Volume
          </p>
          <p className="mt-1 text-xl font-black text-white">{totalVolume}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Exercises
          </p>
          <p className="mt-1 text-xl font-black text-white">{exerciseCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            PRs
          </p>
          <p className="mt-1 text-xl font-black text-white">
            {personalRecordCount}
          </p>
        </div>
      </div>
    </Card>
  );
}