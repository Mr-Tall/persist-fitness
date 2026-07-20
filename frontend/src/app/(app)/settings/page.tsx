import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

const equipmentOptions = [
  "Barbell",
  "Dumbbells",
  "Machines",
  "Cable machine",
  "Pull-up bar",
  "Bench",
  "Bodyweight only",
];

const controlClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition focus-visible:border-emerald-300/60 focus-visible:ring-2 focus-visible:ring-emerald-300/25";

const labelClassName = "block text-sm font-bold text-neutral-200";

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
    <main className="mx-auto max-w-3xl px-4 pb-8 pt-5 sm:px-6 sm:py-10">
      <header className="mb-5 px-1 sm:mb-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Training profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
          Shape your training around your goals, schedule, and available
          equipment.
        </p>
      </header>

      <ProfileForm>
        <fieldset>
          <legend className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Goal and experience
          </legend>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="primaryGoal" className={labelClassName}>
                Primary goal
              </label>
              <select
                id="primaryGoal"
                name="primaryGoal"
                defaultValue={profile?.primaryGoal ?? ""}
                className={controlClassName}
                required
              >
                <option value="">Select a goal</option>
                <option value="Build muscle">Build muscle</option>
                <option value="Get stronger">Get stronger</option>
                <option value="Lose fat">Lose fat</option>
                <option value="Recomposition">Recomposition</option>
                <option value="Improve athleticism">
                  Improve athleticism
                </option>
                <option value="General fitness">General fitness</option>
              </select>
            </div>

            <div>
              <label htmlFor="experience" className={labelClassName}>
                Experience level
              </label>
              <select
                id="experience"
                name="experience"
                defaultValue={profile?.experience ?? ""}
                className={controlClassName}
                required
              >
                <option value="">Select experience</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label htmlFor="trainingAge" className={labelClassName}>
                Training age
              </label>
              <input
                id="trainingAge"
                name="trainingAge"
                defaultValue={profile?.trainingAge ?? ""}
                placeholder="Example: 2 years"
                className={controlClassName}
              />
            </div>
          </div>
        </fieldset>

        <div className="h-px bg-white/10" />

        <fieldset>
          <legend className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Schedule and split
          </legend>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="availableDays" className={labelClassName}>
                Available training days per week
              </label>
              <input
                id="availableDays"
                name="availableDays"
                type="number"
                min="1"
                max="7"
                defaultValue={profile?.availableDays ?? 4}
                className={controlClassName}
                required
              />
            </div>

            <div>
              <label htmlFor="preferredSplit" className={labelClassName}>
                Preferred split
              </label>
              <select
                id="preferredSplit"
                name="preferredSplit"
                defaultValue={profile?.preferredSplit ?? ""}
                className={controlClassName}
              >
                <option value="">No preference yet</option>
                <option value="Push Pull Legs">Push Pull Legs</option>
                <option value="Upper Lower">Upper Lower</option>
                <option value="Full Body">Full Body</option>
                <option value="Bro Split">Bro Split</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div className="h-px bg-white/10" />

        <fieldset>
          <legend className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Available equipment
          </legend>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Choose everything you can regularly use.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {equipmentOptions.map((item) => (
              <label
                key={item}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-neutral-200 transition hover:bg-white/[0.06] focus-within:border-emerald-300/60 focus-within:ring-2 focus-within:ring-emerald-300/25"
              >
                <input
                  type="checkbox"
                  name="equipment"
                  value={item}
                  defaultChecked={profile?.equipment.includes(item)}
                  className="h-5 w-5 shrink-0 accent-emerald-400"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <SubmitButton
          pendingText="Saving profile..."
          className="min-h-12 w-full rounded-2xl bg-emerald-400 px-6 py-3 font-black text-black shadow-[0_16px_40px_rgba(52,211,153,0.18)] transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto"
        >
          Save profile
        </SubmitButton>
      </ProfileForm>

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 sm:mt-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <h2 className="text-lg font-black text-white">Account</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            Manage your session and account access.
          </p>
        </div>

        <div className="mt-4 [&_button]:min-h-12 [&_button]:w-full [&_button]:border-white/15 [&_button]:bg-white/[0.04] [&_button]:text-neutral-200 [&_button]:hover:bg-white/10 [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-emerald-300/40 sm:mt-0 sm:[&_button]:w-auto">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
