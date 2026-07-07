import { deleteSetFromExercise } from "@/app/actions/workout-exercises";
import { DeleteInlineButton } from "@/app/workouts/[workoutId]/delete-inline-button";
import { Card } from "@/components/ui/card";
import { MetricBadge } from "@/components/ui/metric-badge";
import { EditSetForm } from "./edit-set-form";
import type { WorkoutSetForPage } from "./workout-page-types";

type SetPrStatus = {
  isPersonalRecord: boolean;
  estimatedOneRepMax: number | null;
};

type SetCardProps = {
  workoutId: string;
  set: WorkoutSetForPage;
  prStatus?: SetPrStatus;
};

export function SetCard({ workoutId, set, prStatus }: SetCardProps) {
  return (
    <Card className="rounded-3xl bg-white/[0.05] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-black text-black">
            {set.setNumber}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
              Set {set.setNumber}
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {set.weight !== null ? `${set.weight} lb` : "—"}{" "}
              <span className="text-neutral-500">×</span> {set.reps ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EditSetForm workoutId={workoutId} set={set} />

          <form action={deleteSetFromExercise}>
            <input type="hidden" name="workoutId" value={workoutId} />
            <input type="hidden" name="workoutSetId" value={set.id} />
            <DeleteInlineButton
              label="Delete"
              confirmMessage={`Delete set ${set.setNumber}?`}
            />
          </form>
        </div>
      </div>

      {prStatus?.isPersonalRecord && (
        <div className="mt-4">
          <MetricBadge variant="amber">
            New PR 🎉 est. 1RM{" "}
            {Math.round(prStatus.estimatedOneRepMax ?? 0)} lb
          </MetricBadge>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs sm:grid-cols-4">
        <Card className="rounded-2xl bg-black/20 p-3">
          <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
            Reps
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {set.reps ?? "—"}
          </p>
        </Card>

        <Card className="rounded-2xl bg-black/20 p-3">
          <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
            RIR
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {set.rir ?? "—"}
          </p>
        </Card>

        <Card className="rounded-2xl bg-black/20 p-3">
          <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
            Tempo
          </p>
          <p className="mt-1 truncate text-lg font-black text-white">
            {set.tempo || "—"}
          </p>
        </Card>

        <Card className="col-span-3 rounded-2xl bg-black/20 p-3 sm:col-span-1">
          <p className="font-bold uppercase tracking-[0.16em] text-neutral-500">
            Notes
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">
            {set.notes || "—"}
          </p>
        </Card>
      </div>
    </Card>
  );
}