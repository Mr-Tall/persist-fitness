import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricBadge } from "@/components/ui/metric-badge";
import { Section } from "@/components/ui/section";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { requireUserId } from "@/lib/auth/require-user";
import { formatWorkoutDate } from "@/lib/format-date";
import { getTopExercisePersonalRecords } from "@/lib/personal-records";
import { PersonalRecordList } from "./personal-record-list";

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
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:py-10">
      <header className="px-1">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Progress
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:mt-2 sm:text-5xl">
          Your training
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400 sm:mt-2 sm:text-base">
          See how your consistency and strength are building over time.
        </p>
      </header>

      <section
        aria-labelledby="weekly-momentum"
        className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.07] p-4 sm:mt-8 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 id="weekly-momentum" className="text-sm font-black text-white">
            Weekly momentum
          </h2>
          <span className="text-xs font-bold text-emerald-200">This week</span>
        </div>

        <div className="mt-3 grid grid-cols-[1.1fr_0.9fr] gap-3">
          <div className="min-w-0 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.08] px-4 py-3">
            <p className="text-3xl font-black tracking-tight text-white">
              {analytics.workoutsThisWeek}
            </p>
            <p className="mt-0.5 text-xs font-bold leading-4 text-neutral-300">
              Workouts this week
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-2xl font-black tracking-tight text-white">
              {analytics.currentStreak}
            </p>
            <p className="mt-0.5 text-xs font-bold leading-4 text-neutral-400">
              Training streak
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="lifetime-summary" className="mt-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 id="lifetime-summary" className="text-base font-black text-white sm:text-lg">
            Lifetime summary
          </h2>
          <span className="text-xs font-bold text-neutral-500">All time</span>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          <div className="min-w-0 bg-[#0d0d0d] p-3.5 sm:p-5">
            <p className="break-words text-xl font-black text-white [overflow-wrap:anywhere] sm:text-2xl">
              {analytics.workoutCount}
            </p>
            <p className="mt-0.5 text-xs font-bold text-neutral-400">
              Total workouts
            </p>
          </div>
          <div className="min-w-0 bg-[#0d0d0d] p-3.5 sm:p-5">
            <p className="break-words text-xl font-black text-white [overflow-wrap:anywhere] sm:text-2xl">
              {analytics.totalSets.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs font-bold text-neutral-400">
              Total sets
            </p>
          </div>
          <div className="col-span-2 min-w-0 bg-[#0d0d0d] p-3.5 sm:col-span-1 sm:p-5">
            <p className="break-words text-xl font-black text-white [overflow-wrap:anywhere] sm:text-2xl">
              {formatVolume(analytics.totalVolume)}
            </p>
            <p className="mt-0.5 text-xs font-bold text-neutral-400">
              Total volume
            </p>
          </div>
        </div>
      </section>

      {analytics.workoutCount === 0 ? (
        <section
          aria-labelledby="progress-empty-title"
          className="mt-5 rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.04] p-5 text-center sm:p-7"
        >
          <h2 id="progress-empty-title" className="text-lg font-black text-white">
            No training history yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
            Log your first workout to start building momentum, lifetime totals,
            and personal records.
          </p>
          <Link
            href="/workouts/new"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Log first workout
          </Link>
        </section>
      ) : (
        <>
          {topRecord && (
            <section aria-labelledby="top-lift" className="mt-5">
              <h2
                id="top-lift"
                className="mb-2 px-1 text-base font-black text-white sm:text-lg"
              >
                Top lift
              </h2>
              <Link
                href={`/workouts/${topRecord.workoutId}`}
                className="block min-h-11 rounded-[1.75rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_46%),rgba(251,191,36,0.07)] p-4 shadow-sm transition hover:border-amber-300/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <MetricBadge variant="amber">
                      Strongest estimate
                    </MetricBadge>
                    <h3 className="mt-2 line-clamp-2 break-words text-xl font-black leading-tight text-white [overflow-wrap:anywhere] sm:text-2xl">
                      {topRecord.exerciseName}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-neutral-300">
                      {topRecord.weight.toLocaleString()} lb &times;{" "}
                      {topRecord.reps} reps
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-2xl text-amber-200/70"
                  >
                    &rsaquo;
                  </span>
                </div>

                <div className="mt-3 inline-flex max-w-full break-words rounded-full bg-amber-300/15 px-3 py-1.5 text-sm font-black text-amber-200 [overflow-wrap:anywhere]">
                  Estimated 1RM{" "}
                  {Math.round(topRecord.estimatedOneRepMax).toLocaleString()} lb
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
                description="Log weight and reps to start building your record history."
                actionLabel="Log a workout"
                actionHref="/workouts/new"
              />
            ) : (
              <PersonalRecordList records={personalRecords} />
            )}
          </Section>

          <Section
            className="mt-6 rounded-[1.75rem] p-5 sm:p-6"
            title="Recent training"
            description="Your latest logged sessions."
            action={
              <Link
                href="/workouts"
                className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
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
                    className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-emerald-300/30 hover:bg-white/[0.06] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
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
                    <span
                      aria-hidden="true"
                      className="text-xl text-neutral-500"
                    >
                      &rsaquo;
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </main>
  );
}
