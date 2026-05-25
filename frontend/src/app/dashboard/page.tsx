import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, workoutCount, recentWorkouts] = await Promise.all([
    db.profile.findUnique({
      where: {
        userId: session.user.id,
      },
    }),
    db.workout.count({
      where: {
        userId: session.user.id,
      },
    }),
    db.workout.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 3,
    }),
  ]);

  const hasProfile = Boolean(profile);
  const hasWorkouts = workoutCount > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back${session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}`}
        description="Your training home base for profile data, workout history, and future AI-powered suggestions."
        action={<LogoutButton />}
      />

      {(!hasProfile || !hasWorkouts) && (
        <section className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-950">
            Finish setting up Persist Fitness
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link
              href="/settings"
              className={`rounded-2xl border p-4 transition ${
                hasProfile
                  ? "border-emerald-200 bg-white text-neutral-500"
                  : "border-emerald-300 bg-white hover:border-emerald-500"
              }`}
            >
              <p className="font-semibold">
                {hasProfile ? "Profile complete" : "1. Complete your profile"}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Add your goal, training split, experience, and equipment.
              </p>
            </Link>

            <Link
              href="/workouts/new"
              className={`rounded-2xl border p-4 transition ${
                hasWorkouts
                  ? "border-emerald-200 bg-white text-neutral-500"
                  : "border-emerald-300 bg-white hover:border-emerald-500"
              }`}
            >
              <p className="font-semibold">
                {hasWorkouts ? "First workout logged" : "2. Log your first workout"}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Create a session, add exercises, and start tracking sets.
              </p>
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Logged workouts"
          value={workoutCount}
          helper="Total sessions saved"
        />

        <StatCard
          label="Current goal"
          value={profile?.primaryGoal ?? "Not set"}
          helper="Used for future workout suggestions"
        />

        <StatCard
          label="Preferred split"
          value={profile?.preferredSplit ?? "Not set"}
          helper="Helps shape your weekly plan"
        />
      </section>

      {profile && (
        <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">Training setup</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Your current preferences for workout planning.
              </p>
            </div>

            <Link
              href="/settings"
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Edit profile
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <p>
              <span className="font-medium">Experience:</span>{" "}
              {profile.experience ?? "Not set"}
            </p>
            <p>
              <span className="font-medium">Days per week:</span>{" "}
              {profile.availableDays ?? "Not set"}
            </p>
            <p>
              <span className="font-medium">Training age:</span>{" "}
              {profile.trainingAge ?? "Not set"}
            </p>
            <p>
              <span className="font-medium">Equipment:</span>{" "}
              {profile.equipment.length ? profile.equipment.join(", ") : "Not set"}
            </p>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Recent workouts</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Quickly jump back into your latest sessions.
            </p>
          </div>

          <Link
            href="/workouts"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            View all
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 p-6 text-center">
            <p className="font-medium">No workouts yet</p>
            <Link
              href="/workouts/new"
              className="mt-4 inline-block rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Log first workout
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {recentWorkouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="block rounded-2xl border border-neutral-200 p-4 transition hover:border-neutral-400 hover:bg-neutral-50"
              >
                <p className="font-semibold">{workout.title}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {workout.goal || "No goal set"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}