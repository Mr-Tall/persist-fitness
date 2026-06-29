import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { formatWorkoutDate } from "@/lib/format-date";
import { getTopExercisePersonalRecords } from "@/lib/personal-records";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StartWorkoutButton } from "./start-workout-button";

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

function getSetCount(
  exercises: {
    sets: unknown[];
  }[]
) {
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
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, analytics, personalRecords, routineCount, activeWorkout] =
    await Promise.all([
      db.profile.findUnique({
        where: {
          userId: session.user.id,
        },
      }),
      getDashboardAnalytics(session.user.id),
      getTopExercisePersonalRecords(session.user.id, 5),
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
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-8">
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
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                {trainingStatus.label}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-neutral-300">
                {analytics.currentStreak} day streak
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-neutral-300">
                {analytics.workoutsThisWeek} this week
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <StartWorkoutButton />

            <Link
              href="/routines"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto lg:w-full"
            >
              Start from routine
            </Link>

            <LogoutButton />
          </div>
        </div>
      </section>

      {activeWorkout && (
        <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-300/25 bg-emerald-400/[0.08] p-5 shadow-sm backdrop-blur sm:p-6">
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

            <Link
              href={`/workouts/${activeWorkout.id}`}
              className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-black text-black transition hover:bg-emerald-300"
            >
              Resume workout
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Sets logged
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {activeWorkoutSets}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Volume
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatVolume(activeWorkoutVolume)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Exercises
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {activeWorkout.exercises.length}
              </p>
            </div>
          </div>
        </section>
      )}

      {(!hasProfile || !hasWorkouts || !hasRoutines) && (
        <section className="mt-6 rounded-[2rem] border border-emerald-300/20 bg-emerald-400/[0.08] p-5 backdrop-blur sm:p-6">
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

            <div className="rounded-full border border-emerald-300/30 bg-black/20 px-4 py-2 text-sm font-bold text-emerald-200">
              {[
                hasProfile ? 1 : 0,
                hasWorkouts ? 1 : 0,
                hasRoutines ? 1 : 0,
              ].reduce((total, value) => total + value, 0)}
              /3 complete
            </div>
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
        </section>
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
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Next best action
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {activeWorkout
                  ? "Finish your active session"
                  : latestWorkout
                    ? "Build from your last session"
                    : "Start your first tracked session"}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-neutral-300">
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
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
            Top lift
          </p>

          {topRecord ? (
            <Link
              href={`/workouts/${topRecord.workoutId}`}
              className="mt-4 block rounded-2xl border border-amber-300/20 bg-amber-400/[0.08] p-4 transition hover:border-amber-300/40"
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
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-center">
              <p className="font-bold text-white">No top lift yet</p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Log weighted sets to start building your strength profile.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {profile && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-white">
                  Training setup
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Current inputs for future planning.
                </p>
              </div>

              <Link
                href="/settings"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Edit
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Experience
                </p>
                <p className="mt-1 font-black text-white">
                  {profile.experience ?? "Not set"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Weekly availability
                </p>
                <p className="mt-1 font-black text-white">
                  {profile.availableDays
                    ? `${profile.availableDays} days`
                    : "Not set"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Equipment
                </p>
                <p className="mt-1 font-black text-white">
                  {profile.equipment.length
                    ? profile.equipment.join(", ")
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black text-white">
                Recent workouts
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Jump back into your latest sessions.
              </p>
            </div>

            <Link
              href="/workouts"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View all
            </Link>
          </div>

          {analytics.recentWorkouts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center">
              <p className="font-bold text-white">No workouts yet</p>
              <Link
                href="/workouts/new"
                className="mt-4 inline-block rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-black hover:bg-emerald-300"
              >
                Log first workout
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {analytics.recentWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workouts/${workout.id}`}
                  className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.08]"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-black text-white">{workout.title}</p>
                      <p className="mt-1 text-sm text-neutral-400">
                        {formatWorkoutDate(workout.date)} ·{" "}
                        {workout.goal || "No goal set"}
                      </p>
                    </div>

                    {"status" in workout && workout.status === "active" && (
                      <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-200">
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-white">Personal records</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Your strongest logged sets ranked by estimated one-rep max.
            </p>
          </div>
        </div>

        {personalRecords.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center">
            <p className="font-bold text-white">No PRs yet</p>
            <p className="mt-2 text-sm text-neutral-400">
              Log sets with weight and reps to start building personal records.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
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
      </section>
    </main>
  );
}