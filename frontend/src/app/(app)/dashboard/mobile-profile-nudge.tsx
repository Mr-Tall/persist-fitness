import { Button } from "@/components/ui/button";

export type TrainingProfileCompletionFields = {
  primaryGoal: string | null;
  experience: string | null;
  availableDays: number | null;
  equipment: string[];
};

function hasText(value: string | null) {
  return Boolean(value?.trim());
}

export function isTrainingProfileComplete(
  profile: TrainingProfileCompletionFields | null
) {
  return Boolean(
    profile &&
      hasText(profile.primaryGoal) &&
      hasText(profile.experience) &&
      profile.availableDays !== null &&
      profile.availableDays >= 1 &&
      profile.availableDays <= 7 &&
      profile.equipment.length > 0
  );
}

type MobileProfileNudgeProps = {
  profile: TrainingProfileCompletionFields | null;
};

export function MobileProfileNudge({ profile }: MobileProfileNudgeProps) {
  if (isTrainingProfileComplete(profile)) {
    return null;
  }

  return (
    <section
      aria-labelledby="mobile-profile-nudge-title"
      className="mt-5 flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="min-w-0 flex-1">
        <h2
          id="mobile-profile-nudge-title"
          className="text-sm font-black leading-5 text-white"
        >
          Finish your training setup
        </h2>
        <p className="mt-1 text-xs leading-5 text-neutral-400">
          Add your goals, schedule, and equipment for better training context.
        </p>
      </div>

      <Button
        href="/settings"
        variant="secondary"
        className="min-h-12 shrink-0 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Finish setup
      </Button>
    </section>
  );
}
