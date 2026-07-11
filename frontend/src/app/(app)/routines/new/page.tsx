import { createRoutine } from "@/app/actions/routines";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";

export default async function NewRoutinePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="New routine"
        title="Create a reusable workout"
        description="Build a routine once, then start workouts from it whenever you train."
      />

      <form
        action={createRoutine}
        className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Routine title
          </label>
          <input
            id="title"
            name="title"
            placeholder="Example: Push Day, Pull Day, Leg Day"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Example: Chest, shoulders, and triceps with a focus on progressive overload."
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          Create routine
        </button>
      </form>
    </main>
  );
}