export type CoachInsightType =
  | "strength_progress"
  | "plateau"
  | "skipped_muscle_groups"
  | "program_adherence"
  | "workout_consistency"
  | "pr_frequency"
  | "volume_trends"
  | "training_balance"
  | "recovery_spacing"
  | "workout_frequency"
  | "missed_planned_workouts";

export type CoachCategory =
  | "strength"
  | "consistency"
  | "balance"
  | "recovery"
  | "program";

export type CoachPriority = "high" | "medium" | "low";
export type CoachDirection = "positive" | "neutral" | "negative";

export type CoachMetric = {
  key: string;
  value: number;
  unit: "count" | "percent" | "days" | "lb" | "sessions_per_week";
};

export type CoachInsight = {
  id: string;
  type: CoachInsightType;
  category: CoachCategory;
  priority: CoachPriority;
  direction: CoachDirection;
  confidence: number;
  metrics: CoachMetric[];
  subject?: { id?: string; name: string };
};

export type CoachSuggestedAction = {
  type:
    | "continue_plan"
    | "schedule_session"
    | "review_training_load"
    | "train_muscle_group"
    | "add_recovery_day"
    | "build_baseline";
  target?: string;
};

export type CoachRecommendation = {
  id: string;
  title: string;
  priority: CoachPriority;
  category: CoachCategory;
  supportingMetrics: CoachMetric[];
  confidence: number;
  suggestedAction: CoachSuggestedAction;
  sourceInsightType: CoachInsightType;
};

export type CoachWorkout = {
  id: string;
  date: Date;
  status: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  rpe?: number | null;
  exercises: {
    exerciseId?: string | null;
    name: string;
    exercise?: {
      primaryMuscles?: readonly string[];
      trackingType?: string | null;
    } | null;
    sets: readonly { weight: number | null; reps: number | null }[];
  }[];
};

export type CoachProgramContext = {
  startDate: Date;
  completedDays: number;
  totalDays: number;
  plannedDaysByWeek: readonly number[];
};

export type CoachReport = {
  generatedAt: Date;
  insights: CoachInsight[];
  recommendations: CoachRecommendation[];
  topInsight: CoachInsight | null;
  topRecommendation: CoachRecommendation | null;
};

