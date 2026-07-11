import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricBadge } from "@/components/ui/metric-badge";
import { Section } from "@/components/ui/section";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { requireUserId } from "@/lib/auth/require-user";
import { formatWorkoutDate } from "@/lib/format-date";
import { getTopExercisePersonalRecords } from "@/lib/personal-records";

function formatVolume(volume: number) {
  return `${Math.round(volume).toLocaleString()} lb`;
}

export default async function ProgressPage() {
  const userId = await requireUserId();

  const [analytics, personalRecords] = await Promise.all([
    getDashboardAnalytics(userId),
    getTopExercisePersonalRecords(userId, 5),
  ]);

  const topRecord = personalRecords[0];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6 sm:py-10">
      <header className="px-1">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Progress
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Your training
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
          See how your consistency and strength are building over time.
        </p>
      </header>

      <Card
        variant="emerald"
        className="relative mt-5 overflow-hidden rounded-[1.75rem] p-5 sm:mt-8 sm:p-6"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.2),transparent_48%)]" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Weekly momentum
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Keep the rhythm going
            </h2>
          </div>
          <MetricBadge variant="emerald">This week</MetricBadge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-3xl font-black tracking-tight text-white">
              {analytics.workoutsThisWeek}
            </p>
            <p className="mt-1 text-xs font-bold text-neutral-400">
              Workouts this week
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-3xl font-black tracking-tight text-white">
              {analytics.currentStreak}
            </p>
            <p className="mt-1 text-xs font-bold text-neutral-400">
              Day streak
            </p>
          </div>
        </div>
      </Card>

      <section aria-labelledby="lifetime-summary" className="mt-6">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 id="lifetime-summary" className="text-lg font-black text-white">
            Lifetime summary
          </h2>
          <span className="text-xs font-bold text-neutral-500">All time</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="rounded-2xl p-4 sm:p-5">
            <p className="text-2xl font-black text-white">
              {analytics.workoutCount}
            </p>
            <p className="mt-1 text-xs font-bold text-neutral-400">
              Total workouts
            </p>
          </Card>
          <Card className="rounded-2xl p-4 sm:p-5">
            <p className="text-2xl font-black text-white">
              {analytics.totalSets.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-bold text-neutral-400">
              Total sets
            </p>
          </Card>
          <Card className="col-span-2 rounded-2xl p-4 sm:col-span-1 sm:p-5">
            <p className="text-2xl font-black text-white">
              {formatVolume(analytics.totalVolume)}
            </p>
            <p className="mt-1 text-xs font-bold text-neutral-400">
              Total volume
            </p>
          </Card>
        </div>
      </section>

      {topRecord && (
        <section aria-labelledby="top-lift" className="mt-6">
          <h2 id="top-lift" className="mb-3 px-1 text-lg font-black text-white">
            Top lift
          </h2>
          <Link
            href={`/workouts/${topRecord.workoutId}`}
            className="block rounded-[1.75rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_46%),rgba(251,191,36,0.07)] p-5 shadow-sm transition hover:border-amber-300/40 active:scale-[0.99] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <MetricBadge variant="amber">Strongest estimate</MetricBadge>
                <p className="mt-3 truncate text-2xl font-black text-white">
                  {topRecord.exerciseName}
                </p>
                <p className="mt-1 text-sm font-bold text-neutral-300">
                  {topRecord.weight.toLocaleString()} lb &times; {topRecord.reps}{" "}
                  reps
                </p>
              </div>

              <span aria-hidden="true" className="text-2xl text-amber-200/70">
                &rsaquo;
              </span>
            </div>

            <div className="mt-5 inline-flex rounded-full bg-amber-300/15 px-3 py-1.5 text-sm font-black text-amber-200">
              Estimated 1RM {Math.round(topRecord.estimatedOneRepMax)} lb
            </div>
          </Link>
        </section>
      )}

      <Section
        className="mt-6 rounded-[1.75rem] p-5 sm:p-6"
        title="Personal records"
        description="Your strongest logged sets, ranked by estimated one-rep max."
      >
        {personalRecords.length === 0 ? (
          <EmptyState
            title="No personal records yet"
            description="Log sets with weight and reps to start building your strength profile."
            actionLabel="Log a workout"
            actionHref="/workouts/new"
          />
        ) : (
          <div className="space-y-3">
            {personalRecords.map((record) => (
              <Link
                key={`${record.exerciseName}-${record.workoutId}`}
                href={`/workouts/${record.workoutId}`}
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-amber-300/30 hover:bg-white/[0.06] active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-white">
                    {record.exerciseName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {record.weight.toLocaleString()} lb &times; {record.reps}{" "}
                    reps &middot; {formatWorkoutDate(record.workoutDate)}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-amber-300/15 px-3 py-1 text-xs font-black text-amber-200">
                  {Math.round(record.estimatedOneRepMax)} lb
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section
        className="mt-6 rounded-[1.75rem] p-5 sm:p-6"
        title="Recent training"
        description="Your latest logged sessions."
        action={
          <Link
            href="/workouts"
            className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            View full history
          </Link>
        }
      >
        {analytics.recentWorkouts.length === 0 ? (
          <EmptyState
            title="No workouts yet"
            description="Log your first session to start building a training history."
            actionLabel="Log first workout"
            actionHref="/workouts/new"
          />
        ) : (
          <div className="space-y-3">
            {analytics.recentWorkouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-emerald-300/30 hover:bg-white/[0.06] active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-white">
                    {workout.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {formatWorkoutDate(workout.date)} &middot;{" "}
                    {workout.goal || "No goal set"}
                  </p>
                </div>
                <span aria-hidden="true" className="text-xl text-neutral-500">
                  &rsaquo;
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}
