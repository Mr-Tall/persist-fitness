import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, workoutCount] = await Promise.all([
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
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-950">
            {session.user.name ?? "Athlete"}
          </h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Your training home base for profile data, workouts, and future AI suggestions.
          </p>
        </div>

        <LogoutButton />
      </section>

      {!profile && (
        <section className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold">Finish your training profile</h2>
          <p className="mt-2 text-neutral-700">
            Add your goals, experience, equipment, and weekly schedule so the app can personalize your training.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600"
          >
            Complete profile
          </Link>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Logged workouts</p>
          <h2 className="mt-2 text-2xl font-semibold">{workoutCount}</h2>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Current goal</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {profile?.primaryGoal ?? "Not set"}
          </h2>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Preferred split</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {profile?.preferredSplit ?? "Not set"}
          </h2>
        </div>
      </section>

      {profile && (
        <section className="mt-8 rounded-3xl border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold">Training setup</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
    </main>
  );
}