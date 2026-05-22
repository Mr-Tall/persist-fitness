import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createWorkout } from "@/app/actions/workouts";

export default async function NewWorkoutPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <section className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-600">
          New workout
        </p>
        <h1 className="mt-3 text-3xl font-bold">Log a training session</h1>
        <p className="mt-3 text-neutral-600">
          Start with the session details. Next, we’ll add exercises and sets.
        </p>
      </section>

      <form action={createWorkout} className="space-y-6 rounded-3xl border border-neutral-200 p-6">
        <div>
          <label className="block text-sm font-medium">Workout title</label>
          <input
            name="title"
            placeholder="Example: Push Day, Upper Strength, Leg Day"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Goal</label>
          <select
            name="goal"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
            defaultValue=""
          >
            <option value="">No specific goal</option>
            <option value="Hypertrophy">Hypertrophy</option>
            <option value="Strength">Strength</option>
            <option value="Endurance">Endurance</option>
            <option value="Technique">Technique</option>
            <option value="Recovery">Recovery</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            name="date"
            type="date"
            defaultValue={today}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="How did the session feel? Any soreness, form notes, or goals?"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
        >
          Create workout
        </button>
      </form>
    </main>
  );
}