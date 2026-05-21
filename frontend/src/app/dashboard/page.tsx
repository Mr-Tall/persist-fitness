import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          Welcome back
        </p>

        <h1 className="mt-2 text-3xl font-bold text-neutral-950">
          {session.user.name ?? "Athlete"}
        </h1>

        <p className="mt-2 max-w-2xl text-neutral-600">
          This dashboard will become your training home base: recent workouts, weekly volume, PRs, readiness, and AI suggestions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">This week</p>
          <h2 className="mt-2 text-2xl font-semibold">0 workouts</h2>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Current focus</p>
          <h2 className="mt-2 text-2xl font-semibold">Not set yet</h2>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">AI suggestions</p>
          <h2 className="mt-2 text-2xl font-semibold">Coming soon</h2>
        </div>
      </section>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  );
}