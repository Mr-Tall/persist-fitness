import Link from "next/link";

import { formatWorkoutDate } from "@/lib/format-date";
import type { ExercisePersonalRecord } from "@/lib/personal-records";

type PersonalRecordListProps = {
  records: ExercisePersonalRecord[];
};

export function PersonalRecordList({ records }: PersonalRecordListProps) {
  return (
    <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      {records.map((record, index) => {
        const idPrefix = `personal-record-${index}`;

        return (
          <li key={`${record.exerciseName}-${record.workoutId}`}>
            <Link
              href={`/workouts/${record.workoutId}`}
              aria-labelledby={`${idPrefix}-view ${idPrefix}-exercise ${idPrefix}-record ${idPrefix}-result ${idPrefix}-estimate ${idPrefix}-source`}
              className="flex min-h-16 items-start gap-3 p-4 transition hover:bg-amber-300/[0.05] active:bg-amber-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200 sm:p-5"
            >
              <span id={`${idPrefix}-view`} className="sr-only">
                View
              </span>

              <div className="min-w-0 flex-1">
                <h3
                  id={`${idPrefix}-exercise`}
                  className="break-words font-black leading-5 text-white [overflow-wrap:anywhere]"
                >
                  {record.exerciseName}
                </h3>
                <span id={`${idPrefix}-record`} className="sr-only">
                  record workout.
                </span>

                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p
                    id={`${idPrefix}-result`}
                    className="break-words text-base font-black text-white [overflow-wrap:anywhere]"
                  >
                    {record.weight.toLocaleString()} lb &times;{" "}
                    {record.reps.toLocaleString()} reps
                  </p>
                  <p
                    id={`${idPrefix}-estimate`}
                    className="break-words text-xs font-bold text-amber-200 [overflow-wrap:anywhere]"
                  >
                    Estimated 1RM{" "}
                    {Math.round(record.estimatedOneRepMax).toLocaleString()} lb
                  </p>
                </div>

                <p
                  id={`${idPrefix}-source`}
                  className="mt-1 line-clamp-2 break-words text-xs leading-5 text-neutral-400 [overflow-wrap:anywhere]"
                >
                  {record.workoutTitle} &middot;{" "}
                  {formatWorkoutDate(record.workoutDate)}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-xl text-amber-200/60"
              >
                &rsaquo;
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
