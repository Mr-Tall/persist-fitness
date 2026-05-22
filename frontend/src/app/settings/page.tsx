import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions/profile";

const equipmentOptions = [
  "Barbell",
  "Dumbbells",
  "Machines",
  "Cable machine",
  "Pull-up bar",
  "Bench",
  "Bodyweight only",
];

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await db.profile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <section className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-600">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-bold">Training profile</h1>
        <p className="mt-3 text-neutral-600">
          Add your goals, experience level, weekly schedule, and available equipment so Persist Fitness can personalize your training.
        </p>
      </section>

      <form action={saveProfile} className="space-y-6 rounded-3xl border border-neutral-200 p-6">
        <div>
          <label className="block text-sm font-medium">Primary goal</label>
          <select
            name="primaryGoal"
            defaultValue={profile?.primaryGoal ?? ""}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
            required
          >
            <option value="">Select a goal</option>
            <option value="Build muscle">Build muscle</option>
            <option value="Get stronger">Get stronger</option>
            <option value="Lose fat">Lose fat</option>
            <option value="Recomposition">Recomposition</option>
            <option value="Improve athleticism">Improve athleticism</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Experience level</label>
          <select
            name="experience"
            defaultValue={profile?.experience ?? ""}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
            required
          >
            <option value="">Select experience</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Training age</label>
          <input
            name="trainingAge"
            defaultValue={profile?.trainingAge ?? ""}
            placeholder="Example: 2 years"
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Available training days per week</label>
          <input
            name="availableDays"
            type="number"
            min="1"
            max="7"
            defaultValue={profile?.availableDays ?? 4}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Preferred split</label>
          <select
            name="preferredSplit"
            defaultValue={profile?.preferredSplit ?? ""}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2"
          >
            <option value="">No preference yet</option>
            <option value="Push Pull Legs">Push Pull Legs</option>
            <option value="Upper Lower">Upper Lower</option>
            <option value="Full Body">Full Body</option>
            <option value="Bro Split">Bro Split</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium">Available equipment</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {equipmentOptions.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
                <input
                  type="checkbox"
                  name="equipment"
                  value={item}
                  defaultChecked={profile?.equipment.includes(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
        >
          Save profile
        </button>
      </form>
    </main>
  );
}