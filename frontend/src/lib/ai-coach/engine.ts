import { analyzeCoachInputs, type CoachAnalysis } from "./analyzers";
import type {
  CoachInsight,
  CoachInsightType,
  CoachMetric,
  CoachPriority,
  CoachProgramContext,
  CoachRecommendation,
  CoachReport,
  CoachWorkout,
} from "./types";

const PRIORITY_ORDER: Record<CoachPriority, number> = { high: 3, medium: 2, low: 1 };

function confidence(sampleSize: number, target: number, ceiling = 0.95) {
  return Number(Math.min(ceiling, 0.35 + (Math.min(sampleSize, target) / target) * 0.6).toFixed(2));
}

function metric(key: string, value: number, unit: CoachMetric["unit"]): CoachMetric {
  return { key, value: Number(value.toFixed(1)), unit };
}

function insight(
  type: CoachInsightType,
  input: Omit<CoachInsight, "id" | "type">,
): CoachInsight {
  return { id: `coach-${type}-${input.subject?.id ?? input.subject?.name ?? "overall"}`, type, ...input };
}

export class InsightEngine {
  generate(analysis: CoachAnalysis): CoachInsight[] {
    const insights: CoachInsight[] = [];
    const workoutConfidence = confidence(analysis.consistency.completedWorkoutCount, 12);

    insights.push(
      insight("workout_frequency", {
        category: "consistency",
        priority: analysis.consistency.workoutsPerWeek < 1 ? "high" : "low",
        direction: analysis.consistency.workoutsPerWeek >= 2 ? "positive" : "neutral",
        confidence: workoutConfidence,
        metrics: [metric("workouts_per_week", analysis.consistency.workoutsPerWeek, "sessions_per_week")],
      }),
      insight("workout_consistency", {
        category: "consistency",
        priority: analysis.consistency.consistencyPercent < 50 ? "medium" : "low",
        direction: analysis.consistency.consistencyPercent >= 75 ? "positive" : "neutral",
        confidence: workoutConfidence,
        metrics: [metric("active_weeks", analysis.consistency.activeWeeks, "count"), metric("consistency", analysis.consistency.consistencyPercent, "percent")],
      }),
    );

    if (analysis.trends.previousVolume > 0) {
      insights.push(
        insight("volume_trends", {
          category: "strength",
          priority: analysis.trends.volumeChangePercent < -20 ? "medium" : "low",
          direction: analysis.trends.volumeChangePercent > 5 ? "positive" : analysis.trends.volumeChangePercent < -10 ? "negative" : "neutral",
          confidence: workoutConfidence,
          metrics: [metric("volume_change", analysis.trends.volumeChangePercent, "percent"), metric("recent_volume", analysis.trends.currentVolume, "lb")],
        }),
      );
    }

    for (const exercise of analysis.trends.exercises) {
      if (exercise.previousBest <= 0 || exercise.recentBest <= 0) continue;
      if (exercise.changePercent > 2) {
        insights.push(
          insight("strength_progress", {
            category: "strength",
            priority: "low",
            direction: "positive",
            confidence: confidence(exercise.observations, 6),
            metrics: [metric("estimated_1rm_change", exercise.changePercent, "percent"), metric("recent_estimated_1rm", exercise.recentBest, "lb")],
            subject: { id: exercise.exerciseId, name: exercise.exerciseName },
          }),
        );
      } else if (exercise.observations >= 4 && exercise.changePercent <= 1) {
        insights.push(
          insight("plateau", {
            category: "strength",
            priority: "medium",
            direction: "neutral",
            confidence: confidence(exercise.observations, 8),
            metrics: [metric("estimated_1rm_change", exercise.changePercent, "percent"), metric("observations", exercise.observations, "count")],
            subject: { id: exercise.exerciseId, name: exercise.exerciseName },
          }),
        );
      }
    }

    insights.push(
      insight("pr_frequency", {
        category: "strength",
        priority: "low",
        direction: analysis.trends.recentPrCount > 0 ? "positive" : "neutral",
        confidence: workoutConfidence,
        metrics: [metric("recent_prs", analysis.trends.recentPrCount, "count")],
      }),
    );

    if (analysis.trainingBalance.muscleShares.length > 0) {
      insights.push(
        insight("training_balance", {
          category: "balance",
          priority: analysis.trainingBalance.balancePercent < 50 ? "medium" : "low",
          direction: analysis.trainingBalance.balancePercent >= 67 ? "positive" : "neutral",
          confidence: workoutConfidence,
          metrics: [metric("major_muscles_trained", 6 - analysis.trainingBalance.skippedMuscles.length, "count"), metric("balance", analysis.trainingBalance.balancePercent, "percent")],
        }),
      );
      if (analysis.trainingBalance.skippedMuscles.length > 0) {
        insights.push(
          insight("skipped_muscle_groups", {
            category: "balance",
            priority: analysis.trainingBalance.skippedMuscles.length >= 4 ? "high" : "medium",
            direction: "negative",
            confidence: workoutConfidence,
            metrics: [metric("skipped_muscle_groups", analysis.trainingBalance.skippedMuscles.length, "count")],
            subject: { name: analysis.trainingBalance.skippedMuscles[0] },
          }),
        );
      }
    }

    if (analysis.fatigue.averageRecoveryDays > 0 || analysis.fatigue.shortRecoveryCount > 0) {
      insights.push(
        insight("recovery_spacing", {
          category: "recovery",
          priority: analysis.fatigue.risk === "high" ? "high" : analysis.fatigue.risk === "moderate" ? "medium" : "low",
          direction: analysis.fatigue.risk === "low" ? "positive" : "negative",
          confidence: workoutConfidence,
          metrics: [metric("average_recovery", analysis.fatigue.averageRecoveryDays, "days"), metric("short_recovery_intervals", analysis.fatigue.shortRecoveryCount, "count")],
        }),
      );
    }

    if (analysis.program) {
      insights.push(
        insight("program_adherence", {
          category: "program",
          priority: analysis.program.adherencePercent < 70 ? "medium" : "low",
          direction: analysis.program.adherencePercent >= 85 ? "positive" : "neutral",
          confidence: analysis.program.expectedDays > 0 ? 0.85 : 0.55,
          metrics: [metric("program_adherence", analysis.program.adherencePercent, "percent"), metric("program_days_completed", analysis.program.completedDays, "count")],
        }),
      );
      if (analysis.program.missedDays > 0) {
        insights.push(
          insight("missed_planned_workouts", {
            category: "program",
            priority: analysis.program.missedDays >= 2 ? "high" : "medium",
            direction: "negative",
            confidence: 0.72,
            metrics: [metric("missed_planned_workouts", analysis.program.missedDays, "count")],
          }),
        );
      }
    }

    return insights.sort(
      (left, right) =>
        PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority] ||
        right.confidence - left.confidence,
    );
  }
}

