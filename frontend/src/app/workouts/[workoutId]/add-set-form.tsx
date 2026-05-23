import { addSetToExercise } from "@/app/actions/workout-exercises";

type AddSetFormProps = {
  workoutId: string;
  workoutExerciseId: string;
};

export function AddSetForm({ workoutId, workoutExerciseId }: AddSetFormProps) {
  return (
    <form action={addSetToExercise} className="mt-4 grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-6">
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

      <div>
        <label className="block text-xs font-medium text-neutral-500">Reps</label>
        <input
          name="reps"
          type="number"
          min="0"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500">Weight</label>
        <input
          name="weight"
          type="number"
          min="0"
          step="0.5"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500">RIR</label>
        <input
          name="rir"
          type="number"
          min="0"
          max="10"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500">Tempo</label>
        <input
          name="tempo"
          placeholder="3-1-1"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500">Notes</label>
        <input
          name="notes"
          placeholder="Optional"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600"
        >
          Add set
        </button>
      </div>
    </form>
  );
}