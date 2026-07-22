import Link from "next/link";

import { formatWorkoutDate } from "@/lib/format-date";
import type {
  ExerciseImprovement,
  MuscleDistributionItem,
  ProgressTrend,
  RecentPersonalRecord,
} from "@/lib/workout-history-summary";

function formatVolume(volume: number) {
  return `${Math.round(volume).toLocaleString()} lb`;
}

function InsightEmpty({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-info/20 bg-info-soft px-4 py-3 text-sm leading-6 text-info">
      {children}
    </p>
  );
}

export function ProgressOverview({
  currentStreak,
  personalRecordCount,
  totalSets,
  totalVolume,
  workoutCount,
}: {
  currentStreak: number;
  personalRecordCount: number;
  totalSets: number;
  totalVolume: number;
  workoutCount: number;
}) {
  const metrics = [
    { label: "Total workouts", value: workoutCount.toLocaleString() },
    { label: "Current streak", value: `${currentStreak} days` },
    {
      helper: `${totalSets.toLocaleString()} sets logged`,
      label: "Total volume",
      value: formatVolume(totalVolume),
    },
    { label: "Personal records", value: personalRecordCount.toLocaleString() },
  ];

  return (
    <section aria-labelledby="progress-overview" className="mt-5 sm:mt-8">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 id="progress-overview" className="text-base font-black text-text-primary sm:text-lg">
          Overview
        </h2>
        <span className="text-xs font-bold text-text-muted">All time</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 sm:p-4"
            key={metric.label}
          >
            <p className="break-words text-xl font-black tracking-tight text-text-primary [overflow-wrap:anywhere] sm:text-2xl">
              {metric.value}
            </p>
            <p className="mt-1 text-xs font-bold text-text-secondary">
              {metric.label}
            </p>
            {metric.helper && (
              <p className="mt-1 text-[11px] text-text-muted">{metric.helper}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendCard({ label, trend }: { label: string; trend: ProgressTrend }) {
  const status =
    trend.direction === "positive"
      ? trend.changePercent === null
        ? "New activity"
        : `Up ${Math.abs(trend.changePercent).toFixed(0)}%`
      : trend.direction === "negative"
        ? `Down ${Math.abs(trend.changePercent ?? 0).toFixed(0)}%`
        : "No change";
  const statusClassName =
    trend.direction === "positive"
      ? "text-success"
      : trend.direction === "negative"
        ? "text-warning"
        : "text-text-secondary";

  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black text-text-primary [overflow-wrap:anywhere]">
        {formatVolume(trend.currentVolume)}
      </p>
      <p className={`mt-1 text-xs font-black ${statusClassName}`}>{status}</p>
      <p className="mt-1 text-xs text-text-muted">
        Previous period: {formatVolume(trend.previousVolume)}
      </p>
    </article>
  );
}

export function PerformanceTrends({
  monthly,
  weekly,
}: {
  monthly: ProgressTrend;
  weekly: ProgressTrend;
}) {
  return (
    <section aria-labelledby="performance-trends" className="mt-6">
      <div className="mb-2 px-1">
        <h2 id="performance-trends" className="text-base font-black text-text-primary sm:text-lg">
          Performance trends
        </h2>
        <p className="mt-1 text-xs leading-5 text-text-muted">
          Rolling volume compared with the preceding period.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <TrendCard label="Weekly volume · 7 days" trend={weekly} />
        <TrendCard label="Monthly volume · 30 days" trend={monthly} />
      </div>
    </section>
  );
}

export function RecentPrTimeline({ records }: { records: RecentPersonalRecord[] }) {
  return (
    <section aria-labelledby="recent-personal-records" className="mt-6">
      <h2 id="recent-personal-records" className="mb-2 px-1 text-base font-black text-text-primary sm:text-lg">
        Recent personal records
      </h2>
      {records.length === 0 ? (
        <InsightEmpty>Complete a few weighted workouts to unlock your record timeline.</InsightEmpty>
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-border bg-surface">
          {records.map((record, index) => (
            <li
              className="relative border-b border-border p-4 pl-9 last:border-b-0"
              key={`${record.workoutId}-${record.exerciseName}-${record.workoutDate.toISOString()}-${index}`}
            >
              <span
                aria-hidden="true"
                className="absolute left-4 top-5 h-2.5 w-2.5 rounded-full bg-success"
              />
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <h3 className="break-words font-black text-text-primary [overflow-wrap:anywhere]">
                    {record.exerciseName}
                  </h3>
                  <p className="text-xs font-bold text-success">{record.prType}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {record.weight.toLocaleString()} lb &times; {record.reps.toLocaleString()} reps · Estimated {Math.round(record.estimatedOneRepMax).toLocaleString()} lb
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-11 shrink-0 items-center rounded-xl text-xs font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  href={`/workouts/${record.workoutId}`}
                >
                  {formatWorkoutDate(record.workoutDate)}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function MuscleDistribution({ items }: { items: MuscleDistributionItem[] }) {
  return (
    <section aria-labelledby="muscle-distribution" className="mt-6">
      <div className="mb-2 px-1">
        <h2 id="muscle-distribution" className="text-base font-black text-text-primary sm:text-lg">
          Muscle distribution
        </h2>
        <p className="mt-1 text-xs text-text-muted">Classified training volume from the last 30 days.</p>
      </div>
      {items.length === 0 ? (
        <InsightEmpty>Log weighted sets with library exercises to reveal your muscle distribution.</InsightEmpty>
      ) : (
        <ul className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          {items.map((item) => (
            <li key={item.muscle}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 break-words font-bold capitalize text-text-secondary">
                  {item.muscle}
                </span>
                <span className="shrink-0 font-black text-text-primary">
                  {Math.round(item.percentage)}%
                </span>
              </div>
              <div
                aria-label={`${item.muscle}: ${Math.round(item.percentage)}%`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(item.percentage)}
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-action-secondary"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-text-secondary"
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BiggestImprovements({ items }: { items: ExerciseImprovement[] }) {
  return (
    <section aria-labelledby="biggest-improvements" className="mt-6">
      <h2 id="biggest-improvements" className="mb-2 px-1 text-base font-black text-text-primary sm:text-lg">
        Biggest improvements
      </h2>
      {items.length === 0 ? (
        <InsightEmpty>More training history is needed before recent improvements can be compared.</InsightEmpty>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.exerciseName}>
              <Link
                className="block min-h-24 rounded-2xl border border-success/25 bg-success-soft p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                href={`/workouts/${item.workoutId}`}
              >
                <h3 className="break-words font-black text-text-primary [overflow-wrap:anywhere]">
                  {item.exerciseName}
                </h3>
                <p className="mt-2 text-xl font-black text-success">
                  +{item.changePercent.toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Estimated 1RM now {Math.round(item.currentEstimatedOneRepMax).toLocaleString()} lb
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
