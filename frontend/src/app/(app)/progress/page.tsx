import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { requireUserId } from "@/lib/auth/require-user";
import { formatWorkoutDate } from "@/lib/format-date";
import { getProgressData } from "@/lib/progress-data";
import {
  BiggestImprovements,
  MuscleDistribution,
  PerformanceTrends,
  ProgressOverview,
  RecentPrTimeline,
} from "./analytics-dashboard-sections";
import { PersonalRecordList } from "./personal-record-list";

export default async function ProgressPage() {
  const userId = await requireUserId();
  const { analytics, insights, personalRecords } = await getProgressData(userId);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:py-10">
      <header className="px-1">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-text-secondary">
          Progress
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-text-primary sm:mt-2 sm:text-5xl">
          Training analytics
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary sm:mt-2 sm:text-base">
          Understand your consistency, strength, and recent training balance.
        </p>
      </header>

      <ProgressOverview
        currentStreak={analytics.currentStreak}
        personalRecordCount={insights.personalRecordCount}
        totalSets={analytics.totalSets}
        totalVolume={analytics.totalVolume}
        workoutCount={analytics.workoutCount}
      />

      {analytics.workoutCount === 0 ? (
        <section
          aria-labelledby="progress-empty-title"
          className="mt-6 rounded-[1.75rem] border border-info/20 bg-info-soft p-5 text-center sm:p-7"
        >
          <h2 id="progress-empty-title" className="text-lg font-black text-text-primary">
            Complete a few workouts to unlock your analytics
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-info">
            Your trends, strongest lifts, muscle distribution, and improvements
            will appear here as your training history grows.
          </p>
          <Link
            href="/workouts/new"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-action px-5 py-3 font-bold text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Log first workout
          </Link>
        </section>
      ) : (
        <>
          <PerformanceTrends
            monthly={insights.monthlyVolume}
            weekly={insights.weeklyVolume}
          />

          <section aria-labelledby="top-lifts-heading" className="mt-6">
            <Section
              className="rounded-[1.75rem] p-5 sm:p-6"
              description="Your strongest exercises ranked by estimated one-rep max."
              headingId="top-lifts-heading"
              title="Top lifts"
            >
              {personalRecords.length === 0 ? (
                <EmptyState
                  title="No weighted lifts yet"
                  description="Log positive weight and reps to start ranking your strongest lifts."
                  actionLabel="Log a workout"
                  actionHref="/workouts/new"
                />
              ) : (
                <PersonalRecordList records={personalRecords} />
              )}
            </Section>
          </section>

          <RecentPrTimeline records={insights.recentPersonalRecords} />
          <MuscleDistribution items={insights.muscleDistribution} />
          <BiggestImprovements items={insights.biggestImprovements} />

          <Section
            className="mt-6 rounded-[1.75rem] p-5 sm:p-6"
            title="Recent training"
            description="Your latest logged sessions."
            action={
              <Link
                href="/workouts"
                className="inline-flex min-h-11 items-center rounded-xl border border-border bg-action-secondary px-4 text-sm font-bold text-text-primary transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                View full history
              </Link>
            }
          >
            <div className="space-y-3">
              {analytics.recentWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workouts/${workout.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition hover:border-border-strong hover:bg-surface-elevated active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-text-primary">
                      {workout.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {formatWorkoutDate(workout.date)} &middot;{" "}
                      {workout.goal || "No goal set"}
                    </p>
                  </div>
                  <span aria-hidden="true" className="text-xl text-text-muted">
                    &rsaquo;
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}
    </main>
  );
}
