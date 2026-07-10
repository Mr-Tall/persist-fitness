import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricBadge } from "@/components/ui/metric-badge";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { formatWorkoutDate } from "@/lib/format-date";
import { getTopExercisePersonalRecords } from "@/lib/personal-records";
import Link from "next/link";
import { StartWorkoutButton } from "./start-workout-button";
import { requireUserSession } from "@/lib/auth/require-user";

function formatVolume(volume: number) {
  return `${Math.round(volume).toLocaleString()} lb`;
}

function getFirstName(name?: string | null) {
  return name?.split(" ")[0] ?? "athlete";
}

function getTrainingStatus(workoutsThisWeek: number) {
  if (workoutsThisWeek >= 4) {
    return {
      label: "High output week",
      message:
        "You are stacking sessions consistently. Keep recovery in mind as volume climbs.",
    };
  }

  if (workoutsThisWeek >= 2) {
    return {
      label: "Good momentum",
      message:
        "You are building the week well. One or two more quality sessions would keep the streak strong.",
    };
  }

  if (workoutsThisWeek === 1) {
    return {
      label: "Week started",
      message:
        "You have one session logged this week. Start another workout when you are ready.",
    };
  }

  return {
    label: "Fresh week",
    message:
      "No workouts logged this week yet. Start a session today and build momentum.",
  };
}

function calculateWorkoutVolume(
  exercises: {
    sets: {
      weight: number | null;
      reps: number | null;
    }[];
  }[]
) {
  return exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.sets.reduce((setTotal, set) => {
        if (set.weight === null || set.reps === null) {
          return setTotal;
        }

        return setTotal + set.weight * set.reps;
      }, 0)
    );
  }, 0);
}