const RECOMMENDATION_TITLES: Record<CoachInsightType, string> = {
  strength_progress: "Keep the progression pattern",
  plateau: "Review the stalled lift",
  skipped_muscle_groups: "Restore training balance",
  program_adherence: "Continue the current program",
  workout_consistency: "Protect a repeatable schedule",
  pr_frequency: "Keep building a strength baseline",
  volume_trends: "Review recent training volume",
  training_balance: "Balance the next training block",
  recovery_spacing: "Create more recovery space",
  workout_frequency: "Schedule the next session",
  missed_planned_workouts: "Resume the next planned workout",
};

export class RecommendationEngine {
  generate(insights: readonly CoachInsight[]): CoachRecommendation[] {
    return insights.map((source) => ({
      id: `recommendation-${source.id}`,
      title: RECOMMENDATION_TITLES[source.type],
      priority: source.priority,
      category: source.category,
      supportingMetrics: source.metrics,
      confidence: source.confidence,
      suggestedAction:
        source.type === "plateau" || source.type === "volume_trends"
          ? { type: "review_training_load", target: source.subject?.name }
          : source.type === "skipped_muscle_groups" || source.type === "training_balance"
            ? { type: "train_muscle_group", target: source.subject?.name }
            : source.type === "recovery_spacing"
              ? { type: "add_recovery_day" }
              : source.type === "workout_frequency" || source.type === "workout_consistency"
                ? { type: "schedule_session" }
                : source.type === "program_adherence" || source.type === "missed_planned_workouts"
                  ? { type: "continue_plan" }
                  : source.confidence < 0.55
                    ? { type: "build_baseline" }
                    : { type: "continue_plan", target: source.subject?.name },
      sourceInsightType: source.type,
    }));
  }
}

export function createCoachReport(input: {
  workouts: readonly CoachWorkout[];
  program?: CoachProgramContext | null;
  now?: Date;
}): CoachReport {
  const now = input.now ?? new Date();
  const analysis = analyzeCoachInputs(input.workouts, input.program, now);
  const insights = new InsightEngine().generate(analysis);
  const recommendations = new RecommendationEngine().generate(insights);
  return {
    generatedAt: now,
    insights,
    recommendations,
    topInsight: insights[0] ?? null,
    topRecommendation: recommendations[0] ?? null,
  };
}

