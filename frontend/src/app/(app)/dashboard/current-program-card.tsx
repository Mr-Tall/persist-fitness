import { startProgramWorkout } from "@/app/actions/programs";
import Link from "next/link";

type CurrentProgramCardProps = {
  hasActiveWorkout: boolean;
  headingId: string;
  program: {
    completionPercent: number;
    currentDay: number;
    currentWeek: number;
    id: string;
    name: string;
    nextWorkout: { id: string; title: string } | null;
  };
};

export function CurrentProgramCard({
  hasActiveWorkout,
  headingId,
  program,
}: CurrentProgramCardProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-text-muted">
            Current program
          </p>
          <h2
            className="mt-1 break-words text-lg font-black text-text-primary"
            id={headingId}
          >
            {program.name}
          </h2>
          <p className="mt-1 text-xs font-bold text-text-secondary">
            Week {program.currentWeek} · Day {program.currentDay}
          </p>
        </div>
        <span className="shrink-0 text-lg font-black text-text-primary">
          {program.completionPercent}%
        </span>
      </div>

      <div
        aria-label={`${program.name} completion`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={program.completionPercent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-action-secondary"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-action"
          style={{ width: `${program.completionPercent}%` }}
        />
      </div>

      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 break-words text-sm text-text-secondary">
          <span className="font-bold text-text-muted">Next workout:</span>{" "}
          {program.nextWorkout?.title ?? "Schedule unavailable"}
        </p>

        {hasActiveWorkout || !program.nextWorkout ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-black text-text-primary hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={`/programs/${program.id}`}
          >
            View schedule
          </Link>
        ) : (
          <form action={startProgramWorkout}>
            <input name="programId" type="hidden" value={program.id} />
            <button
              className="min-h-11 w-full rounded-xl bg-action px-3 py-2 text-xs font-black text-action-foreground hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
              type="submit"
            >
              Start next workout
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
