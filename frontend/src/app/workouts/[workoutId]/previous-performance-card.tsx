import { formatWorkoutDate } from "@/lib/format-date";
import type { PreviousPerformance } from "@/lib/previous-performance";

type PreviousPerformanceCardProps = {
  previous: PreviousPerformance | null;
};

export function PreviousPerformanceCard({
  previous,
}: PreviousPerformanceCardProps) {
  if (!previous) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm font-medium text-neutral-700">
          No previous performance found
        </p>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Once you log this exercise again, Persist Fitness will show your last
          performance here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-950">
            Previous performance
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            {previous.workoutTitle} · {formatWorkoutDate(previous.workoutDate)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {previous.sets.map((set) => (
          <div
            key={set.setNumber}
            className="rounded-xl bg-white px-3 py-2 text-sm text-neutral-700"
          >
            <span className="font-semibold">Set {set.setNumber}:</span>{" "}
            {set.reps ?? "—"} reps
            {set.weight !== null ? ` · ${set.weight} lb` : ""}
            {set.rir !== null ? ` · RIR ${set.rir}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}