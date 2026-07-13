import { formatWorkoutDate } from "@/lib/format-date";
import type { PreviousPerformance } from "@/lib/previous-performance";
import { getProgressionSuggestion } from "@/lib/progression-suggestions";

type PreviousPerformanceCardProps = {
  previous: PreviousPerformance | null;
};

function getPrimarySet(previous: PreviousPerformance) {
  const completeSets = previous.sets.filter(
    (set) => set.weight !== null && set.reps !== null
  );

  return completeSets.reduce<(typeof previous.sets)[number] | null>(
    (bestSet, set) => {
      if (!bestSet) {
        return set;
      }

      return (set.weight ?? 0) * (set.reps ?? 0) >
        (bestSet.weight ?? 0) * (bestSet.reps ?? 0)
        ? set
        : bestSet;
    },
    null
  ) ?? previous.sets[0] ?? null;
}

function getSetValue(set: PreviousPerformance["sets"][number]) {
  const visibleWeight = set.weight !== null ? `${set.weight} lb` : "—";
  const visibleReps = set.reps !== null ? set.reps : "—";
  const accessibleWeight =
    set.weight !== null ? `${set.weight} pounds` : "Weight not logged";
  const accessibleReps =
    set.reps !== null ? `${set.reps} reps` : "Reps not logged";

  return {
    visible: `${visibleWeight} × ${visibleReps}`,
    accessible: `${accessibleWeight} by ${accessibleReps}`,
  };
}

export function PreviousPerformanceCard({
  previous,
}: PreviousPerformanceCardProps) {
  const suggestion = getProgressionSuggestion(previous);

  if (!previous) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm leading-5 text-neutral-400">
        No previous sets yet. This session will become your reference.
      </p>
    );
  }

  const primarySet = getPrimarySet(previous);
  const primaryValue = primarySet ? getSetValue(primarySet) : null;

  return (
    <section
      aria-label="Previous performance"
      className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20"
    >
      <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
            Last session
          </p>

          {primaryValue ? (
            <p
              aria-label={primaryValue.accessible}
              className="mt-0.5 break-words text-lg font-black leading-tight text-white"
            >
              <span aria-hidden="true">{primaryValue.visible}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm font-bold text-neutral-300">
              Previous sets logged
            </p>
          )}
        </div>

        <p className="shrink-0 text-right text-xs font-medium text-neutral-500">
          {formatWorkoutDate(previous.workoutDate)}
        </p>
      </div>

      {suggestion && (
        <div className="border-t border-white/[0.08] px-3 py-2">
          <p className="text-xs leading-5 text-neutral-300">
            <span className="font-black text-amber-300">Suggested next:</span>{" "}
            {suggestion.message}
          </p>
        </div>
      )}

      <details className="group border-t border-white/[0.08]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-bold text-neutral-300 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300/40 [&::-webkit-details-marker]:hidden">
          <span>View previous sets</span>
          <span className="text-xs font-medium text-neutral-500">
            {previous.sets.length} {previous.sets.length === 1 ? "set" : "sets"}
          </span>
        </summary>

        <div className="border-t border-white/[0.08] px-3 py-3">
          <p className="break-words text-xs leading-5 text-neutral-500">
            <span className="font-bold text-neutral-300">
              {previous.workoutTitle}
            </span>{" "}
            · {previous.exerciseName}
          </p>

          {previous.sets.length > 0 && (
            <ol className="mt-2 space-y-1.5" aria-label="Previous sets">
              {previous.sets.map((set) => {
                const setValue = getSetValue(set);

                return (
                  <li
                    key={set.setNumber}
                    className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl bg-white/[0.05] px-3 py-2 text-sm"
                  >
                    <span className="shrink-0 font-bold text-neutral-500">
                      Set {set.setNumber}
                    </span>
                    <span
                      aria-label={setValue.accessible}
                      className="min-w-0 break-words font-bold text-neutral-200"
                    >
                      <span aria-hidden="true">{setValue.visible}</span>
                      {set.rir !== null && (
                        <span className="ml-2 text-xs font-medium text-neutral-400">
                          RIR {set.rir}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </details>
    </section>
  );
}
