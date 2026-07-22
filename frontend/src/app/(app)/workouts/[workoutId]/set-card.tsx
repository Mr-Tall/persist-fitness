"use client";

import { deleteSetFromExercise } from "@/app/actions/workout-exercises";
import { DeleteInlineButton } from "./delete-inline-button";
import { EditSetForm } from "./edit-set-form";
import type { WorkoutSetForPage } from "./workout-page-types";
import { useSavedSetFeedback } from "./saved-set-feedback";
import { formatTrackedSet, normalizeTrackingType } from "@/lib/exercise-tracking";
import { isTemporarySetId } from "@/lib/offline-workout/types";
import { useOfflineWorkout } from "./workout-experience-provider";

type SetPrStatus = {
  isPersonalRecord: boolean;
  estimatedOneRepMax: number | null;
  recordLabel?: string | null;
};

type SetCardProps = {
  workoutId: string;
  workoutExerciseId?: string;
  set: WorkoutSetForPage;
  prStatus?: SetPrStatus;
  editable?: boolean;
  trackingType?: string | null;
};

export function SetCard({
  workoutId,
  workoutExerciseId = "",
  set,
  prStatus,
  editable = true,
  trackingType,
}: SetCardProps) {
  const mode = normalizeTrackingType(trackingType);
  const offline = useOfflineWorkout();
  const { savedSetNumber } = useSavedSetFeedback();
  const isRecentlySaved = savedSetNumber === set.setNumber;
  const weightLabel =
    set.weight !== null ? `${set.weight} pounds` : "Weight not logged";
  const repsLabel = set.reps !== null ? `${set.reps} reps` : "Reps not logged";
  const trackedLabel = formatTrackedSet(mode, set);
  const estimatedOneRepMax = Math.round(
    prStatus?.estimatedOneRepMax ?? 0
  );
  const hasMetadata =
    set.rir !== null || Boolean(set.tempo) || Boolean(set.notes);

  return (
    <article
      aria-labelledby={`set-${set.id}-title`}
      className={`rounded-2xl border p-3 transition-colors duration-300 motion-reduce:transition-none sm:p-4 ${
        isRecentlySaved
          ? "border-success/70 bg-success-soft"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <p
        role="status"
        aria-label={isRecentlySaved ? `Set ${set.setNumber} saved` : undefined}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isRecentlySaved ? `Set ${set.setNumber} saved` : ""}
      </p>

      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success text-base font-black text-black"
        >
          {set.setNumber}
        </div>

        <div className="min-w-0 flex-1">
          <h4
            id={`set-${set.id}-title`}
            className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500"
          >
            Set {set.setNumber}
          </h4>
          <p
            aria-label={
              mode === "weight_reps"
                ? `${weightLabel} by ${repsLabel}`
                : trackedLabel
            }
            className="mt-0.5 break-words text-xl font-black leading-tight text-white sm:text-2xl"
          >
            {mode !== "weight_reps" && <span aria-hidden="true">{trackedLabel}</span>}
            <span aria-hidden="true" className={mode === "weight_reps" ? undefined : "hidden"}>
              {set.weight !== null ? `${set.weight} lb` : "—"}{" "}
              <span className="text-neutral-500">×</span> {set.reps ?? "—"}
            </span>
          </p>
        </div>

        {isRecentlySaved && (
          <span
            aria-hidden="true"
            className="shrink-0 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-black text-success"
          >
            Saved
          </span>
        )}
      </div>

      {hasMetadata && (
        <dl className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 pl-[3.25rem] text-xs leading-5 text-neutral-400">
          {set.rir !== null && (
            <div className="inline-flex gap-1">
              <dt className="font-bold text-neutral-500">RIR</dt>
              <dd className="font-semibold text-neutral-300">{set.rir}</dd>
            </div>
          )}

          {set.tempo && (
            <div className="inline-flex min-w-0 gap-1">
              <dt className="font-bold text-neutral-500">Tempo</dt>
              <dd className="break-words font-semibold text-neutral-300">
                {set.tempo}
              </dd>
            </div>
          )}

          {set.notes && (
            <div className="flex min-w-0 basis-full gap-1">
              <dt className="shrink-0 font-bold text-neutral-500">Notes</dt>
              <dd className="min-w-0 break-words font-medium text-neutral-300">
                {set.notes}
              </dd>
            </div>
          )}
        </dl>
      )}

      {prStatus?.isPersonalRecord && (
        <p
          role="status"
          aria-label={
            prStatus.recordLabel
              ? `New personal record. ${prStatus.recordLabel}.`
              : `New personal record. Estimated one rep max ${estimatedOneRepMax} pounds.`
          }
          className="mt-2 ml-[3.25rem] inline-flex max-w-[calc(100%_-_3.25rem)] flex-wrap items-center gap-x-1 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-black text-success"
        >
          <span>New PR</span>
          <span aria-hidden="true">·</span>
          <span>{prStatus.recordLabel ?? `Est. 1RM ${estimatedOneRepMax} lb`}</span>
        </p>
      )}

      {editable && (
        <div className="mt-2 flex min-h-11 flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] pt-2">
          <EditSetForm
            workoutId={workoutId}
            workoutExerciseId={workoutExerciseId}
            set={set}
            trackingType={mode}
          />

          <form
            action={deleteSetFromExercise}
            onSubmit={(event) => {
              if (offline && (!navigator.onLine || isTemporarySetId(set.id))) {
                event.preventDefault();
                void offline.deleteSetOffline(workoutExerciseId, set.id);
              } else {
                offline?.markSaving();
              }
            }}
          >
            <input type="hidden" name="workoutId" value={workoutId} />
            <input type="hidden" name="workoutSetId" value={set.id} />
            <DeleteInlineButton
              label="Delete"
              accessibleLabel={`Delete set ${set.setNumber}`}
              confirmMessage={`Delete set ${set.setNumber}?`}
            />
          </form>
          {set.pending && (
            <span className="text-xs font-bold text-warning">Pending sync</span>
          )}
        </div>
      )}
    </article>
  );
}