function getSetCount(exercises: { sets: unknown[] }[]) {
  return exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

function formatStartedTime(startedAt: Date | null) {
  if (!startedAt) {
    return "Recently started";
  }

  return startedAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const session = await requireUserSession();
  const userId = session.user.id;

  const [profile, analytics, personalRecords, routineCount, activeWorkout] =
    await Promise.all([
      db.profile.findUnique({
        where: {
          userId: userId,
        },
      }),
      getDashboardAnalytics(userId),
      getTopExercisePersonalRecords(userId, 5),
      db.workoutTemplate.count({
        where: {
          userId: session.user.id,
        },
      }),
      db.workout.findFirst({
        where: {
          userId: session.user.id,
          status: "active",
        },
        orderBy: {
          startedAt: "desc",
        },
        include: {
          exercises: {
            include: {
              sets: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      }),
    ]);

  const hasProfile = Boolean(profile);
  const hasWorkouts = analytics.workoutCount > 0;
  const hasRoutines = routineCount > 0;
  const firstName = getFirstName(session.user.name);
  const trainingStatus = getTrainingStatus(analytics.workoutsThisWeek);
  const latestWorkout = analytics.recentWorkouts[0];
  const topRecord = personalRecords[0];

  const activeWorkoutSets = activeWorkout
    ? getSetCount(activeWorkout.exercises)
    : 0;
  const activeWorkoutVolume = activeWorkout
    ? calculateWorkoutVolume(activeWorkout.exercises)
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Card className="relative overflow-hidden p-5 sm:p-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.12),transparent_34%)]" />

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
              Training command center
            </p>

            <h1 className="mt-4 bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
              Persist Fitness is tracking your consistency, workload, PRs, and
              training history so every session has context.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <MetricBadge variant="emerald">{trainingStatus.label}</MetricBadge>
              <MetricBadge>{analytics.currentStreak} day streak</MetricBadge>
              <MetricBadge>{analytics.workoutsThisWeek} this week</MetricBadge>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <StartWorkoutButton />
            <Button href="/routines" variant="secondary" fullWidth>
              Start from routine
            </Button>
            <LogoutButton />
          </div>
        </div>
      </Card>

      {activeWorkout && (
        <Card variant="emerald" className="mt-6 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Active workout
              </p>

              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Resume {activeWorkout.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-300">
                Started at {formatStartedTime(activeWorkout.startedAt)} ·{" "}
                {formatWorkoutDate(activeWorkout.date)}
              </p>
            </div>

            <Button href={`/workouts/${activeWorkout.id}`}>
              Resume workout
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Sets logged
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {activeWorkoutSets}
              </p>
            </Card>

            <Card className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Volume
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatVolume(activeWorkoutVolume)}
              </p>
            </Card>

            <Card className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Exercises
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {activeWorkout.exercises.length}
              </p>
            </Card>
          </div>
        </Card>
      )}

      {(!hasProfile || !hasWorkouts || !hasRoutines) && (
        <Card variant="emerald" className="mt-6 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-white">
                Finish your MVP training setup
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">
                Complete these basics so the app can give better workout context
                and eventually stronger AI-assisted recommendations.
              </p>
            </div>

            <MetricBadge variant="emerald">
              {[
                hasProfile ? 1 : 0,
                hasWorkouts ? 1 : 0,
                hasRoutines ? 1 : 0,
              ].reduce((total, value) => total + value, 0)}
              /3 complete
            </MetricBadge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link
              href="/settings"
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.09]"
            >
              <p className="font-black text-white">
                {hasProfile ? "Profile complete" : "Complete profile"}
              </p>
              <p className="mt-1 text-sm leading-5 text-neutral-400">
                Goals, experience, equipment, and training split.
              </p>
            </Link>

            <Link
              href="/workouts/new"
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.09]"
            >
              <p className="font-black text-white">
                {hasWorkouts ? "Workout logged" : "Log first workout"}
              </p>
              <p className="mt-1 text-sm leading-5 text-neutral-400">
                Create a session and save your first working sets.
              </p>
            </Link>

            <Link
              href="/routines/new"
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.09]"
            >
              <p className="font-black text-white">
                {hasRoutines ? "Routine created" : "Create a routine"}
              </p>
              <p className="mt-1 text-sm leading-5 text-neutral-400">
                Build reusable templates for your weekly training.
              </p>
            </Link>
          </div>
        </Card>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total workouts"
          value={analytics.workoutCount}
          helper="All sessions saved"
        />
        <StatCard
          label="This week"
          value={analytics.workoutsThisWeek}
          helper="Workouts logged this week"
        />
        <StatCard
          label="Current streak"
          value={`${analytics.currentStreak} day${
            analytics.currentStreak === 1 ? "" : "s"
          }`}
          helper="Based on workout days"
        />
        <StatCard
          label="Total sets"
          value={analytics.totalSets}
          helper="Every logged set"
        />
        <StatCard
          label="Total volume"
          value={formatVolume(analytics.totalVolume)}
          helper="Weight × reps across all sets"
        />
        <StatCard
          label="Current goal"
          value={profile?.primaryGoal ?? "Not set"}
          helper="Used for future suggestions"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Section
          eyebrow="Next best action"
          title={
            activeWorkout
              ? "Finish your active session"
              : latestWorkout
                ? "Build from your last session"
                : "Start your first tracked session"
          }
        >
          <p className="text-sm leading-6 text-neutral-300">
            {activeWorkout
              ? "You have a workout in progress. Resume it before starting another session so your training history stays clean."
              : trainingStatus.message}
          </p>

          {activeWorkout ? (
            <Link
              href={`/workouts/${activeWorkout.id}`}
              className="mt-5 block rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.08] p-4 transition hover:border-emerald-300/50 hover:bg-emerald-400/[0.12]"
            >
              <p className="text-sm font-bold text-emerald-200">
                Active session
              </p>
              <p className="mt-2 text-xl font-black text-white">
                {activeWorkout.title}
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {activeWorkoutSets} sets · {formatVolume(activeWorkoutVolume)}
              </p>
            </Link>
          ) : latestWorkout ? (
            <Link
              href={`/workouts/${latestWorkout.id}`}
              className="mt-5 block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.08]"
            >
              <p className="text-sm font-bold text-neutral-400">
                Latest workout
              </p>
              <p className="mt-2 text-xl font-black text-white">
                {latestWorkout.title}
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {formatWorkoutDate(latestWorkout.date)} ·{" "}
                {latestWorkout.goal || "No goal set"}
              </p>
            </Link>
          ) : (
            <div className="mt-5">
              <StartWorkoutButton />
            </div>
          )}
        </Section>

        <Section eyebrow="Top lift">
          {topRecord ? (
            <Link
              href={`/workouts/${topRecord.workoutId}`}
              className="block rounded-2xl border border-amber-300/20 bg-amber-400/[0.08] p-4 transition hover:border-amber-300/40"
            >
              <p className="text-2xl font-black text-white">
                {topRecord.exerciseName}
              </p>
              <p className="mt-2 text-sm text-neutral-300">
                {topRecord.weight} lb × {topRecord.reps} reps
              </p>
              <p className="mt-4 inline-flex rounded-full bg-amber-300/15 px-3 py-1 text-sm font-black text-amber-200">
                est. 1RM {Math.round(topRecord.estimatedOneRepMax)} lb
              </p>
            </Link>
          ) : (
            <EmptyState
              title="No top lift yet"
              description="Log weighted sets to start building your strength profile."
            />
          )}
        </Section>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {profile && (
          <Section
            title="Training setup"
            description="Current inputs for future planning."
            action={
              <Button href="/settings" variant="secondary">
                Edit
              </Button>
            }
          >
            <div className="grid gap-3">
              <Card className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Experience
                </p>
                <p className="mt-1 font-black text-white">
                  {profile.experience ?? "Not set"}
                </p>
              </Card>

              <Card className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Weekly availability
                </p>
                <p className="mt-1 font-black text-white">
                  {profile.availableDays
                    ? `${profile.availableDays} days`
                    : "Not set"}
                </p>
              </Card>

              <Card className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Equipment
                </p>
                <p className="mt-1 font-black text-white">
                  {profile.equipment.length
                    ? profile.equipment.join(", ")
                    : "Not set"}
                </p>
              </Card>
            </div>
          </Section>
        )}

        <Section
          title="Recent workouts"
          description="Jump back into your latest sessions."
          action={
            <Button href="/workouts" variant="secondary">
              View all
            </Button>
          }
        >
          {analytics.recentWorkouts.length === 0 ? (
            <EmptyState
              title="No workouts yet"
              actionLabel="Log first workout"
              actionHref="/workouts/new"
            />
          ) : (
            <div className="space-y-3">
              {analytics.recentWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workouts/${workout.id}`}
                  className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.08]"
                >
                  <p className="font-black text-white">{workout.title}</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    {formatWorkoutDate(workout.date)} ·{" "}
                    {workout.goal || "No goal set"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </section>

      <Section
        className="mt-6"
        title="Personal records"
        description="Your strongest logged sets ranked by estimated one-rep max."
      >
        {personalRecords.length === 0 ? (
          <EmptyState
            title="No PRs yet"
            description="Log sets with weight and reps to start building personal records."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {personalRecords.map((record) => (
              <Link
                key={`${record.exerciseName}-${record.workoutId}`}
                href={`/workouts/${record.workoutId}`}
                className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/40 hover:bg-white/[0.08]"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-black text-white">
                      {record.exerciseName}
                    </p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {record.weight} lb × {record.reps} reps ·{" "}
                      {formatWorkoutDate(record.workoutDate)}
                    </p>
                  </div>

                  <div className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-black text-amber-200">
                    {Math.round(record.estimatedOneRepMax)} lb
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}