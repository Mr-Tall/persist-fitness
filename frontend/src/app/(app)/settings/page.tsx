import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import Link from "next/link";
import { listManagedSessions } from "@/lib/auth/session-management";
import {
  AccountDataControls,
  DeleteAccountControl,
  SessionManagement,
} from "./account-management";
import { HealthSettings } from "@/components/health/health-settings";

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
  "mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25";

const labelClassName = "block text-sm font-bold text-neutral-200";

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ feedback?: string; reference?: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, sessions] = await Promise.all([
    db.profile.findUnique({ where: { userId: session.user.id } }),
    listManagedSessions(session),
  ]);
  const query = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8 pt-5 sm:px-6 sm:py-10">
      <header className="mb-5 px-1 sm:mb-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-text-secondary">
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
          <legend className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">
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
          <legend className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">
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
          <legend className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">
            Available equipment
          </legend>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Choose everything you can regularly use.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {equipmentOptions.map((item) => (
              <label
                key={item}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-elevated focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/25"
              >
                <input
                  type="checkbox"
                  name="equipment"
                  value={item}
                  defaultChecked={profile?.equipment.includes(item)}
                  className="h-5 w-5 shrink-0 accent-action"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <SubmitButton
          pendingText="Saving profile..."
          className="min-h-12 w-full rounded-2xl bg-action px-6 py-3 font-black text-action-foreground shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
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

        <div className="mt-4 [&_button]:min-h-12 [&_button]:w-full [&_button]:border-border [&_button]:bg-action-secondary [&_button]:text-text-secondary [&_button]:hover:bg-surface-elevated [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-focus sm:mt-0 sm:[&_button]:w-auto">
          <LogoutButton />
        </div>
      </section>
      <SessionManagement sessions={sessions.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        expires: item.expires.toISOString(),
        lastActiveAt: item.lastActiveAt.toISOString(),
      }))} />
      <HealthSettings />
      <AccountDataControls />
      <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 sm:p-6">
        <h2 className="text-lg font-black text-white">Beta feedback</h2>
        <p className="mt-1 mb-4 text-sm leading-6 text-neutral-400">Report a problem or tell us what would make Persist better.</p>
        <FeedbackDialog autoOpen={query?.feedback === "bug"} initialCategory={query?.feedback === "bug" ? "bug" : "general"} errorReference={query?.reference ?? ""} />
      </section>
      <section aria-labelledby="privacy-resources-heading" className="mt-5 rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
        <h2 id="privacy-resources-heading" className="text-lg font-black text-white">Privacy and terms</h2>
        <p className="mt-1 text-sm leading-6 text-text-muted">Review how the beta handles account data, analytics, crash reports, feedback, and offline storage.</p>
        <nav aria-label="Privacy resources" className="mt-3 flex flex-wrap gap-2">
          <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Privacy policy</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Terms</Link>
          <Link href="/data-usage" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Data usage</Link>
        </nav>
      </section>
      <DeleteAccountControl />
    </main>
  );
}
