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
      className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-6"
    >
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Reps
        </label>
        <input
          name="reps"
          type="number"
          min="0"
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Weight
        </label>
        <input
          name="weight"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          RIR
        </label>
        <input
          name="rir"
          type="number"
          min="0"
          max="10"
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Tempo
        </label>
        <input
          name="tempo"
          placeholder="3-1-1"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
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
          pendingText="Adding..."
          className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-black text-black transition hover:bg-emerald-300"
        >
          Add set
        </SubmitButton>
      </div>
    </form>
  );
}