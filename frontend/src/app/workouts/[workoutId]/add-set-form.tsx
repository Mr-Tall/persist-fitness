import { addSetToExercise } from "@/app/actions/workout-exercises";
import { SubmitButton } from "@/components/ui/submit-button";

type AddSetFormProps = {
  workoutId: string;
  workoutExerciseId: string;
};

export function AddSetForm({ workoutId, workoutExerciseId }: AddSetFormProps) {
  return (
    <form
      action={addSetToExercise}
      className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4"
    >
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
          Log next set
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          Fast entry for reps, load, effort, and notes.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            Reps
          </label>
          <input
            name="reps"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="8"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            Weight
          </label>
          <input
            name="weight"
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            placeholder="225"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            RIR
          </label>
          <input
            name="rir"
            type="number"
            min="0"
            max="10"
            inputMode="numeric"
            placeholder="2"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            Tempo
          </label>
          <input
            name="tempo"
            placeholder="3-1-1"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
            Notes
          </label>
          <input
            name="notes"
            placeholder="Optional"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
          />
        </div>

        <div className="flex items-end">
          <SubmitButton
            pendingText="Saving..."
            className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-black text-black transition hover:bg-emerald-300"
          >
            Save set
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}