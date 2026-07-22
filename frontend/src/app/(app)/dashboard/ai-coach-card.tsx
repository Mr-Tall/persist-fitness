import Link from "next/link";
import type { CoachInsight, CoachReport } from "@/lib/ai-coach";

const INSIGHT_LABELS: Record<CoachInsight["type"], string> = {
  strength_progress: "Strength is progressing",
  plateau: "A lift may be plateauing",
  skipped_muscle_groups: "A muscle group needs attention",
  program_adherence: "Program adherence",
  workout_consistency: "Workout consistency",
  pr_frequency: "Personal record frequency",
  volume_trends: "Training volume trend",
  training_balance: "Training balance",
  recovery_spacing: "Recovery spacing",
  workout_frequency: "Workout frequency",
  missed_planned_workouts: "Missed planned workouts",
};

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}% confidence`;
}

export function AiCoachCard({
  headingId,
  report,
}: {
  headingId: string;
  report: CoachReport;
}) {
  const insight = report.topInsight;
  const recommendation = report.topRecommendation;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-5 rounded-2xl border border-info/20 bg-info-soft p-4 md:mt-6 md:rounded-[2rem] md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-info">
            AI Coach
          </p>
          <h2 id={headingId} className="mt-1 text-lg font-black text-text-primary md:text-xl">
            Training intelligence
          </h2>
        </div>
        {insight && (
          <span className="shrink-0 rounded-full border border-info/20 px-2.5 py-1 text-xs font-bold text-text-secondary">
            {formatConfidence(insight.confidence)}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/70 p-3">
          <p className="text-xs font-bold text-text-muted">Top insight</p>
          <p className="mt-1 font-black text-text-primary">
            {insight ? INSIGHT_LABELS[insight.type] : "Build your training baseline"}
          </p>
          {insight?.subject && (
            <p className="mt-1 truncate text-sm text-text-secondary">
              {insight.subject.name}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface/70 p-3">
          <p className="text-xs font-bold text-text-muted">Top recommendation</p>
          <p className="mt-1 font-black text-text-primary">
            {recommendation?.title ?? "Complete workouts to unlock recommendations"}
          </p>
        </div>
      </div>

      <Link
        href="/progress"
        className="mt-3 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-text-primary transition hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        View more coaching insights
      </Link>
    </section>
  );
}
