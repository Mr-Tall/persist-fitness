export type CountBucket = "0" | "1" | "2-3" | "4-6" | "7+";
export type DurationBucket = "under_15m" | "15-30m" | "31-60m" | "over_60m";
export type MutationBucket = "1" | "2-3" | "4-10" | "11+";

export type ProductEventMap = {
  account_signed_in: Record<string, never>;
  onboarding_started: Record<string, never>;
  onboarding_completed: { goal_selected: boolean };
  workout_started: { source: "manual" | "today" | "routine" | "repeat" | "program"; exercise_count: CountBucket };
  workout_completed: { duration: DurationBucket; exercise_count: CountBucket; offline_used: boolean };
  workout_abandoned: { exercise_count: CountBucket };
  routine_created: { exercise_count: CountBucket };
  program_enrolled: { difficulty: "beginner" | "intermediate" | "advanced" | "other"; category: "strength" | "hypertrophy" | "powerlifting" | "athletic" | "general_fitness" | "other" };
  program_workout_started: { exercise_count: CountBucket };
  exercise_favorited: { tracking_mode: "weight_reps" | "reps_only" | "time" | "distance" | "distance_time" };
  rest_timer_started: { preset_bucket: "under_60s" | "60-120s" | "over_120s" };
  offline_mode_entered: Record<string, never>;
  offline_changes_synced: { mutation_count: MutationBucket };
  offline_sync_conflict: { conflict_category: "workout_finished" | "set_deleted" | "exercise_deleted" | "tracking_changed" | "unknown" };
  feedback_submitted: { category: "bug" | "feature_request" | "general"; screenshot_attached: boolean };
};

export type ProductEventName = keyof ProductEventMap;
export const productEventNames = [
  "account_signed_in", "onboarding_started", "onboarding_completed",
  "workout_started", "workout_completed", "workout_abandoned",
  "routine_created", "program_enrolled", "program_workout_started",
  "exercise_favorited", "rest_timer_started", "offline_mode_entered",
  "offline_changes_synced", "offline_sync_conflict", "feedback_submitted",
] as const satisfies readonly ProductEventName[];
