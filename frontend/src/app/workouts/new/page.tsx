import { createWorkout } from "@/app/actions/workouts";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";

export default async function NewWorkoutPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="New workout"
        title="Log a training session"
        description="Start with the session details. After creating the workout, you’ll add exercises and sets."
      />

      <form
        action={createWorkout}
        className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Workout title
          </label>
          <input
            id="title"
            name="title"
            placeholder="Example: Push Day, Upper Strength, Leg Day"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div>
          <label htmlFor="goal" className="block text-sm font-medium">
            Goal
          </label>
          <select
            id="goal"
            name="goal"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="How did the session feel? Any soreness, form notes, or goals?"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          Create workout and add exercises
        </button>
      </form>
    </main>
  );
}